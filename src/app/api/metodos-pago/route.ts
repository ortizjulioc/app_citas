// @ts-nocheck
import prisma from '@/utils/lib/prisma'
import { crearMetodoPagoSchema } from '@/app/schemas/caja.schema'
import { handleApiError, successResponse, createdResponse } from '@/utils/api-response'
import { verifyToken, JwtPayload } from '@/utils/lib/jwt'
import { BadRequestError } from '@/utils/errors'

function getUserFromRequest(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  return verifyToken(token)
}

// GET /api/metodos-pago — listar métodos de pago del negocio
export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const metodoPagos = await prisma.metodoPago.findMany({
      where: { negocioId: user.negocioId, deleted: false },
      orderBy: { nombre: 'asc' }
    })

    return successResponse({ metodoPagos })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/metodos-pago — crear método de pago
export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const body = await request.json()
    const data = await crearMetodoPagoSchema.validate(body, { abortEarly: false, stripUnknown: true })

    const metodoPago = await prisma.metodoPago.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        esEfectivo: data.esEfectivo || false,
        negocioId: user.negocioId
      }
    })

    return createdResponse(metodoPago)
  } catch (error) {
    return handleApiError(error)
  }
}
