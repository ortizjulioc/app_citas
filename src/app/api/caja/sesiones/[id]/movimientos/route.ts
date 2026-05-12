// @ts-nocheck
import prisma from '@/utils/lib/prisma'
import { movimientoManualSchema } from '@/app/schemas/caja.schema'
import { handleApiError, successResponse, createdResponse } from '@/utils/api-response'
import { verifyToken, JwtPayload } from '@/utils/lib/jwt'
import { BadRequestError, NotFoundError } from '@/utils/errors'

function getUserFromRequest(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  return verifyToken(token)
}

// GET /api/caja/sesiones/[id]/movimientos — listar movimientos de una sesión
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const sesion = await prisma.sesionCaja.findFirst({
      where: { id: params.id, negocioId: user.negocioId, deleted: false }
    })
    if (!sesion) throw new NotFoundError('Sesión de caja no encontrada')

    const movimientos = await prisma.movimientoCaja.findMany({
      where: { sesionCajaId: params.id, deleted: false },
      orderBy: { createdAt: 'asc' },
      include: {
        metodoPago: { select: { id: true, nombre: true } },
        pago: {
          select: {
            id: true,
            factura: { select: { id: true, numeroFactura: true } }
          }
        }
      }
    })

    return successResponse({ movimientos })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/caja/sesiones/[id]/movimientos — registrar gasto o retiro manual
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const body = await request.json()
    const data = await movimientoManualSchema.validate(body, { abortEarly: false, stripUnknown: true })

    const sesion = await prisma.sesionCaja.findFirst({
      where: { id: params.id, negocioId: user.negocioId, deleted: false }
    })
    if (!sesion) throw new NotFoundError('Sesión de caja no encontrada')
    if (sesion.horaCierre) throw new BadRequestError('No se pueden registrar movimientos en una sesión cerrada')

    const movimiento = await prisma.movimientoCaja.create({
      data: {
        sesionCajaId: params.id,
        tipo: data.tipo, // GASTO o RETIRO
        monto: data.monto,
        descripcion: data.descripcion,
        negocioId: user.negocioId
      }
    })

    return createdResponse(movimiento)
  } catch (error) {
    return handleApiError(error)
  }
}
