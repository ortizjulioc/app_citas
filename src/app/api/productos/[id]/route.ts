// @ts-nocheck
import prisma from '@/utils/lib/prisma'
import { actualizarProductoSchema } from '@/app/schemas/producto.schema'
import { handleApiError, successResponse } from '@/utils/api-response'
import { verifyToken, JwtPayload } from '@/utils/lib/jwt'
import { BadRequestError, NotFoundError } from '@/utils/errors'

function getUserFromRequest(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  return verifyToken(token)
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const { id } = await params

    const producto = await prisma.producto.findFirst({
      where: { id, negocioId: user.negocioId, deleted: false },
      include: {
        sucursal: {
          select: { id: true, nombre: true }
        }
      }
    })

    if (!producto) {
      return handleApiError(new NotFoundError('Producto no encontrado'))
    }

    return successResponse(producto)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const { id } = await params
    const body = await request.json()

    const validatedData = await actualizarProductoSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    const productoExistente = await prisma.producto.findFirst({
      where: { id, negocioId: user.negocioId, deleted: false }
    })

    if (!productoExistente) {
      return handleApiError(new NotFoundError('Producto no encontrado'))
    }

    const actualizado = await prisma.producto.update({
      where: { id },
      data: validatedData,
      include: {
        sucursal: {
          select: { id: true, nombre: true }
        }
      }
    })

    return successResponse(actualizado)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const { id } = await params

    const productoExistente = await prisma.producto.findFirst({
      where: { id, negocioId: user.negocioId, deleted: false }
    })

    if (!productoExistente) {
      return handleApiError(new NotFoundError('Producto no encontrado'))
    }

    await prisma.producto.update({
      where: { id },
      data: { deleted: true }
    })

    return successResponse('Producto eliminado')
  } catch (error) {
    return handleApiError(error)
  }
}
