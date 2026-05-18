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

// GET /api/nominas/[id] — detalle completo de una nómina individual
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const nomina = await prisma.nomina.findUnique({
      where: { id },
      include: {
        empleado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            tipoSalario: true,
            salarioBase: true,
            negocioId: true,
            sucursal: { select: { id: true, nombre: true } }
          }
        },
        periodoNomina: true,
        detalleNominas: { orderBy: { id: 'asc' } }
      }
    })

    if (!nomina) throw new NotFoundError('Nómina no encontrada')
    if (nomina.empleado.negocioId !== user.negocioId) throw new BadRequestError('No autorizado')

    return successResponse(nomina)
  } catch (error) {
    return handleApiError(error)
  }
}
