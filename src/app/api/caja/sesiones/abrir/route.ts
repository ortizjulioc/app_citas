// @ts-nocheck
import prisma from '@/utils/lib/prisma'
import { abrirSesionCajaSchema } from '@/app/schemas/caja.schema'
import { handleApiError, createdResponse } from '@/utils/api-response'
import { verifyToken, JwtPayload } from '@/utils/lib/jwt'
import { BadRequestError, NotFoundError } from '@/utils/errors'

function getUserFromRequest(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  return verifyToken(token)
}

// POST /api/caja/sesiones/abrir
export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const body = await request.json()
    const data = await abrirSesionCajaSchema.validate(body, { abortEarly: false, stripUnknown: true })

    // Verificar que la caja existe y pertenece al negocio
    const caja = await prisma.caja.findFirst({
      where: { id: data.cajaId, negocioId: user.negocioId, deleted: false }
    })
    if (!caja) throw new NotFoundError('Caja no encontrada')

    // Verificar que no haya una sesión abierta para esta caja
    const sesionAbierta = await prisma.sesionCaja.findFirst({
      where: { cajaId: data.cajaId, deleted: false, horaCierre: null }
    })
    if (sesionAbierta) {
      throw new BadRequestError('Esta caja ya tiene una sesión abierta. Ciérrela antes de abrir una nueva.')
    }

    const sesion = await prisma.$transaction(async tx => {
      // Actualizar estado de la caja
      await tx.caja.update({
        where: { id: data.cajaId },
        data: { estado: 'ABIERTA' }
      })

      // Crear la sesión
      const nuevaSesion = await tx.sesionCaja.create({
        data: {
          cajaId: data.cajaId,
          negocioId: user.negocioId,
          montoApertura: data.montoApertura,
          horaApertura: new Date(),
          abiertoPorId: user.userId
        },
        include: {
          caja: { select: { id: true, nombre: true } },
          abiertoPor: { select: { id: true, nombre: true, apellido: true } }
        }
      })

      return nuevaSesion
    })

    return createdResponse(sesion)
  } catch (error) {
    return handleApiError(error)
  }
}
