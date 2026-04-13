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
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        precio: true,
        costo: true,
        duracionMinutos: true,
        activo: true,
        sucursalId: true,
        createdAt: true,
        updatedAt: true
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

    const servicioActualizado = await prisma.servicio.update({
      where: { id },
      data: validatedData
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
