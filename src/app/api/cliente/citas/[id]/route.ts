// @ts-nocheck
import prisma from '@/utils/lib/prisma'
import { handleApiError, successResponse } from '@/utils/api-response'
import { verifyToken } from '@/utils/lib/jwt'
import { UnauthorizedError, NotFoundError, BadRequestError } from '@/utils/errors'

function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  return verifyToken(token)
}

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.email) {
      return handleApiError(new UnauthorizedError())
    }

    const cliente = await prisma.cliente.findFirst({
      where: { email: user.email, deleted: false }
    })

    if (!cliente) {
      return handleApiError(new UnauthorizedError())
    }

    const { id } = await params
    const body = await request.json()
    const { accion, inicio, fin } = body



    const cita = await prisma.cita.findFirst({
      where: {
        id,
        clienteId: cliente.id,
        deleted: false
      }
    })

    if (!cita) {
      return handleApiError(new NotFoundError('Cita no encontrada'))
    }

    if (accion === 'cancelar') {
      const now = new Date()
      const citaTime = new Date(cita.inicio)
      if (citaTime.getTime() - now.getTime() < FOUR_HOURS_MS) {
        return handleApiError(new BadRequestError('No puedes cancelar con menos de 4 horas de anticipación. Puedes posponer la cita en su lugar.'))
      }

      const actualizada = await prisma.cita.update({
        where: { id },
        data: { estado: 'CANCELADA' }
      })

      return successResponse({ cita: actualizada, mensaje: 'Cita cancelada correctamente' })
    }

    if (accion === 'posponer') {
      if (!inicio || !fin) {
        return handleApiError(new BadRequestError('Se requiere la nueva fecha y hora'))
      }

      const now = new Date()
      const newInicio = new Date(inicio)
      const newFin = new Date(fin)

      if (newInicio.getTime() - now.getTime() < FOUR_HOURS_MS) {
        return handleApiError(new BadRequestError('La nueva fecha debe ser al menos 4 horas en el futuro'))
      }

      const overlapping = await prisma.cita.findFirst({
        where: {
          id: { not: id },
          empleadoId: cita.empleadoId,
          deleted: false,
          estado: { not: 'CANCELADA' },
          inicio: { lt: newFin },
          fin: { gt: newInicio }
        }
      })

      if (overlapping) {
        return handleApiError(new BadRequestError('El nuevo horario tiene conflicto con otra cita'))
      }

      const actualizada = await prisma.cita.update({
        where: { id },
        data: {
          inicio: newInicio,
          fin: newFin,
          estado: 'PENDIENTE'
        }
      })

      return successResponse({ cita: actualizada, mensaje: 'Cita reprogramada correctamente' })
    }

    return handleApiError(new BadRequestError('Acción no válida. Use "cancelar" o "posponer"'))
  } catch (error) {
    return handleApiError(error)
  }
}
