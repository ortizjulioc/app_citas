// @ts-nocheck
import prisma from '@/utils/lib/prisma'
import { citaSchema } from '@/app/schemas/cita.schema'
import { handleApiError, successResponse, createdResponse } from '@/utils/api-response'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const validatedData = await citaSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    const { servicioIds, ...citaData } = validatedData

    const nuevaCita = await prisma.cita.create({
      data: {
        ...citaData,
        ...(servicioIds &&
          servicioIds.length > 0 && {
            servicioCitas: {
              create: servicioIds.map(servicioId => ({ servicioId }))
            }
          })
      },
      include: {
        servicioCitas: {
          include: {
            servicio: {
              select: { id: true, nombre: true }
            }
          }
        }
      }
    })

    return createdResponse(nuevaCita)
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

    const sucursalId = searchParams.get('sucursalId')
    const empleadoId = searchParams.get('empleadoId')
    const clienteId = searchParams.get('clienteId')
    const estado = searchParams.get('estado')
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')

    const where: any = {
      deleted: false
    }

    if (sucursalId) where.sucursalId = sucursalId
    if (empleadoId) where.empleadoId = empleadoId
    if (clienteId) where.clienteId = clienteId
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
            select: { id: true, nombre: true, apellido: true, telefono: true }
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
