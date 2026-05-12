// @ts-nocheck
import prisma from '@/utils/lib/prisma'
import { cerrarSesionCajaSchema } from '@/app/schemas/caja.schema'
import { handleApiError, successResponse } from '@/utils/api-response'
import { verifyToken, JwtPayload } from '@/utils/lib/jwt'
import { BadRequestError, NotFoundError } from '@/utils/errors'

function getUserFromRequest(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  return verifyToken(token)
}

// POST /api/caja/sesiones/[id]/cerrar
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const body = await request.json()
    const data = await cerrarSesionCajaSchema.validate(body, { abortEarly: false, stripUnknown: true })

    const sesion = await prisma.sesionCaja.findFirst({
      where: { id, negocioId: user.negocioId, deleted: false },
      include: {
        movimientoCajas: { where: { deleted: false } }
      }
    })

    if (!sesion) throw new NotFoundError('Sesión de caja no encontrada')
    if (sesion.horaCierre) throw new BadRequestError('La sesión de caja ya está cerrada')

    // Calcular monto esperado
    const ingresoEfectivo = sesion.movimientoCajas
      .filter(m => m.tipo === 'INGRESO')
      .reduce((acc, m) => acc + m.monto, 0)
    const gastos = sesion.movimientoCajas
      .filter(m => m.tipo === 'GASTO')
      .reduce((acc, m) => acc + m.monto, 0)
    const retiros = sesion.movimientoCajas
      .filter(m => m.tipo === 'RETIRO')
      .reduce((acc, m) => acc + m.monto, 0)

    const montoEsperado = Math.round((sesion.montoApertura + ingresoEfectivo - gastos - retiros) * 100) / 100
    const diferencia = Math.round((data.montoRealContado - montoEsperado) * 100) / 100

    const sesionCerrada = await prisma.$transaction(async (tx) => {
      // Cerrar la sesión
      const updated = await tx.sesionCaja.update({
        where: { id },
        data: {
          horaCierre: new Date(),
          cerradoPorId: user.userId,
          montoEsperado,
          montoRealContado: data.montoRealContado,
          diferencia,
          notasCierre: data.notasCierre || null
        },
        include: {
          caja: { select: { id: true, nombre: true } },
          abiertoPor: { select: { id: true, nombre: true, apellido: true } },
          cerradoPor: { select: { id: true, nombre: true, apellido: true } }
        }
      })

      // Cambiar estado de la caja a CERRADA
      await tx.caja.update({
        where: { id: sesion.cajaId },
        data: { estado: 'CERRADA' }
      })

      return updated
    })

    return successResponse({
      sesion: sesionCerrada,
      arqueo: {
        montoApertura: sesion.montoApertura,
        ingresoEfectivo: Math.round(ingresoEfectivo * 100) / 100,
        gastos: Math.round(gastos * 100) / 100,
        retiros: Math.round(retiros * 100) / 100,
        montoEsperado,
        montoRealContado: data.montoRealContado,
        diferencia,
        estado: diferencia === 0 ? 'CUADRADO' : diferencia > 0 ? 'SOBRANTE' : 'FALTANTE'
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
