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

// GET /api/nominas/periodos/[id] — detalle de un período con todas sus nóminas
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
          where: {
            deleted: false,
            empleado: { negocioId: user.negocioId }
          },
          include: {
            empleado: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                tipoSalario: true,
                salarioBase: true,
                sucursal: { select: { id: true, nombre: true } }
              }
            },
            detalleNominas: {
              orderBy: { id: 'asc' }
            }
          },
          orderBy: [
            { empleado: { apellido: 'asc' } },
            { empleado: { nombre: 'asc' } }
          ]
        }
      }
    })

    if (!periodo) throw new NotFoundError('Período de nómina no encontrado')

    const totalNomina = periodo.nominas.reduce((acc, n) => acc + n.total, 0)

    return successResponse({ ...periodo, totalNomina })
  } catch (error) {
    return handleApiError(error)
  }
}
