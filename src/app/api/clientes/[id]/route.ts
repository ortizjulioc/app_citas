import prisma from '@/utils/lib/prisma'
import { clienteUpdateSchema } from '@/app/schemas/cliente.schema'
import { handleApiError, successResponse } from '@/utils/api-response'
import { NotFoundError } from '@/utils/errors'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const cliente = await prisma.cliente.findFirst({
      where: {
        id,
        deleted: false
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        telefono: true,
        email: true,
        fechaNacimiento: true,
        direccion: true,
        notas: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!cliente) {
      throw new NotFoundError('Cliente no encontrado o inactivo')
    }

    return successResponse(cliente)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const validatedData = await clienteUpdateSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    const clienteActualizado = await prisma.cliente.update({
      where: { id },
      data: validatedData
    })

    return successResponse(clienteActualizado)
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await prisma.cliente.update({
      where: { id },
      data: { deleted: true }
    })

    return successResponse('Cliente eliminado con exito')
  } catch (error) {
    return handleApiError(error)
  }
}
