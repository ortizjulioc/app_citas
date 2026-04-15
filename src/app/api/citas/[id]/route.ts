// @ts-nocheck
import prisma from '@/utils/lib/prisma'
import { citaUpdateSchema } from '@/app/schemas/cita.schema'
import { handleApiError, successResponse } from '@/utils/api-response'
import { NotFoundError } from '@/utils/errors'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const cita = await prisma.cita.findFirst({
      where: {
        id,
        deleted: false
      },
      include: {
        cliente: {
          select: { id: true, nombre: true, apellido: true, telefono: true, email: true }
        },
        empleado: {
          select: { id: true, nombre: true, apellido: true, telefono: true }
        },
        sucursal: {
          select: { id: true, nombre: true }
        },
        servicioCitas: {
          include: {
            servicio: {
              select: { id: true, nombre: true, precio: true, duracionMinutos: true }
            }
          }
        }
      }
    })

    if (!cita) {
      throw new NotFoundError('Cita no encontrada o inactiva')
    }

    return successResponse(cita)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const validatedData = await citaUpdateSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    const { servicioIds, ...citaData } = validatedData

    const citaActualizada = await prisma.cita.update({
      where: { id },
      data: {
        ...citaData,
        ...(servicioIds && {
          servicioCitas: {
            deleteMany: {},
            // @ts-expect-error - Prisma nested create accepts unchecked input with just IDs
            create: servicioIds.map(servicioId => ({ servicioId: servicioId! }))
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

    return successResponse(citaActualizada)
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await prisma.cita.update({
      where: { id },
      data: { deleted: true }
    })

    return successResponse('Cita eliminada con exito')
  } catch (error) {
    return handleApiError(error)
  }
}
