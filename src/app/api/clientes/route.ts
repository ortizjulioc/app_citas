import prisma from '@/utils/lib/prisma'
import { clienteSchema } from '@/app/schemas/cliente.schema'
import { handleApiError, successResponse, createdResponse } from '@/utils/api-response'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const validatedData = await clienteSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    const nuevoCliente = await prisma.cliente.create({
      data: validatedData
    })

    return createdResponse(nuevoCliente)
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    const search = searchParams.get('search') || ''

    const where: any = {
      deleted: false
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' } },
            { apellido: { contains: search, mode: 'insensitive' } },
            { telefono: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }
      ]
    }

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
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
          fechaNacimiento: true,
          direccion: true,
          notas: true,
          createdAt: true
        }
      }),
      prisma.cliente.count({ where })
    ])

    return successResponse({
      clientes,
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
