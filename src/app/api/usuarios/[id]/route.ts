import { NextResponse } from 'next/server'
import prisma from '@/utils/lib/prisma'
import { usuarioUpdateSchema } from '@/app/schemas/usuario.schema'
import bcrypt from 'bcryptjs'
import { handleApiError, successResponse } from '@/utils/api-response'
import { NotFoundError } from '@/utils/errors'

// --- 1. GET: Obtener un usuario específico (activo) ---
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 2. Aquí obtenemos el ID real desde la promesa
    const { id } = await params
    const usuario = await prisma.usuario.findFirst({
      where: {
        id,
        deleted: false // Filtro para ignorar los que están en la "papelera"
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        negocioId: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!usuario) {
      throw new NotFoundError('Usuario no encontrado o inactivo')
    }

    return successResponse(usuario)
  } catch (error) {
    return handleApiError(error)
  }
}

//--------------------------------------------------------------------------------------------------

// --- 2. PUT: Actualizar datos del usuario ---
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 2. Aquí obtenemos el ID real desde la promesa
    const { id } = await params

    const body = await request.json()

    const validatedData = await usuarioUpdateSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    if (validatedData.password) {
      validatedData.password = await bcrypt.hash(validatedData.password, 10)
    }

    const usuarioActualizado = await prisma.usuario.update({
      // 3. USAMOS 'id' (el valor ya resuelto), NO 'params.id'
      where: { id: id },
      data: validatedData
    })

    const { password, ...sinPassword } = usuarioActualizado

    return successResponse(sinPassword)
  } catch (error: any) {
    return handleApiError(error)
  }
}

// --- 3. DELETE: Marcar como borrado (Soft Delete) ---
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 2. Aquí obtenemos el ID real desde la promesa
    const { id } = await params
    // En lugar de borrar de la DB, actualizamos el booleano
    await prisma.usuario.update({
      where: { id },
      data: { deleted: true }
    })

    return successResponse('Usuario eliminado lógicamente con éxito')
  } catch (error) {
    return handleApiError(error)
  }
}
