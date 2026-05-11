import prisma from '@/utils/lib/prisma'
import { handleApiError, successResponse, forbiddenResponse } from '@/utils/api-response'
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

    if (!user) {
      return forbiddenResponse('No autorizado')
    }

    if (!user.roles.includes('empleado')) {
      return forbiddenResponse('Acceso permitido solo para empleados')
    }

    const empleado = await prisma.empleado.findFirst({
      where: { usuarioId: user.userId, deleted: false }
    })

    if (!empleado) {
      return forbiddenResponse('Empleado no encontrado')
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    const estado = searchParams.get('estado')
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')

    const where: any = {
      empleadoId: empleado.id,
      deleted: false
    }

    if (estado) {
      where.estado = estado
    }

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
        orderBy: { inicio: 'asc' },
        include: {
          cliente: {
            select: { id: true, nombre: true, apellido: true, telefono: true, email: true }
          },
          sucursal: {
            select: { id: true, nombre: true }
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
  } catch (error) {
    return handleApiError(error)
  }
}