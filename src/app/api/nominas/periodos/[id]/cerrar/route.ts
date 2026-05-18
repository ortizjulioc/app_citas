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

// POST /api/nominas/periodos/[id]/cerrar
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const periodo = await prisma.periodoNomina.findUnique({
      where: { id },
      include: {
        nominas: {
          where: { deleted: false, empleado: { negocioId: user.negocioId } }
        }
      }
    })

    if (!periodo) throw new NotFoundError('Período de nómina no encontrado')
    if (periodo.nominas.length === 0) throw new BadRequestError('Este período no pertenece a su negocio')
    if (periodo.estado === 'PAGADO') throw new BadRequestError('Este período ya fue marcado como pagado')

    const periodoCerrado = await prisma.periodoNomina.update({
      where: { id },
      data: { estado: 'PAGADO' }
    })

    return successResponse(periodoCerrado)
  } catch (error) {
    return handleApiError(error)
  }
}
