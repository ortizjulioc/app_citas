// @ts-nocheck
import prisma from '@/utils/lib/prisma'
import { empleadoUpdateSchema } from '@/app/schemas/empleado.schema'
import { handleApiError, successResponse } from '@/utils/api-response'
import { NotFoundError } from '@/utils/errors'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const empleado = await prisma.empleado.findFirst({
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
        tipoSalario: true,
        salarioBase: true,
        fechaContratacion: true,
        sucursalId: true,
        usuarioId: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!empleado) {
      throw new NotFoundError('Empleado no encontrado o inactivo')
    }

    return successResponse(empleado)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const validatedData = await empleadoUpdateSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    const empleadoActualizado = await prisma.empleado.update({
      where: { id },
      data: validatedData
    })

    return successResponse(empleadoActualizado)
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await prisma.empleado.update({
      where: { id },
      data: { deleted: true }
    })

    return successResponse('Empleado eliminado con exito')
  } catch (error) {
    return handleApiError(error)
  }
}
