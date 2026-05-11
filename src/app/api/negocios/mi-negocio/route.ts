// @ts-nocheck
import prisma from '@/utils/lib/prisma'
import { handleApiError, successResponse } from '@/utils/api-response'
import { verifyToken } from '@/utils/lib/jwt'
import { UnauthorizedError } from '@/utils/errors'

function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  return verifyToken(token)
}

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new UnauthorizedError())
    }

    const negocio = await prisma.negocio.findFirst({
      where: {
        id: user.negocioId,
        deleted: false
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        telefono: true,
        email: true,
        direccion: true,
        categoriaServicio: true,
        horaApertura: true,
        horaCierre: true,
        diasLaborables: true
      }
    })

    if (!negocio) {
      return handleApiError(new Error('Negocio no encontrado'))
    }

    return successResponse(negocio)
  } catch (error) {
    return handleApiError(error)
  }
}
