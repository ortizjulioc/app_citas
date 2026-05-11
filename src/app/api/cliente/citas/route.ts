// @ts-nocheck
import prisma from '@/utils/lib/prisma'
import { handleApiError, successResponse } from '@/utils/api-response'
import { verifyToken } from '@/utils/lib/jwt'
import { UnauthorizedError } from '@/utils/errors'

function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  return verifyToken(token)
}

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.email) {
      return handleApiError(new UnauthorizedError())
    }

    const cliente = await prisma.cliente.findFirst({
      where: { email: user.email, deleted: false }
    })

    if (!cliente) {
      return successResponse({ citas: [], pagination: { total: 0, page: 1, totalPages: 0 } })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    const estado = searchParams.get('estado')

    const where: any = {
      clienteId: cliente.id,
      deleted: false
    }

    if (estado) {
      where.estado = estado
    }

    const [citas, total] = await Promise.all([
      prisma.cita.findMany({
        skip,
        take: limit,
        where,
        orderBy: { inicio: 'desc' },
        include: {
          empleado: {
            select: { id: true, nombre: true, apellido: true }
          },
          sucursal: {
            select: { id: true, nombre: true },
            include: {
              negocio: {
                select: { id: true, nombre: true, telefono: true, email: true }
              }
            }
          },
          servicioCitas: {
            include: {
              servicio: {
                select: { id: true, nombre: true, duracionMinutos: true }
              }
            }
          }
        }
      }),
      prisma.cita.count({ where })
    ])

    return successResponse({
      citas,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
