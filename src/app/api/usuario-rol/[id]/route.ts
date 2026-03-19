import { NextResponse } from 'next/server'
import prisma from '@/utils/lib/prisma'
import { usuarioRolUpdateSchema } from '@/app/schemas/usuario-rol.schema'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const usuarioRol = await prisma.usuarioRol.findFirst({
      where: {
        id,
        deleted: false
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        rol: {
          select: {
            id: true,
            nombre: true,
            descripcion: true
          }
        }
      }
    })

    if (!usuarioRol) {
      return NextResponse.json({ error: 'Relación usuario-rol no encontrada o inactiva' }, { status: 404 })
    }

    return NextResponse.json(usuarioRol)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener la relación' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const body = await request.json()

    const validatedData = await usuarioRolUpdateSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    const existe = await prisma.usuarioRol.findFirst({
      where: {
        id: { not: id },
        deleted: false,
        ...(validatedData.usuarioId && { usuarioId: validatedData.usuarioId }),
        ...(validatedData.rolId && { rolId: validatedData.rolId })
      }
    })

    if (existe) {
      return NextResponse.json({ error: 'La relación usuario-rol ya existe' }, { status: 400 })
    }

    const dataUpdate: any = {}

    if (validatedData.usuarioId) {
      dataUpdate.usuario = { connect: { id: validatedData.usuarioId } }
    }
    if (validatedData.rolId) {
      dataUpdate.rol = { connect: { id: validatedData.rolId } }
    }

    const usuarioRolActualizado = await prisma.usuarioRol.update({
      where: { id },
      data: dataUpdate,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        rol: {
          select: {
            id: true,
            nombre: true,
            descripcion: true
          }
        }
      }
    })

    return NextResponse.json(usuarioRolActualizado)
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Usuario, rol o relación no encontrada' }, { status: 404 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Error al actualizar el registro' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.usuarioRol.update({
      where: { id },
      data: { deleted: true }
    })

    return NextResponse.json(
      {
        message: 'Relación usuario-rol eliminada lógicamente con éxito'
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo procesar la eliminación' }, { status: 500 })
  }
}
