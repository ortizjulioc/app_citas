// @ts-nocheck
import prisma from '@/utils/lib/prisma'
import { handleApiError, successResponse } from '@/utils/api-response'
import { verifyToken, JwtPayload } from '@/utils/lib/jwt'
import { BadRequestError, NotFoundError } from '@/utils/errors'

function getUserFromRequest(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  return verifyToken(token)
}

// PATCH /api/pagos/[id]/anular — anula un pago y revierte el movimiento de caja
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const pago = await prisma.pago.findFirst({
      where: { id: params.id, negocioId: user.negocioId, deleted: false },
      include: {
        factura: true,
        movimientoCaja: true,
        metodoPago: true
      }
    })

    if (!pago) throw new NotFoundError('Pago no encontrado')
    if (pago.estado === 'ANULADO') throw new BadRequestError('El pago ya está anulado')
    if (pago.factura.estado === 'CANCELADA') {
      throw new BadRequestError('No se puede anular el pago de una factura cancelada')
    }

    await prisma.$transaction(async (tx) => {
      // Anular el pago
      await tx.pago.update({
        where: { id: params.id },
        data: { estado: 'ANULADO' }
      })

      // Recalcular montoPagado de la factura (sumar solo pagos COMPLETADOS excepto este)
      const pagosActivos = await tx.pago.findMany({
        where: {
          facturaId: pago.facturaId,
          deleted: false,
          estado: 'COMPLETADO',
          id: { not: params.id }
        }
      })
      const nuevoMontoPagado = Math.round(
        pagosActivos.reduce((acc, p) => acc + p.monto, 0) * 100
      ) / 100

      const nuevoEstado =
        nuevoMontoPagado >= pago.factura.total - 0.01
          ? 'PAGADA'
          : nuevoMontoPagado > 0
          ? 'PARCIAL'
          : 'PENDIENTE'

      await tx.factura.update({
        where: { id: pago.facturaId },
        data: { montoPagado: nuevoMontoPagado, estado: nuevoEstado }
      })

      // Si el pago generó un MovimientoCaja, crear uno de reverso (GASTO por el mismo monto)
      if (pago.movimientoCaja && pago.sesionCajaId) {
        // Verificar que la sesión de caja sigue abierta
        const sesion = await tx.sesionCaja.findUnique({ where: { id: pago.sesionCajaId } })
        if (sesion && !sesion.horaCierre) {
          await tx.movimientoCaja.create({
            data: {
              sesionCajaId: pago.sesionCajaId,
              tipo: 'GASTO',
              monto: pago.monto,
              descripcion: `Anulación de pago — Factura ${pago.factura.numeroFactura}`,
              negocioId: user.negocioId,
              metodoPagoId: pago.metodoPagoId
            }
          })
        }
      }

      // Revertir totalGastado en ClienteNegocio si la factura estaba PAGADA
      if (pago.factura.estado === 'PAGADA') {
        await tx.clienteNegocio.updateMany({
          where: { clienteId: pago.factura.clienteId, negocioId: user.negocioId },
          data: { totalGastado: { decrement: pago.factura.total } }
        })
      }
    })

    return successResponse({ mensaje: 'Pago anulado correctamente' })
  } catch (error) {
    return handleApiError(error)
  }
}
