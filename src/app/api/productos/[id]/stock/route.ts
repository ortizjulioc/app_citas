// @ts-nocheck
import prisma from '@/utils/lib/prisma'
import { crearMovimientoProductoSchema } from '@/app/schemas/movimiento-producto.schema'
import { handleApiError, successResponse } from '@/utils/api-response'
import { verifyToken, JwtPayload } from '@/utils/lib/jwt'
import { BadRequestError, NotFoundError } from '@/utils/errors'

function getUserFromRequest(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  return verifyToken(token)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const { id } = await params
    const body = await request.json()

    const validatedData = await crearMovimientoProductoSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    const { tipo, cantidad, referencia } = validatedData

    if (tipo !== 'AJUSTE' && (!referencia || referencia.trim() === '')) {
      return handleApiError(new BadRequestError('La referencia es requerida para ENTRADA y SALIDA'))
    }

    const producto = await prisma.producto.findFirst({
      where: { id, negocioId: user.negocioId, deleted: false }
    })

    if (!producto) {
      return handleApiError(new NotFoundError('Producto no encontrado'))
    }

    let cantidadNueva
    const cantidadAnterior = producto.stock

    if (tipo === 'ENTRADA') {
      cantidadNueva = cantidadAnterior + cantidad
    } else if (tipo === 'SALIDA') {
      if (cantidadAnterior - cantidad < 0) {
        return handleApiError(new BadRequestError('Stock insuficiente'))
      }
      cantidadNueva = cantidadAnterior - cantidad
    } else {
      cantidadNueva = cantidad
    }

    const resultado = await prisma.$transaction(async tx => {
      const productoActualizado = await tx.producto.update({
        where: { id },
        data: { stock: cantidadNueva }
      })

      const movimiento = await tx.movimientoProducto.create({
        data: {
          productoId: id,
          tipo,
          cantidadAnterior,
          cantidad,
          cantidadNueva,
          referencia: referencia || null,
          negocioId: user.negocioId
        }
      })

      return { producto: productoActualizado, movimiento }
    })

    return successResponse({
      producto: {
        id: resultado.producto.id,
        nombre: resultado.producto.nombre,
        stock: resultado.producto.stock
      },
      movimiento: {
        id: resultado.movimiento.id,
        tipo: resultado.movimiento.tipo,
        cantidad: resultado.movimiento.cantidad,
        cantidadAnterior: resultado.movimiento.cantidadAnterior,
        cantidadNueva: resultado.movimiento.cantidadNueva,
        referencia: resultado.movimiento.referencia
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
