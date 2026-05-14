// @ts-nocheck
import prisma from '@/utils/lib/prisma'
import { handleApiError, successResponse } from '@/utils/api-response'
import { verifyToken, JwtPayload } from '@/utils/lib/jwt'
import { BadRequestError, NotFoundError } from '@/utils/errors'

function getUserFromRequest(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  return verifyToken(token)
}

// GET /api/caja/sesiones/[id] — detalle de una sesión con resumen financiero
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const sesion = await prisma.sesionCaja.findFirst({
      where: { id, negocioId: user.negocioId, deleted: false },
      include: {
        caja: { select: { id: true, nombre: true } },
        abiertoPor: { select: { id: true, nombre: true, apellido: true } },
        cerradoPor: { select: { id: true, nombre: true, apellido: true } },
        movimientoCajas: {
          where: { deleted: false },
          orderBy: { createdAt: 'asc' },
          include: {
            metodoPago: { select: { id: true, nombre: true, esEfectivo: true } },
            pago: {
              select: {
                id: true,
                factura: { select: { id: true, numeroFactura: true } }
              }
            }
          }
        },
        pagos: {
          where: { deleted: false, estado: 'COMPLETADO' },
          include: {
            factura: { select: { id: true, numeroFactura: true, total: true } },
            metodoPago: { select: { id: true, nombre: true, esEfectivo: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!sesion) throw new NotFoundError('Sesión de caja no encontrada')

    // Calcular resumen financiero
    const ingresoEfectivo = sesion.movimientoCajas
      .filter(m => m.tipo === 'INGRESO')
      .reduce((acc, m) => acc + m.monto, 0)

    const gastos = sesion.movimientoCajas.filter(m => m.tipo === 'GASTO').reduce((acc, m) => acc + m.monto, 0)

    const retiros = sesion.movimientoCajas.filter(m => m.tipo === 'RETIRO').reduce((acc, m) => acc + m.monto, 0)

    const montoEsperado = Math.round((sesion.montoApertura + ingresoEfectivo - gastos - retiros) * 100) / 100

    // Resumen de pagos por método
    const resumenPorMetodo = sesion.pagos.reduce((acc: any, pago) => {
      const nombre = pago.metodoPago.nombre
      if (!acc[nombre]) acc[nombre] = { nombre, monto: 0, cantidad: 0 }
      acc[nombre].monto += pago.monto
      acc[nombre].cantidad += 1
      return acc
    }, {})

    const totalCobrado = sesion.pagos.reduce((acc, p) => acc + p.monto, 0)

    return successResponse({
      ...sesion,
      resumen: {
        montoApertura: sesion.montoApertura,
        ingresoEfectivo: Math.round(ingresoEfectivo * 100) / 100,
        gastos: Math.round(gastos * 100) / 100,
        retiros: Math.round(retiros * 100) / 100,
        montoEsperado,
        montoRealContado: sesion.montoRealContado,
        diferencia: sesion.diferencia,
        totalCobrado: Math.round(totalCobrado * 100) / 100,
        totalFacturas: sesion.pagos.length,
        resumenPorMetodo: Object.values(resumenPorMetodo)
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
