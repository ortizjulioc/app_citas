import prisma from '@/utils/lib/prisma'
import { empleadoSchema } from '@/app/schemas/empleado.schema'
import { handleApiError, successResponse, createdResponse } from '@/utils/api-response'
import { verifyToken, JwtPayload } from '@/utils/lib/jwt'

function getUserFromRequest(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  return verifyToken(token)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const validatedData = await empleadoSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    const nuevoEmpleado = await prisma.empleado.create({
      data: {
        nombre: validatedData.nombre,
        apellido: validatedData.apellido,
        telefono: validatedData.telefono,
        email: validatedData.email,
        tipoSalario: validatedData.tipoSalario,
        salarioBase: validatedData.salarioBase,
        fechaContratacion: validatedData.fechaContratacion,
        sucursalId: validatedData.sucursalId,
        usuarioId: validatedData.usuarioId
      }
    })

    return createdResponse(nuevoEmpleado)
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    const search = searchParams.get('search') || ''
    const sucursalIdQuery = searchParams.get('sucursalId')

    const where: any = {
      deleted: false
    }

    if (sucursalIdQuery) {
      where.sucursalId = sucursalIdQuery
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' } },
            { apellido: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { telefono: { contains: search, mode: 'insensitive' } }
          ]
        }
      ]
    }

    const [empleados, total] = await Promise.all([
      prisma.empleado.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          telefono: true,
          email: true,
          tipoSalario: true,
          salarioBase: true,
          fechaContratacion: true,
          sucursalId: true,
          usuarioId: true,
          createdAt: true
        }
      }),
      prisma.empleado.count({ where })
    ])

    return successResponse({
      empleados,
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
