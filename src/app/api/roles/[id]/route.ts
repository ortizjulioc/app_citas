import { NextResponse } from 'next/server'
import prisma from '@/utils/lib/prisma'
import { rolUpdateSchema } from '@/app/schemas/rol.schema'

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
      return NextResponse.json({ error: 'Rol no encontrado o inactivo' }, { status: 404 })
    }

    return NextResponse.json(rol)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener el rol' }, { status: 500 })
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
        return NextResponse.json({ error: 'El nombre del rol ya existe' }, { status: 400 })
      }
    }

    const rolActualizado = await prisma.rol.update({
      where: { id },
      data: validatedData
    })

    return NextResponse.json(rolActualizado)
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error(error)
    return NextResponse.json({ error: 'Error al actualizar el registro' }, { status: 500 })
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

    return NextResponse.json(
      {
        message: 'Rol eliminado lógicamente con éxito'
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo procesar la eliminación' }, { status: 500 })
  }
}
