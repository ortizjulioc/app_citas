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

// GET /api/facturas/[id] — detalle completo de una factura
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const factura = await prisma.factura.findFirst({
      where: {
        id: params.id,
        negocioId: user.negocioId,
        deleted: false
      },
      include: {
        cliente: true,
        sucursal: { select: { id: true, nombre: true } },
        usuario: { select: { id: true, nombre: true, apellido: true } },
        cita: { select: { id: true, inicio: true, fin: true } },
        detalleFacturas: {
          where: { deleted: false },
          include: {
            servicio: { select: { id: true, nombre: true } },
            producto: { select: { id: true, nombre: true } }
          }
        },
        pagos: {
          where: { deleted: false },
          include: {
            metodoPago: { select: { id: true, nombre: true, esEfectivo: true } },
            usuario: { select: { id: true, nombre: true, apellido: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!factura) throw new NotFoundError('Factura no encontrada')

    // Calcular saldo pendiente
    const montoPagadoActivo = factura.pagos
      .filter(p => p.estado === 'COMPLETADO')
      .reduce((acc, p) => acc + p.monto, 0)

    const saldoPendiente = Math.round((factura.total - montoPagadoActivo) * 100) / 100

    return successResponse({ ...factura, saldoPendiente })
  } catch (error) {
    return handleApiError(error)
  }
}
