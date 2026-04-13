import prisma from '@/utils/lib/prisma'
import { servicioSchema } from '@/app/schemas/servicio.schema'
import { handleApiError, successResponse, createdResponse } from '@/utils/api-response'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const validatedData = await servicioSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    const nuevoServicio = await prisma.servicio.create({
      data: validatedData
    })

    return createdResponse(nuevoServicio)
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
    const sucursalIdQuery = searchParams.get('sucursalId')
    const activoQuery = searchParams.get('activo')

    const where: any = {
      deleted: false
    }

    if (sucursalIdQuery) {
      where.sucursalId = sucursalIdQuery
    }

    if (activoQuery !== null && activoQuery !== undefined) {
      where.activo = activoQuery === 'true'
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' } },
            { descripcion: { contains: search, mode: 'insensitive' } }
          ]
        }
      ]
    }

    const [servicios, total] = await Promise.all([
      prisma.servicio.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          precio: true,
          costo: true,
          duracionMinutos: true,
          activo: true,
          sucursalId: true,
          createdAt: true
        }
      }),
      prisma.servicio.count({ where })
    ])

    return successResponse({
      servicios,
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
