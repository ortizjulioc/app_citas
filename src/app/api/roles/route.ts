import { NextResponse } from 'next/server'
import prisma from '@/utils/lib/prisma'
import { rolSchema } from '@/app/schemas/rol.schema'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const validatedData = await rolSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    const existe = await prisma.rol.findUnique({
      where: { nombre: validatedData.nombre }
    })

    if (existe) {
      return NextResponse.json({ error: 'El nombre del rol ya existe' }, { status: 400 })
    }

    const nuevoRol = await prisma.rol.create({
      data: validatedData
    })

    return NextResponse.json(nuevoRol, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Error de validación', detalles: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

//-------------------------------------------------------------------------------------

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    const search = searchParams.get('search') || ''

    const where: any = {
      deleted: false
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' } },
            { descripcion: { contains: search, mode: 'insensitive' } }
          ]
        }
      ]
    }

    const [roles, total] = await Promise.all([
      prisma.rol.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.rol.count({ where })
    ])

    return NextResponse.json(
      {
        roles,
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
