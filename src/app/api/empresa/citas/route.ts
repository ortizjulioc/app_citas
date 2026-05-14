import prisma from '@/utils/lib/prisma'
import { handleApiError, successResponse } from '@/utils/api-response'
import { verifyToken, JwtPayload } from '@/utils/lib/jwt'

function getUserFromRequest(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  return verifyToken(token)
}

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new Error('No autorizado'))
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const sucursalId = searchParams.get('sucursalId')
    const empleadoId = searchParams.get('empleadoId')
    const estado = searchParams.get('estado')
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')

    const sucursales = await prisma.sucursal.findMany({
      where: { negocioId: user.negocioId, deleted: false },
      select: { id: true }
    })
    const sucursalIds = sucursales.map(s => s.id)

    if (sucursalIds.length === 0) {
      return successResponse({
        citas: [],
        pagination: { total: 0, page, totalPages: 0 }
      })
    }

    const where: any = {
      deleted: false,
      sucursalId: { in: sucursalIds }
    }

    if (sucursalId) where.sucursalId = sucursalId
    if (empleadoId) where.empleadoId = empleadoId
    if (estado) where.estado = estado

    if (fechaInicio || fechaFin) {
      where.inicio = {}
      if (fechaInicio) where.inicio.gte = new Date(fechaInicio)
      if (fechaFin) where.inicio.lte = new Date(fechaFin)
    }

    const [citas, total] = await Promise.all([
      prisma.cita.findMany({
        skip,
        take: limit,
        where,
        orderBy: { inicio: 'desc' },
        include: {
          cliente: {
            select: { id: true, nombre: true, apellido: true, telefono: true, email: true }
          },
          empleado: {
            select: { id: true, nombre: true, apellido: true }
          },
          sucursal: {
            select: { id: true, nombre: true }
          },
          servicioCitas: {
            include: {
              servicio: {
                select: { id: true, nombre: true }
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
  } catch (error) {
    return handleApiError(error)
  }
}
