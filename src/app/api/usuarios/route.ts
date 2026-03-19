import { NextResponse } from 'next/server'
import prisma from '@/utils/lib/prisma'
import { usuarioSchema } from '@/app/schemas/usuario.schema'
import bcrypt from 'bcryptjs'
import { ConflictError } from '@/utils/errors'
import { handleApiError, successResponse, createdResponse } from '@/utils/api-response'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const validatedData = await usuarioSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    const existe = await prisma.usuario.findUnique({
      where: { email: validatedData.email }
    })

    if (existe) {
      throw new ConflictError('El correo ya está registrado')
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        ...validatedData,
        password: hashedPassword
      }
    })

    const { password, ...usuarioSinPassword } = nuevoUsuario

    return createdResponse(usuarioSinPassword)
  } catch (error) {
    return handleApiError(error)
  }
}

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
            { apellido: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }
      ]
    }

    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          telefono: true,
          createdAt: true,
          negocioId: true
        }
      }),
      prisma.usuario.count({ where })
    ])

    return successResponse({
      usuarios,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
