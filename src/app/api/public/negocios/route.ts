import prisma from '@/utils/lib/prisma'
import { handleApiError, successResponse } from '@/utils/api-response'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit
    const search = searchParams.get('search') || ''
    const categoria = searchParams.get('categoria') || ''

    const where: any = {
      deleted: false
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' } },
            { descripcion: { contains: search, mode: 'insensitive' } },
            { direccion: { contains: search, mode: 'insensitive' } }
          ]
        }
      ]
    }

    if (categoria) {
      where.categoriaServicio = categoria
    }

    const [negocios, total] = await Promise.all([
      prisma.negocio.findMany({
        skip,
        take: limit,
        where,
        orderBy: { nombre: 'asc' },
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          telefono: true,
          email: true,
          direccion: true,
          categoriaServicio: true,
          sucursals: {
            where: { deleted: false },
            select: {
              id: true,
              nombre: true
            }
          }
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