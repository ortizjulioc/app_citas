import prisma from '@/utils/lib/prisma'
import { sucursalSchema } from '@/app/schemas/sucursal.schema'
import { handleApiError, successResponse, createdResponse } from '@/utils/api-response'
import { verifyToken, JwtPayload } from '@/utils/lib/jwt'
import { getNegocioId } from '@/utils/get-negocio-id'

function getUserFromRequest(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  return verifyToken(token)
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request)
    const body = await request.json()

    const validatedData = await sucursalSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    const negocioId = getNegocioId(body, user)

    const nuevaSucursal = await prisma.sucursal.create({
      data: {
        nombre: validatedData.nombre,
        negocioId
      }
    })

    return createdResponse(nuevaSucursal)
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
    const negocioIdQuery = searchParams.get('negocioId')

    const where: any = {
      deleted: false
    }

    const negocioId = negocioIdQuery || user?.negocioId

    if (negocioId) {
      where.negocioId = negocioId
    }

    if (search) {
      where.AND = [
        {
          OR: [{ nombre: { contains: search, mode: 'insensitive' } }]
        }
      ]
    }

    const [sucursales, total] = await Promise.all([
      prisma.sucursal.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nombre: true,
          negocioId: true,
          createdAt: true
        }
      }),
      prisma.sucursal.count({ where })
    ])

    return successResponse({
      sucursales,
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
