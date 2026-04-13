import prisma from '@/utils/lib/prisma'
import { negocioSchema } from '@/app/schemas/negocio.schema'
import { ConflictError } from '@/utils/errors'
import { handleApiError, successResponse, createdResponse } from '@/utils/api-response'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const validatedData = await negocioSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    const nuevoNegocio = await prisma.negocio.create({
      data: validatedData
    })

    return createdResponse(nuevoNegocio)
  } catch (error) {
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
            { RNC: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }
      ]
    }

    const [negocios, total] = await Promise.all([
      prisma.negocio.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          RNC: true,
          telefono: true,
          email: true,
          direccion: true,
          createdAt: true
        }
      }),
      prisma.negocio.count({ where })
    ])

    return successResponse({
      negocios,
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
