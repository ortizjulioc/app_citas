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

    const { sucursales, ...servicioData } = validatedData

    // Si no viene negocioId en el body, podríamos intentar sacarlo del usuario autenticado
    // Por ahora asumimos que viene o se maneja en el middleware/auth
    if (!servicioData.negocioId) {
      // Intento básico de obtener el negocioId si no viene
      const primerSucursal = await prisma.sucursal.findUnique({
        where: { id: sucursales![0].sucursalId },
        select: { negocioId: true }
      })
      servicioData.negocioId = primerSucursal?.negocioId || ''
    }

    const nuevoServicio = await prisma.servicio.create({
      data: {
        ...servicioData,
        negocioId: servicioData.negocioId!,
        servicioSucursals: {
          create: sucursales?.map((s: any) => ({
            sucursalId: s.sucursalId,
            precio: s.precio,
            costo: s.costo,
            activo: s.activo
          }))
        }
      },
      include: {
        servicioSucursals: true
      }
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

    const where: any = {
      deleted: false
    }

    if (sucursalIdQuery) {
      where.servicioSucursals = {
        some: {
          sucursalId: sucursalIdQuery
        }
      }
    }

    if (search) {
      where.AND = [
        ...(where.AND || []),
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
        include: {
          servicioSucursals: {
            include: {
              sucursal: {
                select: {
                  id: true,
                  nombre: true
                }
              }
            }
          }
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
