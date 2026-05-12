// @ts-nocheck
import prisma from '@/utils/lib/prisma'
import { handleApiError, successResponse, noContentResponse } from '@/utils/api-response'
import { verifyToken, JwtPayload } from '@/utils/lib/jwt'
import { BadRequestError, NotFoundError } from '@/utils/errors'
import * as Yup from 'yup'

function getUserFromRequest(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  return verifyToken(token)
}

const actualizarMetodoPagoSchema = Yup.object({
  nombre: Yup.string().optional(),
  descripcion: Yup.string().nullable().optional(),
  esEfectivo: Yup.boolean().optional()
})

// PATCH /api/metodos-pago/[id]
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const metodoPago = await prisma.metodoPago.findFirst({
      where: { id: params.id, negocioId: user.negocioId, deleted: false }
    })
    if (!metodoPago) throw new NotFoundError('Método de pago no encontrado')

    const body = await request.json()
    const data = await actualizarMetodoPagoSchema.validate(body, { abortEarly: false, stripUnknown: true })

    const actualizado = await prisma.metodoPago.update({
      where: { id: params.id },
      data
    })

    return successResponse(actualizado)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/metodos-pago/[id] — soft delete
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const metodoPago = await prisma.metodoPago.findFirst({
      where: { id: params.id, negocioId: user.negocioId, deleted: false }
    })
    if (!metodoPago) throw new NotFoundError('Método de pago no encontrado')

    // Verificar que no tenga pagos activos
    const pagosActivos = await prisma.pago.count({
      where: { metodoPagoId: params.id, deleted: false, estado: 'COMPLETADO' }
    })
    if (pagosActivos > 0) {
      throw new BadRequestError('No se puede eliminar un método de pago con transacciones registradas')
    }

    await prisma.metodoPago.update({
      where: { id: params.id },
      data: { deleted: true }
    })

    return noContentResponse()
  } catch (error) {
    return handleApiError(error)
  }
}
