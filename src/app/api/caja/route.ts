// @ts-nocheck
import prisma from '@/utils/lib/prisma'
import { crearCajaSchema } from '@/app/schemas/caja.schema'
import { handleApiError, successResponse, createdResponse } from '@/utils/api-response'
import { verifyToken, JwtPayload } from '@/utils/lib/jwt'
import { BadRequestError } from '@/utils/errors'

function getUserFromRequest(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  return verifyToken(token)
}

// GET /api/caja — listar cajas del negocio
export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const { searchParams } = new URL(request.url)
    const sucursalId = searchParams.get('sucursalId')

    const where: any = { negocioId: user.negocioId, deleted: false }
    if (sucursalId) where.sucursalId = sucursalId

    const cajas = await prisma.caja.findMany({
      where,
      include: {
        sucursal: { select: { id: true, nombre: true } },
        sesionCajas: {
          where: { deleted: false, horaCierre: null },
          take: 1,
          orderBy: { horaApertura: 'desc' },
          include: {
            abiertoPor: { select: { id: true, nombre: true, apellido: true } }
          }
        }
      },
      orderBy: { nombre: 'asc' }
    })

    // Agregar sesión activa como campo directo
    const cajasConSesion = cajas.map(caja => ({
      ...caja,
      sesionActiva: caja.sesionCajas[0] || null,
      sesionCajas: undefined
    }))

    return successResponse({ cajas: cajasConSesion })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/caja — crear una nueva caja
export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const body = await request.json()
    const data = await crearCajaSchema.validate(body, { abortEarly: false, stripUnknown: true })

    // Verificar sucursal
    const sucursal = await prisma.sucursal.findFirst({
      where: { id: data.sucursalId, negocioId: user.negocioId, deleted: false }
    })
    if (!sucursal) throw new BadRequestError('Sucursal no encontrada')

    const caja = await prisma.caja.create({
      data: {
        sucursalId: data.sucursalId,
        nombre: data.nombre,
        estado: 'CERRADA',
        negocioId: user.negocioId
      },
      include: {
        sucursal: { select: { id: true, nombre: true } }
      }
    })

    return createdResponse(caja)
  } catch (error) {
    return handleApiError(error)
  }
}
