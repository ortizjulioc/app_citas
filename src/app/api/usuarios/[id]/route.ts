import { NextResponse } from 'next/server'
import prisma from '@/utils/lib/prisma'
import { usuarioUpdateSchema } from '@/app/schemas/usuario.schema'
import bcrypt from 'bcryptjs'

// --- 1. GET: Obtener un usuario específico (activo) ---
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
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
      return NextResponse.json({ error: 'Usuario no encontrado o inactivo' }, { status: 404 })
    }

    return NextResponse.json(usuario)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener el usuario' }, { status: 500 })
  }
}

// --- 2. PUT: Actualizar datos del usuario ---
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const body = await request.json()

    // Validamos con el esquema de Yup (campos opcionales)
    const validatedData = await usuarioUpdateSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    // Si se actualiza la contraseña, la hasheamos de nuevo
    if (validatedData.password) {
      validatedData.password = await bcrypt.hash(validatedData.password, 10)
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id: params.id },
      data: validatedData
    })

    // Ocultamos la contraseña en la respuesta
    const { password, ...sinPassword } = usuarioActualizado
    return NextResponse.json(sinPassword)
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error al actualizar el registro' }, { status: 500 })
  }
}

// --- 3. DELETE: Marcar como borrado (Soft Delete) ---
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    // En lugar de borrar de la DB, actualizamos el booleano
    await prisma.usuario.update({
      where: { id },
      data: { deleted: true }
    })

    return NextResponse.json(
      {
        message: 'Usuario eliminado lógicamente con éxito'
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo procesar la eliminación' }, { status: 500 })
  }
}
