import prisma from '@/utils/lib/prisma'
import { citaClienteSchema } from '@/app/schemas/cita-cliente.schema'
import { handleApiError, successResponse, createdResponse, conflictResponse } from '@/utils/api-response'
import { ConflictError, BadRequestError } from '@/utils/errors'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const validatedData = await citaClienteSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    const { servicioIds, empleadoId, clienteEmail, clienteNombre, clienteApellido, clienteTelefono, ...citaData } = validatedData

    let cliente = await prisma.cliente.findFirst({
      where: { email: clienteEmail, deleted: false }
    })

    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: {
          nombre: clienteNombre,
          apellido: clienteApellido,
          email: clienteEmail,
          telefono: clienteTelefono || null
        }
      })
    }

    const existingClienteNegocio = await prisma.clienteNegocio.findUnique({
      where: {
        clienteId_negocioId: {
          clienteId: cliente.id,
          negocioId: validatedData.negocioId
        }
      }
    })

    if (!existingClienteNegocio) {
      await prisma.clienteNegocio.create({
        data: {
          clienteId: cliente.id,
          negocioId: validatedData.negocioId
        }
      })
    }

    let finalEmpleadoId = empleadoId

    if (!finalEmpleadoId) {
      const EmpleadoNoAsignado = await prisma.empleado.findFirst({
        where: {
          sucursalId: validatedData.sucursalId,
          deleted: false
        },
        orderBy: { createdAt: 'asc' }
      })

      if (!EmpleadoNoAsignado) {
        throw new BadRequestError('No hay empleados disponibles en esta sucursal')
      }

      finalEmpleadoId = EmpleadoNoAsignado.id
    }

    const validServicioIds = servicioIds ? servicioIds.filter((id): id is string => !!id) : []

    const { negocioId, ...restCitaData } = citaData

    const nuevaCita = await prisma.cita.create({
      data: {
        ...restCitaData,
        empleadoId: finalEmpleadoId,
        clienteId: cliente.id,
        estado: 'PENDIENTE',
        ...(validServicioIds.length > 0 && {
            servicioCitas: {
              create: validServicioIds.map((servicioId) => ({ servicioId }))
            }
          })
      },
      include: {
        servicioCitas: {
          include: {
            servicio: {
              include: {
                servicioSucursals: true
              }
            }
          }
        },
        empleado: {
          select: { id: true, nombre: true, apellido: true }
        },
        sucursal: {
          select: { id: true, nombre: true }
        }
      }
    })

    return createdResponse({
      cita: nuevaCita,
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        email: cliente.email
      }
    })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return conflictResponse('Ya existe una cita en este horario')
    }
    return handleApiError(error)
  }
}