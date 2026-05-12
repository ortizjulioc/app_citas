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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const { id } = await params

    const producto = await prisma.producto.findFirst({
      where: { id, negocioId: user.negocioId, deleted: false }
    })

    if (!producto) {
      return handleApiError(new NotFoundError('Producto no encontrado'))
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const [movimientos, total] = await Promise.all([
      prisma.movimientoProducto.findMany({
        where: { productoId: id, deleted: false },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.movimientoProducto.count({
        where: { productoId: id, deleted: false }
      })
    ])

    return successResponse({
      movimientos,
      producto: { id: producto.id, nombre: producto.nombre },
      pagination: { total, page, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
