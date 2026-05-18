// @ts-nocheck
import prisma from '@/utils/lib/prisma'
import { crearFacturaSchema } from '@/app/schemas/factura.schema'
import { handleApiError, successResponse, createdResponse } from '@/utils/api-response'
import { verifyToken, JwtPayload } from '@/utils/lib/jwt'
import { BadRequestError, NotFoundError } from '@/utils/errors'

function getUserFromRequest(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  return verifyToken(token)
}

/** Genera el próximo número de factura de forma atómica para el negocio */
async function generarNumeroFactura(negocioId: string): Promise<string> {
  const secuencia = await prisma.secuenciaFactura.upsert({
    where: { negocioId },
    update: { ultimoNumero: { increment: 1 } },
    create: { negocioId, ultimoNumero: 1 }
  })
  const anio = new Date().getFullYear()
  const numero = String(secuencia.ultimoNumero).padStart(5, '0')
  return `FAC-${anio}-${numero}`
}

/** Calcula los montos de la factura a partir de los ítems y configuración del negocio */
function calcularMontos(
  items: Array<{ precioUnitario: number; cantidad: number; descuento: number }>,
  descuentoGlobal: number,
  facturarConItbis: boolean,
  tasaItbis: number
) {
  const subtotal = items.reduce((acc, item) => {
    return acc + item.precioUnitario * item.cantidad - item.descuento
  }, 0)

  const baseImponible = Math.max(0, subtotal - descuentoGlobal)
  const itbisAplicado = facturarConItbis ? Math.round(baseImponible * tasaItbis * 100) / 100 : 0
  const total = baseImponible + itbisAplicado

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    descuentos: Math.round(descuentoGlobal * 100) / 100,
    tasaItbis: facturarConItbis ? tasaItbis : 0,
    itbisAplicado,
    total: Math.round(total * 100) / 100
  }
}

// GET /api/facturas — listar facturas del negocio
export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    const search = searchParams.get('search') || ''
    const estado = searchParams.get('estado')
    const sucursalId = searchParams.get('sucursalId')
    const clienteId = searchParams.get('clienteId')
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')

    const where: any = {
      negocioId: user.negocioId,
      deleted: false
    }

    if (estado) where.estado = estado
    if (sucursalId) where.sucursalId = sucursalId
    if (clienteId) where.clienteId = clienteId

    if (desde || hasta) {
      where.createdAt = {}
      if (desde) where.createdAt.gte = new Date(desde)
      if (hasta) where.createdAt.lte = new Date(hasta)
    }

    if (search) {
      where.OR = [
        { numeroFactura: { contains: search, mode: 'insensitive' } },
        { cliente: { nombre: { contains: search, mode: 'insensitive' } } },
        { cliente: { apellido: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const [facturas, total] = await Promise.all([
      prisma.factura.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          cliente: { select: { id: true, nombre: true, apellido: true, telefono: true } },
          sucursal: { select: { id: true, nombre: true } },
          usuario: { select: { id: true, nombre: true, apellido: true } },
          pagos: {
            where: { deleted: false, estado: 'COMPLETADO' },
            include: { metodoPago: { select: { id: true, nombre: true } } }
          },
          _count: { select: { detalleFacturas: true } }
        }
      }),
      prisma.factura.count({ where })
    ])

    return successResponse({
      facturas,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/facturas — crear factura manualmente
export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const body = await request.json()
    const data = await crearFacturaSchema.validate(body, { abortEarly: false, stripUnknown: true })

    // Validar que cliente existe
    const cliente = await prisma.cliente.findFirst({
      where: { id: data.clienteId, deleted: false }
    })
    if (!cliente) throw new NotFoundError('Cliente no encontrado')

    // Validar que sucursal pertenece al negocio
    const sucursal = await prisma.sucursal.findFirst({
      where: { id: data.sucursalId, negocioId: user.negocioId, deleted: false }
    })
    if (!sucursal) throw new NotFoundError('Sucursal no encontrada')

    // Obtener configuración ITBIS del negocio
    const negocio = await prisma.negocio.findUnique({
      where: { id: user.negocioId },
      select: { facturarConItbis: true, tasaItbis: true }
    })

    // Validar y enriquecer ítems (verificar que servicios/productos existen)
    const itemsEnriquecidos = await Promise.all(
      data.items.map(async (item: any) => {
        if (item.tipo === 'SERVICIO') {
          const servicio = await prisma.servicio.findFirst({
            where: { id: item.servicioId, negocioId: user.negocioId, deleted: false }
          })
          if (!servicio) throw new BadRequestError(`Servicio ${item.servicioId} no encontrado`)
          return { ...item, descripcion: item.descripcion || servicio.nombre }
        } else {
          const producto = await prisma.producto.findFirst({
            where: { id: item.productoId, negocioId: user.negocioId, deleted: false }
          })
          if (!producto) throw new BadRequestError(`Producto ${item.productoId} no encontrado`)
          if (producto.stock < item.cantidad) {
            throw new BadRequestError(`Stock insuficiente para "${producto.nombre}" (disponible: ${producto.stock})`)
          }
          return { ...item, descripcion: item.descripcion || producto.nombre }
        }
      })
    )

    const montos = calcularMontos(
      itemsEnriquecidos,
      data.descuentos || 0,
      negocio?.facturarConItbis || false,
      negocio?.tasaItbis || 0.18
    )

    const numeroFactura = await generarNumeroFactura(user.negocioId)

    // Crear factura con detalles en una transacción
    const factura = await prisma.$transaction(async tx => {
      const nuevaFactura = await tx.factura.create({
        data: {
          numeroFactura,
          clienteId: data.clienteId,
          sucursalId: data.sucursalId,
          negocioId: user.negocioId,
          citaId: data.citaId || null,
          ...montos,
          montoPagado: 0,
          estado: 'PENDIENTE',
          notas: data.notas || null,
          createdBy: user.userId
        }
      })

      // Crear líneas de detalle
      await tx.detalleFactura.createMany({
        data: itemsEnriquecidos.map((item: any) => ({
          facturaId: nuevaFactura.id,
          tipo: item.tipo,
          servicioId: item.tipo === 'SERVICIO' ? item.servicioId : null,
          productoId: item.tipo === 'PRODUCTO' ? item.productoId : null,
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          descuento: item.descuento || 0,
          subtotal: item.precioUnitario * item.cantidad - (item.descuento || 0)
        }))
      })

      // Descontar stock de productos
      for (const item of itemsEnriquecidos.filter((i: any) => i.tipo === 'PRODUCTO')) {
        const producto = await tx.producto.findUnique({ where: { id: item.productoId } })
        const cantidadNueva = (producto?.stock || 0) - item.cantidad
        await tx.producto.update({
          where: { id: item.productoId },
          data: { stock: cantidadNueva }
        })
        await tx.movimientoProducto.create({
          data: {
            productoId: item.productoId,
            tipo: 'SALIDA',
            cantidadAnterior: producto?.stock || 0,
            cantidad: item.cantidad,
            cantidadNueva,
            referencia: `Factura ${numeroFactura}`,
            negocioId: user.negocioId
          }
        })
      }

      return nuevaFactura
    })

    const facturaCompleta = await prisma.factura.findUnique({
      where: { id: factura.id },
      include: {
        cliente: { select: { id: true, nombre: true, apellido: true } },
        sucursal: { select: { id: true, nombre: true } },
        detalleFacturas: {
          include: {
            servicio: { select: { id: true, nombre: true } },
            producto: { select: { id: true, nombre: true } }
          }
        }
      }
    })

    return createdResponse(facturaCompleta)
  } catch (error) {
    return handleApiError(error)
  }
}
