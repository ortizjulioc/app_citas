import prisma from '@/utils/lib/prisma'
import { handleApiError, successResponse, createdResponse } from '@/utils/api-response'
import { ConflictError } from '@/utils/errors'
import { clienteNegocioCreateSchema } from '@/app/schemas/cliente-negocio.schema'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return handleApiError(new Error('Email requerido'))
    }

    const cliente = await prisma.cliente.findFirst({
      where: { email, deleted: false }
    })

    if (!cliente) {
      return successResponse({ negocios: [], clienteId: null })
    }

    const clienteNegocios = await prisma.clienteNegocio.findMany({
      where: { clienteId: cliente.id },
      include: {
        negocio: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            telefono: true,
            email: true,
            direccion: true,
            categoriaServicio: true
          }
        }
      }
    })

    const negocios = clienteNegocios.map(cn => cn.negocio)

    return successResponse({
      negocios,
      clienteId: cliente.id
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const validatedData = await clienteNegocioCreateSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    let cliente = await prisma.cliente.findFirst({
      where: { email: validatedData.email, deleted: false }
    })

    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: {
          nombre: validatedData.email.split('@')[0],
          apellido: '',
          email: validatedData.email
        }
      })
    }

    const existingRelation = await prisma.clienteNegocio.findUnique({
      where: {
        clienteId_negocioId: {
          clienteId: cliente.id,
          negocioId: validatedData.negocioId
        }
      }
    })

    if (existingRelation) {
      throw new ConflictError('Ya eres cliente de esta empresa')
    }

    const clienteNegocio = await prisma.clienteNegocio.create({
      data: {
        clienteId: cliente.id,
        negocioId: validatedData.negocioId
      },
      include: {
        negocio: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            telefono: true,
            email: true,
            direccion: true,
            categoriaServicio: true
          }
        }
      }
    })

    return createdResponse({
      clienteNegocio,
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        email: cliente.email
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}