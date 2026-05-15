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

async function recalcularTotal(nominaId: string, tx: any) {
  const nomina = await tx.nomina.findUnique({
    where: { id: nominaId },
    include: { detalleNominas: true }
  })
  if (!nomina) return

  let totalIngresos = 0
  let totalDeducciones = 0
  for (const d of nomina.detalleNominas) {
    if (d.tipo === 'INGRESO') totalIngresos += d.cantidad
    else if (d.tipo === 'DEDUCCION') totalDeducciones += d.cantidad
  }

  const nuevoTotal = Math.max(0, Math.round((totalIngresos - totalDeducciones) * 100) / 100)
  const comision = nomina.detalleNominas
    .filter(d => d.tipo === 'INGRESO' && d.descripcion.toLowerCase().startsWith('comisi'))
    .reduce((acc, d) => acc + d.cantidad, 0)
  const salarioBase = nomina.detalleNominas
    .filter(d => d.tipo === 'INGRESO' && !d.descripcion.toLowerCase().startsWith('comisi') && !d.descripcion.toLowerCase().startsWith('bono'))
    .reduce((acc, d) => acc + d.cantidad, 0)
  const bonos = nomina.detalleNominas
    .filter(d => d.tipo === 'INGRESO' && d.descripcion.toLowerCase().startsWith('bono'))
    .reduce((acc, d) => acc + d.cantidad, 0)

  await tx.nomina.update({
    where: { id: nominaId },
    data: {
      comision: Math.round(comision * 100) / 100,
      salarioBase: Math.round(salarioBase * 100) / 100,
      bonos: Math.round(bonos * 100) / 100,
      total: nuevoTotal
    }
  })
}

// DELETE /api/nominas/detalles/[id]
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const detalle = await prisma.detalleNomina.findUnique({
      where: { id },
      include: {
        nomina: {
          include: {
            empleado: { select: { negocioId: true } },
            periodoNomina: { select: { estado: true } }
          }
        }
      }
    })

    if (!detalle) throw new NotFoundError('Detalle de nómina no encontrado')
    if (detalle.nomina.empleado.negocioId !== user.negocioId) throw new BadRequestError('No autorizado')
    if (detalle.nomina.periodoNomina.estado === 'PAGADO') {
      throw new BadRequestError('No se puede modificar una nómina de un período ya pagado')
    }

    const nominaId = detalle.nominaId

    await prisma.$transaction(async tx => {
      await tx.detalleNomina.delete({ where: { id } })
      await recalcularTotal(nominaId, tx)
    })

    return successResponse({ message: 'Detalle eliminado correctamente' })
  } catch (error) {
    return handleApiError(error)
  }
}
