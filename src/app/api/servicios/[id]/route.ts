import prisma from '@/utils/lib/prisma'
import { servicioUpdateSchema } from '@/app/schemas/servicio.schema'
import { handleApiError, successResponse } from '@/utils/api-response'
import { NotFoundError } from '@/utils/errors'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const servicio = await prisma.servicio.findFirst({
      where: {
        id,
        deleted: false
      },
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
    })

    if (!servicio) {
      throw new NotFoundError('Servicio no encontrado o inactivo')
    }

    return successResponse(servicio)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const validatedData = await servicioUpdateSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    const { sucursales, ...servicioData } = validatedData

    const updateData: any = { ...servicioData }

    if (sucursales) {
      updateData.servicioSucursals = {
        deleteMany: {},
        create: sucursales.map((s: any) => ({
          sucursalId: s.sucursalId,
          precio: s.precio,
          costo: s.costo,
          activo: s.activo
        }))
      }
    }

    const servicioActualizado = await prisma.servicio.update({
      where: { id },
      data: updateData,
      include: {
        servicioSucursals: true
      }
    })

    return successResponse(servicioActualizado)
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await prisma.servicio.update({
      where: { id },
      data: { deleted: true }
    })

    return successResponse('Servicio eliminado con exito')
  } catch (error) {
    return handleApiError(error)
  }
}
