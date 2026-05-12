// @ts-nocheck
import prisma from '@/utils/lib/prisma'
import { handleApiError, successResponse } from '@/utils/api-response'
import { verifyToken, JwtPayload } from '@/utils/lib/jwt'
import { BadRequestError } from '@/utils/errors'

function getUserFromRequest(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  return verifyToken(token)
}

// GET /api/caja/sesiones — listar sesiones de caja
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
    const cajaId = searchParams.get('cajaId')
    const soloAbiertas = searchParams.get('soloAbiertas') === 'true'
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')

    const where: any = { negocioId: user.negocioId, deleted: false }
    if (cajaId) where.cajaId = cajaId
    if (soloAbiertas) where.horaCierre = null

    if (desde || hasta) {
      where.horaApertura = {}
      if (desde) where.horaApertura.gte = new Date(desde)
      if (hasta) where.horaApertura.lte = new Date(hasta)
    }

    const [sesiones, total] = await Promise.all([
      prisma.sesionCaja.findMany({
        skip,
        take: limit,
        where,
        orderBy: { horaApertura: 'desc' },
        include: {
          caja: { select: { id: true, nombre: true } },
          abiertoPor: { select: { id: true, nombre: true, apellido: true } },
          cerradoPor: { select: { id: true, nombre: true, apellido: true } },
          _count: { select: { movimientoCajas: true, pagos: true } }
        }
      }),
      prisma.sesionCaja.count({ where })
    ])

    return successResponse({
      sesiones,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
