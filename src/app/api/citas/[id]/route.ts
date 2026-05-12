// @ts-nocheck
import prisma from '@/utils/lib/prisma'
import { citaUpdateSchema } from '@/app/schemas/cita.schema'
import { handleApiError, successResponse } from '@/utils/api-response'
import { NotFoundError } from '@/utils/errors'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const cita = await prisma.cita.findFirst({
      where: {
        id,
        deleted: false
      },
      include: {
        cliente: {
          select: { id: true, nombre: true, apellido: true, telefono: true, email: true }
        },
        empleado: {
          select: { id: true, nombre: true, apellido: true, telefono: true }
        },
        sucursal: {
          select: { id: true, nombre: true }
        },
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

    if (!cita) {
      throw new NotFoundError('Cita no encontrada o inactiva')
    }

    return successResponse(cita)
  } catch (error) {
    return handleApiError(error)
  }
}

function calcularPrecioCita(cita: any): number {
  if (!cita?.servicioCitas?.length) return 0
  return cita.servicioCitas.reduce((acc: number, sc: any) => {
    const ss = sc.servicio?.servicioSucursals?.find(
      (s: any) => s.sucursalId === cita.sucursalId
    )
    const precio = ss?.precio
    return acc + (typeof precio === 'number' ? precio : 0)
  }, 0)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const validatedData = await citaUpdateSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    const { servicioIds, ...citaData } = validatedData

    const citaPrevia = await prisma.cita.findUnique({
      where: { id },
      include: {
        sucursal: { select: { id: true, negocioId: true } },
        servicioCitas: {
          include: {
            servicio: { include: { servicioSucursals: true } }
          }
        }
      }
    })

    if (!citaPrevia) {
      throw new NotFoundError('Cita no encontrada')
    }

    const citaActualizada = await prisma.cita.update({
      where: { id },
      data: {
        ...citaData,
        ...(servicioIds && {
          servicioCitas: {
            deleteMany: {},
            create: servicioIds.map(servicioId => ({ servicioId: servicioId! }))
          }
        })
      },
      include: {
        sucursal: { select: { id: true, negocioId: true } },
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

    const estadoPrevio = citaPrevia.estado
    const estadoNuevo = citaActualizada.estado
    const clienteId = citaActualizada.clienteId
    const negocioId = citaActualizada.sucursal?.negocioId

    if (negocioId && clienteId && estadoPrevio !== estadoNuevo) {
      const entroAFinalizada = estadoNuevo === 'FINALIZADA' && estadoPrevio !== 'FINALIZADA'
      const salioDeFinalizada = estadoPrevio === 'FINALIZADA' && estadoNuevo !== 'FINALIZADA'

      if (entroAFinalizada || salioDeFinalizada) {
        const precioCita = calcularPrecioCita(citaActualizada)

        await prisma.clienteNegocio.upsert({
          where: { clienteId_negocioId: { clienteId, negocioId } },
          create: {
            clienteId,
            negocioId,
            totalGastado: entroAFinalizada ? precioCita : 0,
            ultimaVisita: entroAFinalizada ? citaActualizada.inicio : null
          },
          update: {}
        })

        const sucursalesNegocio = await prisma.sucursal.findMany({
          where: { negocioId, deleted: false },
          select: { id: true }
        })
        const sucursalIds = sucursalesNegocio.map((s) => s.id)

        if (entroAFinalizada) {
          await prisma.clienteNegocio.update({
            where: { clienteId_negocioId: { clienteId, negocioId } },
            data: {
              totalGastado: { increment: precioCita }
            }
          })
        } else if (salioDeFinalizada) {
          await prisma.clienteNegocio.update({
            where: { clienteId_negocioId: { clienteId, negocioId } },
            data: {
              totalGastado: { decrement: precioCita }
            }
          })

          const actual = await prisma.clienteNegocio.findUnique({
            where: { clienteId_negocioId: { clienteId, negocioId } },
            select: { totalGastado: true }
          })
          if (actual && actual.totalGastado < 0) {
            await prisma.clienteNegocio.update({
              where: { clienteId_negocioId: { clienteId, negocioId } },
              data: { totalGastado: 0 }
            })
          }
        }

        const ultima = await prisma.cita.findFirst({
          where: {
            clienteId,
            sucursalId: { in: sucursalIds },
            estado: 'FINALIZADA',
            deleted: false
          },
          orderBy: { inicio: 'desc' },
          select: { inicio: true }
        })
        await prisma.clienteNegocio.update({
          where: { clienteId_negocioId: { clienteId, negocioId } },
          data: { ultimaVisita: ultima?.inicio ?? null }
        })
      }
    }

    return successResponse(citaActualizada)
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await prisma.cita.update({
      where: { id },
      data: { deleted: true }
    })

    return successResponse('Cita eliminada con exito')
  } catch (error) {
    return handleApiError(error)
  }
}
