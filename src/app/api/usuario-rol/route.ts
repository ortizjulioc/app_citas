import { NextResponse } from 'next/server'
import prisma from '@/utils/lib/prisma'
import { usuarioRolSchema } from '@/app/schemas/usuario-rol.schema'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const validatedData = await usuarioRolSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    const existe = await prisma.usuarioRol.findFirst({
      where: {
        usuarioId: validatedData.usuarioId,
        rolId: validatedData.rolId,
        deleted: false
      }
    })

    if (existe) {
      return NextResponse.json({ error: 'El usuario ya tiene este rol asignado' }, { status: 400 })
    }
    const existeUsuario = await prisma.usuario.findUnique({
      where: { id: validatedData.usuarioId }
    })
    const existeRol = await prisma.rol.findUnique({
      where: { id: validatedData.rolId }
    })
    if (!existeUsuario || !existeRol) {
      return NextResponse.json({ error: 'Usuario o rol no encontrado' }, { status: 404 })
    }

    const nuevoUsuarioRol = await prisma.usuarioRol.create({
      data: {
        usuario: { connect: { id: validatedData.usuarioId } },
        rol: { connect: { id: validatedData.rolId } }
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

    return NextResponse.json({ data: nuevoUsuarioRol, message: 'Usuario rol creado exitosamente' }, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Error de validación', detalles: error.errors }, { status: 400 })
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Usuario o rol no encontrado' }, { status: 404 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
//---------------------------------------------------------------------------------------------------------
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    const search = searchParams.get('search') || ''
    const advancedFilters = {
      usuarioId: searchParams.get('usuarioId') || '',
      rolId: searchParams.get('rolId') || ''
    }

    const where: any = {
      deleted: false
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { usuario: { nombre: { contains: search, mode: 'insensitive' } } },
            { usuario: { apellido: { contains: search, mode: 'insensitive' } } },
            { usuario: { email: { contains: search, mode: 'insensitive' } } },
            { rol: { nombre: { contains: search, mode: 'insensitive' } } }
          ]
        }
      ]
    }

    if (advancedFilters.usuarioId) {
      where.usuarioId = advancedFilters.usuarioId
    }

    if (advancedFilters.rolId) {
      where.rolId = advancedFilters.rolId
    }

    const [usuarioRoles, total] = await Promise.all([
      prisma.usuarioRol.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
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
      }),
      prisma.usuarioRol.count({ where })
    ])

    return NextResponse.json(
      {
        usuarioRoles,
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit)
        }
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
