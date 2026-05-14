import prisma from '@/utils/lib/prisma'
import { handleApiError, successResponse } from '@/utils/api-response'
import { verifyToken, JwtPayload } from '@/utils/lib/jwt'
import { UnauthorizedError } from '@/utils/errors'

function getUserFromRequest(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  return verifyToken(token)
}

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new UnauthorizedError('No autorizado'))
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    const search = (searchParams.get('search') || '').trim()

    const where: any = {
      negocioId: user.negocioId,
      cliente: { deleted: false }
    }

    if (search) {
      where.cliente = {
        deleted: false,
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { apellido: { contains: search, mode: 'insensitive' } },
          { telefono: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }
    }

    const sucursales = await prisma.sucursal.findMany({
      where: { negocioId: user.negocioId, deleted: false },
      select: { id: true }
    })
    const sucursalIds = sucursales.map(s => s.id)

    const [clientesNegocio, total] = await Promise.all([
      prisma.clienteNegocio.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              telefono: true,
              email: true,
              fechaNacimiento: true,
              direccion: true,
              notas: true,
              createdAt: true
            }
          }
        }
      }),
      prisma.clienteNegocio.count({ where })
    ])

    const clientesConDatos = await Promise.all(
      clientesNegocio.map(async cn => {
        if (sucursalIds.length === 0) {
          return {
            id: cn.id,
            clienteId: cn.clienteId,
            totalGastado: 0,
            ultimaVisita: null,
            notas: cn.notas,
            registradoEn: cn.createdAt,
            totalCitas: 0,
            cliente: cn.cliente
          }
        }

        const [totalCitas, citasFinalizadas] = await Promise.all([
          prisma.cita.count({
            where: {
              clienteId: cn.clienteId,
              sucursalId: { in: sucursalIds },
              deleted: false
            }
          }),
          prisma.cita.findMany({
            where: {
              clienteId: cn.clienteId,
              sucursalId: { in: sucursalIds },
              estado: 'FINALIZADA',
              deleted: false
            },
            orderBy: { inicio: 'desc' },
            include: {
              servicioCitas: {
                include: {
                  servicio: {
                    include: {
                      servicioSucursals: true
                    }
                  }
                }
              }
            }
          })
        ])

        let totalGastado = 0
        for (const cita of citasFinalizadas) {
          for (const sc of cita.servicioCitas) {
            const ss = sc.servicio.servicioSucursals.find(s => s.sucursalId === cita.sucursalId)
            if (ss && typeof ss.precio === 'number') {
              totalGastado += ss.precio
            }
          }
        }

        const ultimaVisita = citasFinalizadas[0]?.inicio ?? null

        return {
          id: cn.id,
          clienteId: cn.clienteId,
          totalGastado,
          ultimaVisita,
          notas: cn.notas,
          registradoEn: cn.createdAt,
          totalCitas,
          cliente: cn.cliente
        }
      })
    )

    return successResponse({
      clientes: clientesConDatos,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
