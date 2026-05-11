import prisma from '@/utils/lib/prisma'
import { negocioUpdateSchema } from '@/app/schemas/negocio.schema'
import { handleApiError, successResponse } from '@/utils/api-response'
import { NotFoundError } from '@/utils/errors'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const negocio = await prisma.negocio.findFirst({
      where: {
        id,
        deleted: false
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        RNC: true,
        telefono: true,
        email: true,
        direccion: true,
        categoriaServicio: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!negocio) {
      throw new NotFoundError('Negocio no encontrado o inactivo')
    }

    return successResponse(negocio)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const body = await request.json()

    const validatedData = await negocioUpdateSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    const negocioActualizado = await prisma.negocio.update({
      where: { id },
      data: validatedData
    })

    return successResponse(negocioActualizado)
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await prisma.negocio.update({
      where: { id },
      data: { deleted: true }
    })

    return successResponse('Negocio eliminado con éxito')
  } catch (error) {
    return handleApiError(error)
  }
}
