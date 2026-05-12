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

// PATCH /api/facturas/[id]/cancelar
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const factura = await prisma.factura.findFirst({
      where: { id: params.id, negocioId: user.negocioId, deleted: false },
      include: {
        pagos: { where: { deleted: false, estado: 'COMPLETADO' } },
        detalleFacturas: { where: { deleted: false, tipo: 'PRODUCTO' } }
      }
    })

    if (!factura) throw new NotFoundError('Factura no encontrada')
    if (factura.estado === 'CANCELADA') {
      throw new BadRequestError('La factura ya está cancelada')
    }
    if (factura.pagos.length > 0) {
      throw new BadRequestError(
        'No se puede cancelar una factura con pagos registrados. Anule primero los pagos.'
      )
    }

    // Revertir stock de productos al cancelar
    await prisma.$transaction(async (tx) => {
      for (const detalle of factura.detalleFacturas) {
        if (detalle.productoId) {
          const producto = await tx.producto.findUnique({ where: { id: detalle.productoId } })
          const cantidadNueva = (producto?.stock || 0) + detalle.cantidad
          await tx.producto.update({
            where: { id: detalle.productoId },
            data: { stock: cantidadNueva }
          })
          await tx.movimientoProducto.create({
            data: {
              productoId: detalle.productoId,
              tipo: 'AJUSTE',
              cantidadAnterior: producto?.stock || 0,
              cantidad: detalle.cantidad,
              cantidadNueva,
              referencia: `Cancelación factura ${factura.numeroFactura}`,
              negocioId: user.negocioId
            }
          })
        }
      }

      await tx.factura.update({
        where: { id: params.id },
        data: { estado: 'CANCELADA' }
      })
    })

    return successResponse({ mensaje: 'Factura cancelada correctamente' })
  } catch (error) {
    return handleApiError(error)
  }
}
