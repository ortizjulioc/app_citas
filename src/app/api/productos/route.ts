// @ts-nocheck
import prisma from '@/utils/lib/prisma'
import { crearProductoSchema } from '@/app/schemas/producto.schema'
import { handleApiError, successResponse, createdResponse } from '@/utils/api-response'
import { verifyToken, JwtPayload } from '@/utils/lib/jwt'
import { BadRequestError } from '@/utils/errors'

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
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    const search = searchParams.get('search') || ''
    const sucursalId = searchParams.get('sucursalId')

    const where: any = {
      negocioId: user.negocioId,
      deleted: false
    }

    if (sucursalId) {
      where.sucursalId = sucursalId
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

    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
        skip,
        take: limit,
        where,
        orderBy: { nombre: 'asc' },
        include: {
          sucursal: {
            select: { id: true, nombre: true }
          }
        }
      }),
      prisma.producto.count({ where })
    ])

    return successResponse({
      productos,
      pagination: { total, page, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const body = await request.json()
    const validatedData = await crearProductoSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    const { stock, ...productoData } = validatedData

    const producto = await prisma.producto.create({
      data: {
        ...productoData,
        negocioId: user.negocioId,
        stock: stock
      }
    })

    if (stock > 0) {
      await prisma.movimientoProducto.create({
        data: {
          productoId: producto.id,
          tipo: 'ENTRADA',
          cantidadAnterior: 0,
          cantidad: stock,
          cantidadNueva: stock,
          referencia: 'Stock inicial',
          negocioId: user.negocioId
        }
      })
    }

    const productoConSucursal = await prisma.producto.findUnique({
      where: { id: producto.id },
      include: {
        sucursal: {
          select: { id: true, nombre: true }
        }
      }
    })

    return createdResponse(productoConSucursal)
  } catch (error) {
    return handleApiError(error)
  }
}
