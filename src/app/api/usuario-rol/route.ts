import { NextResponse } from 'next/server'
import prisma from '@/utils/lib/prisma'
import { usuarioRolSchema } from '@/app/schemas/usuario-rol.schema'
import { ConflictError, NotFoundError } from '@/utils/errors'
import { handleApiError, successResponse, createdResponse } from '@/utils/api-response'

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
      throw new ConflictError('El usuario ya tiene este rol asignado')
    }
    const existeUsuario = await prisma.usuario.findUnique({
      where: { id: validatedData.usuarioId }
    })
    const existeRol = await prisma.rol.findUnique({
      where: { id: validatedData.rolId }
    })
    if (!existeUsuario || !existeRol) {
      throw new NotFoundError('Usuario o rol no encontrado')
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

    return createdResponse(nuevoUsuarioRol)
  } catch (error: any) {
    return handleApiError(error)
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

    return successResponse({
      usuarioRoles,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
