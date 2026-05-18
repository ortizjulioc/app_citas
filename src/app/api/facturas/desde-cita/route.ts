// @ts-nocheck
/**
 * POST /api/facturas/desde-cita
 * Genera una factura automáticamente a partir de una cita FINALIZADA.
 * Toma los servicios de la cita y sus precios de ServicioSucursal.
 * Permite agregar ítems extra (productos u otros servicios).
 */
import prisma from '@/utils/lib/prisma'
import { crearFacturaDesdeCitaSchema } from '@/app/schemas/factura.schema'
import { handleApiError, createdResponse } from '@/utils/api-response'
import { verifyToken, JwtPayload } from '@/utils/lib/jwt'
import { BadRequestError, NotFoundError } from '@/utils/errors'

function getUserFromRequest(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  return verifyToken(token)
}

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

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const body = await request.json()
    const data = await crearFacturaDesdeCitaSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    // Verificar que la cita existe y está FINALIZADA
    const cita = await prisma.cita.findFirst({
      where: { id: data.citaId, deleted: false },
      include: {
        servicioCitas: {
          where: { deleted: false },
          include: { servicio: true }
        },
        cliente: true,
        sucursal: true
      }
    })

    if (!cita) throw new NotFoundError('Cita no encontrada')
    if (cita.estado !== 'FINALIZADA') {
      throw new BadRequestError('Solo se puede facturar una cita en estado FINALIZADA')
    }

    // Verificar que no tiene factura previa (no cancelada)
    const facturaExistente = await prisma.factura.findFirst({
      where: { citaId: data.citaId, deleted: false, estado: { not: 'CANCELADA' } }
    })
    if (facturaExistente) {
      throw new BadRequestError(`Esta cita ya tiene una factura generada (${facturaExistente.numeroFactura})`)
    }

    // Obtener configuración ITBIS del negocio
    const negocio = await prisma.negocio.findUnique({
      where: { id: user.negocioId },
      select: { facturarConItbis: true, tasaItbis: true }
    })

    // Construir ítems desde los servicios de la cita
    const itemsServicio = await Promise.all(
      cita.servicioCitas.map(async sc => {
        // Buscar precio en ServicioSucursal
        const ss = await prisma.servicioSucursal.findUnique({
          where: { servicioId_sucursalId: { servicioId: sc.servicioId, sucursalId: cita.sucursalId } }
        })
        const precio = ss?.precio || 0
        return {
          tipo: 'SERVICIO' as const,
          servicioId: sc.servicioId,
          descripcion: sc.servicio.nombre,
          cantidad: 1,
          precioUnitario: precio,
          descuento: 0
        }
      })
    )

    // Validar y agregar ítems extra
    const itemsExtra = data.itemsExtra || []
    const itemsExtraEnriquecidos = await Promise.all(
      itemsExtra.map(async (item: any) => {
        if (item.tipo === 'PRODUCTO') {
          const producto = await prisma.producto.findFirst({
            where: { id: item.productoId, negocioId: user.negocioId, deleted: false }
          })
          if (!producto) throw new BadRequestError(`Producto ${item.productoId} no encontrado`)
          if (producto.stock < item.cantidad) {
            throw new BadRequestError(`Stock insuficiente para "${producto.nombre}" (disponible: ${producto.stock})`)
          }
          return { ...item, descripcion: item.descripcion || producto.nombre }
        } else {
          const servicio = await prisma.servicio.findFirst({
            where: { id: item.servicioId, negocioId: user.negocioId, deleted: false }
          })
          if (!servicio) throw new BadRequestError(`Servicio ${item.servicioId} no encontrado`)
          return { ...item, descripcion: item.descripcion || servicio.nombre }
        }
      })
    )

    const todosLosItems = [...itemsServicio, ...itemsExtraEnriquecidos]
    const descuentoGlobal = data.descuentos || 0

    const subtotal = todosLosItems.reduce((acc, item) => acc + item.precioUnitario * item.cantidad - item.descuento, 0)
    const baseImponible = Math.max(0, subtotal - descuentoGlobal)
    const itbisAplicado = negocio?.facturarConItbis
      ? Math.round(baseImponible * (negocio.tasaItbis || 0.18) * 100) / 100
      : 0
    const total = Math.round((baseImponible + itbisAplicado) * 100) / 100

    const numeroFactura = await generarNumeroFactura(user.negocioId)

    const factura = await prisma.$transaction(async tx => {
      const nuevaFactura = await tx.factura.create({
        data: {
          numeroFactura,
          clienteId: cita.clienteId,
          sucursalId: data.sucursalId,
          negocioId: user.negocioId,
          citaId: data.citaId,
          subtotal: Math.round(subtotal * 100) / 100,
          descuentos: descuentoGlobal,
          tasaItbis: negocio?.facturarConItbis ? negocio.tasaItbis || 0.18 : 0,
          itbisAplicado,
          total,
          montoPagado: 0,
          estado: 'PENDIENTE',
          notas: data.notas || null,
          createdBy: user.userId
        }
      })

      await tx.detalleFactura.createMany({
        data: todosLosItems.map(item => ({
          facturaId: nuevaFactura.id,
          tipo: item.tipo,
          servicioId: item.tipo === 'SERVICIO' ? item.servicioId : null,
          productoId: item.tipo === 'PRODUCTO' ? (item as any).productoId : null,
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          descuento: item.descuento || 0,
          subtotal: item.precioUnitario * item.cantidad - (item.descuento || 0)
        }))
      })

      // Descontar stock de productos extra
      for (const item of itemsExtraEnriquecidos.filter(i => i.tipo === 'PRODUCTO')) {
        const producto = await tx.producto.findUnique({ where: { id: item.productoId } })
        const cantidadNueva = (producto?.stock || 0) - item.cantidad
        await tx.producto.update({ where: { id: item.productoId }, data: { stock: cantidadNueva } })
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
        cita: { select: { id: true, inicio: true, fin: true } },
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
