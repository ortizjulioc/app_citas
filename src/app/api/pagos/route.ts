// @ts-nocheck
import prisma from '@/utils/lib/prisma'
import { registrarPagoSchema } from '@/app/schemas/pago.schema'
import { handleApiError, successResponse, createdResponse } from '@/utils/api-response'
import { verifyToken, JwtPayload } from '@/utils/lib/jwt'
import { BadRequestError, NotFoundError } from '@/utils/errors'

function getUserFromRequest(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  return verifyToken(token)
}

// GET /api/pagos — listar pagos del negocio
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
    const facturaId = searchParams.get('facturaId')
    const sesionCajaId = searchParams.get('sesionCajaId')

    const where: any = { negocioId: user.negocioId, deleted: false }
    if (facturaId) where.facturaId = facturaId
    if (sesionCajaId) where.sesionCajaId = sesionCajaId

    const [pagos, total] = await Promise.all([
      prisma.pago.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          factura: { select: { id: true, numeroFactura: true } },
          metodoPago: { select: { id: true, nombre: true, esEfectivo: true } },
          usuario: { select: { id: true, nombre: true, apellido: true } }
        }
      }),
      prisma.pago.count({ where })
    ])

    return successResponse({ pagos, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/pagos — registrar un pago
export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const body = await request.json()
    const data = await registrarPagoSchema.validate(body, { abortEarly: false, stripUnknown: true })

    // Verificar factura
    const factura = await prisma.factura.findFirst({
      where: { id: data.facturaId, negocioId: user.negocioId, deleted: false }
    })
    if (!factura) throw new NotFoundError('Factura no encontrada')
    if (factura.estado === 'CANCELADA') throw new BadRequestError('No se puede pagar una factura cancelada')
    if (factura.estado === 'PAGADA') throw new BadRequestError('La factura ya está completamente pagada')

    // Verificar que el monto no exceda el saldo
    const saldoPendiente = Math.round((factura.total - factura.montoPagado) * 100) / 100
    if (data.monto > saldoPendiente + 0.01) {
      throw new BadRequestError(`El monto (${data.monto}) excede el saldo pendiente (${saldoPendiente})`)
    }

    // Verificar método de pago
    const metodoPago = await prisma.metodoPago.findFirst({
      where: { id: data.metodoPagoId, negocioId: user.negocioId, deleted: false }
    })
    if (!metodoPago) throw new NotFoundError('Método de pago no encontrado')

    // Verificar sesión de caja si es efectivo
    let sesionCaja = null
    if (data.sesionCajaId) {
      sesionCaja = await prisma.sesionCaja.findFirst({
        where: { id: data.sesionCajaId, negocioId: user.negocioId, deleted: false },
        include: { caja: true }
      })
      if (!sesionCaja) throw new NotFoundError('Sesión de caja no encontrada')
      if (sesionCaja.horaCierre) throw new BadRequestError('La sesión de caja ya está cerrada')
    }

    // Si el método es efectivo y no se envió sesionCajaId, buscar sesión abierta automáticamente
    let sesionCajaId = data.sesionCajaId || null
    if (metodoPago.esEfectivo && !sesionCajaId) {
      const sesionAbierta = await prisma.sesionCaja.findFirst({
        where: {
          negocioId: user.negocioId,
          deleted: false,
          horaCierre: null
        },
        orderBy: { horaApertura: 'desc' }
      })
      if (sesionAbierta) sesionCajaId = sesionAbierta.id
    }

    const nuevoPagado = Math.round((factura.montoPagado + data.monto) * 100) / 100
    const nuevoEstado = nuevoPagado >= factura.total - 0.01 ? 'PAGADA' : nuevoPagado > 0 ? 'PARCIAL' : 'PENDIENTE'

    const pago = await prisma.$transaction(async tx => {
      // Crear el pago
      const nuevoPago = await tx.pago.create({
        data: {
          facturaId: data.facturaId,
          metodoPagoId: data.metodoPagoId,
          sesionCajaId,
          monto: data.monto,
          referencia: data.referencia || null,
          estado: 'COMPLETADO',
          negocioId: user.negocioId,
          createdBy: user.userId
        }
      })

      // Actualizar montoPagado y estado en la factura
      await tx.factura.update({
        where: { id: data.facturaId },
        data: { montoPagado: nuevoPagado, estado: nuevoEstado }
      })

      // Si el método es efectivo y hay sesión de caja, crear MovimientoCaja
      if (metodoPago.esEfectivo && sesionCajaId) {
        await tx.movimientoCaja.create({
          data: {
            sesionCajaId,
            tipo: 'INGRESO',
            monto: data.monto,
            descripcion: `Pago factura ${factura.numeroFactura}`,
            negocioId: user.negocioId,
            pagoId: nuevoPago.id,
            metodoPagoId: data.metodoPagoId
          }
        })
      }

      // Actualizar totalGastado del cliente en ClienteNegocio si la factura quedó PAGADA
      if (nuevoEstado === 'PAGADA') {
        await tx.clienteNegocio.upsert({
          where: { clienteId_negocioId: { clienteId: factura.clienteId, negocioId: user.negocioId } },
          update: {
            totalGastado: { increment: factura.total },
            ultimaVisita: new Date()
          },
          create: {
            clienteId: factura.clienteId,
            negocioId: user.negocioId,
            totalGastado: factura.total,
            ultimaVisita: new Date()
          }
        })
      }

      return nuevoPago
    })

    const pagoCompleto = await prisma.pago.findUnique({
      where: { id: pago.id },
      include: {
        factura: { select: { id: true, numeroFactura: true, total: true, montoPagado: true, estado: true } },
        metodoPago: { select: { id: true, nombre: true } }
      }
    })

    return createdResponse(pagoCompleto)
  } catch (error) {
    return handleApiError(error)
  }
}
