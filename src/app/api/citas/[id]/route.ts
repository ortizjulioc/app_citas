// @ts-nocheck
import prisma from '@/utils/lib/prisma'
import { citaUpdateSchema } from '@/app/schemas/cita.schema'
import { handleApiError, successResponse } from '@/utils/api-response'
import { NotFoundError } from '@/utils/errors'
import { verifyToken } from '@/utils/lib/jwt'

function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  return verifyToken(authHeader.substring(7))
}

// ─── Genera número de factura secuencial por negocio ─────────────────────────
async function generarNumeroFactura(negocioId: string): Promise<string> {
  const secuencia = await prisma.secuenciaFactura.upsert({
    where: { negocioId },
    update: { ultimoNumero: { increment: 1 } },
    create: { negocioId, ultimoNumero: 1 }
  })
  const anio = new Date().getFullYear()
  return `FAC-${anio}-${String(secuencia.ultimoNumero).padStart(5, '0')}`
}

// ─── Auto-genera factura al finalizar una cita ────────────────────────────────
async function autoGenerarFactura(cita: any, negocioId: string, createdById: string) {
  // Si ya existe una factura activa para esta cita, no crear otra
  const facturaExistente = await prisma.factura.findFirst({
    where: { citaId: cita.id, deleted: false, estado: { not: 'CANCELADA' } }
  })
  if (facturaExistente) return

  // Config ITBIS del negocio
  const negocio = await prisma.negocio.findUnique({
    where: { id: negocioId },
    select: { facturarConItbis: true, tasaItbis: true }
  })

  // Ítems: un ítem por cada servicio de la cita con precio de ServicioSucursal
  const items = cita.servicioCitas
    .filter((sc: any) => !sc.deleted)
    .map((sc: any) => {
      const ss = sc.servicio?.servicioSucursals?.find((s: any) => s.sucursalId === cita.sucursalId)
      const precio = ss?.precio ?? 0
      return {
        servicioId: sc.servicioId,
        descripcion: sc.servicio?.nombre ?? 'Servicio',
        precioUnitario: precio,
        subtotal: precio
      }
    })

  const subtotal = items.reduce((acc: number, it: any) => acc + it.subtotal, 0)
  const tasaItbis = negocio?.facturarConItbis ? (negocio.tasaItbis ?? 0.18) : 0
  const itbisAplicado = Math.round(subtotal * tasaItbis * 100) / 100
  const total = Math.round((subtotal + itbisAplicado) * 100) / 100

  const numeroFactura = await generarNumeroFactura(negocioId)

  await prisma.$transaction(async tx => {
    const factura = await tx.factura.create({
      data: {
        numeroFactura,
        clienteId: cita.clienteId,
        citaId: cita.id,
        sucursalId: cita.sucursalId,
        negocioId,
        subtotal,
        descuentos: 0,
        tasaItbis,
        itbisAplicado,
        total,
        montoPagado: 0,
        estado: 'PENDIENTE',
        createdBy: createdById
      }
    })

    if (items.length > 0) {
      await tx.detalleFactura.createMany({
        data: items.map((it: any) => ({
          facturaId: factura.id,
          tipo: 'SERVICIO',
          servicioId: it.servicioId,
          descripcion: it.descripcion,
          cantidad: 1,
          precioUnitario: it.precioUnitario,
          descuento: 0,
          subtotal: it.subtotal
        }))
      })
    }
  })
}

// ─── Calcula precio total de la cita para ClienteNegocio ─────────────────────
function calcularPrecioCita(cita: any): number {
  if (!cita?.servicioCitas?.length) return 0
  return cita.servicioCitas.reduce((acc: number, sc: any) => {
    const ss = sc.servicio?.servicioSucursals?.find((s: any) => s.sucursalId === cita.sucursalId)
    const precio = ss?.precio
    return acc + (typeof precio === 'number' ? precio : 0)
  }, 0)
}

// ─── GET /api/citas/[id] ──────────────────────────────────────────────────────
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const cita = await prisma.cita.findFirst({
      where: { id, deleted: false },
      include: {
        cliente: { select: { id: true, nombre: true, apellido: true, telefono: true, email: true } },
        empleado: { select: { id: true, nombre: true, apellido: true, telefono: true } },
        sucursal: { select: { id: true, nombre: true } },
        servicioCitas: {
          include: {
            servicio: { include: { servicioSucursals: true } }
          }
        }
      }
    })

    if (!cita) throw new NotFoundError('Cita no encontrada o inactiva')

    return successResponse(cita)
  } catch (error) {
    return handleApiError(error)
  }
}

// ─── PUT /api/citas/[id] ──────────────────────────────────────────────────────
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = getUserFromRequest(request)
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
          include: { servicio: { include: { servicioSucursals: true } } }
        }
      }
    })

    if (!citaPrevia) throw new NotFoundError('Cita no encontrada')

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
          include: { servicio: { include: { servicioSucursals: true } } }
        }
      }
    })

    const estadoPrevio = citaPrevia.estado
    const estadoNuevo = citaActualizada.estado
    const clienteId = citaActualizada.clienteId
    const negocioId = citaActualizada.sucursal?.negocioId
    const entroAFinalizada = estadoNuevo === 'FINALIZADA' && estadoPrevio !== 'FINALIZADA'
    const salioDeFinalizada = estadoPrevio === 'FINALIZADA' && estadoNuevo !== 'FINALIZADA'

    if (negocioId && clienteId && estadoPrevio !== estadoNuevo) {
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

        if (entroAFinalizada) {
          await prisma.clienteNegocio.update({
            where: { clienteId_negocioId: { clienteId, negocioId } },
            data: { totalGastado: { increment: precioCita } }
          })
        } else if (salioDeFinalizada) {
          await prisma.clienteNegocio.update({
            where: { clienteId_negocioId: { clienteId, negocioId } },
            data: { totalGastado: { decrement: precioCita } }
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

        const sucursalIds = (
          await prisma.sucursal.findMany({
            where: { negocioId, deleted: false },
            select: { id: true }
          })
        ).map(s => s.id)

        const ultima = await prisma.cita.findFirst({
          where: { clienteId, sucursalId: { in: sucursalIds }, estado: 'FINALIZADA', deleted: false },
          orderBy: { inicio: 'desc' },
          select: { inicio: true }
        })
        await prisma.clienteNegocio.update({
          where: { clienteId_negocioId: { clienteId, negocioId } },
          data: { ultimaVisita: ultima?.inicio ?? null }
        })
      }

      // ── Auto-generar factura al finalizar ──────────────────────────────────
      if (entroAFinalizada && negocioId) {
        // createdBy: usar el usuario del token si está disponible, si no el primer admin del negocio
        let createdById = user?.userId
        if (!createdById) {
          const admin = await prisma.usuario.findFirst({
            where: { negocioId, deleted: false },
            select: { id: true }
          })
          createdById = admin?.id
        }

        if (createdById) {
          try {
            await autoGenerarFactura(citaActualizada, negocioId, createdById)
          } catch (facturaError) {
            // No bloquear la actualización de la cita si falla la factura
            console.error('Error al auto-generar factura:', facturaError)
          }
        }
      }
    }

    return successResponse(citaActualizada)
  } catch (error: any) {
    return handleApiError(error)
  }
}

// ─── DELETE /api/citas/[id] ───────────────────────────────────────────────────
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
