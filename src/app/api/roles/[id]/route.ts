import { NextResponse } from 'next/server'
import prisma from '@/utils/lib/prisma'
import { rolUpdateSchema } from '@/app/schemas/rol.schema'
import { handleApiError, successResponse } from '@/utils/api-response'
import { ConflictError, NotFoundError } from '@/utils/errors'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const rol = await prisma.rol.findFirst({
      where: {
        id,
        deleted: false
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!rol) {
      throw new NotFoundError('Rol no encontrado o inactivo')
    }

    return successResponse(rol)
  } catch (error) {
    return handleApiError(error)
  }
}

//-------------------------------------------------------------------------------------

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const body = await request.json()

    const validatedData = await rolUpdateSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    if (validatedData.nombre) {
      const existe = await prisma.rol.findFirst({
        where: {
          nombre: validatedData.nombre,
          id: { not: id },
          deleted: false
        }
      })

      if (existe) {
        throw new ConflictError('El nombre del rol ya existe')
      }
    }

    const rolActualizado = await prisma.rol.update({
      where: { id },
      data: validatedData
    })

    return successResponse(rolActualizado)
  } catch (error: any) {
    return handleApiError(error)
  }
}

//-------------------------------------------------------------------------------------

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.rol.update({
      where: { id },
      data: { deleted: true }
    })

    return successResponse({ message: 'Rol eliminado lógicamente con éxito' })
  } catch (error) {
    return handleApiError(error)
  }
}
