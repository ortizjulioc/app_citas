import prisma from '@/utils/lib/prisma'
import { actualizarEmpleadoSchema } from '@/app/schemas/actualizar-empleado.schema'
import { handleApiError, successResponse } from '@/utils/api-response'
import { NotFoundError } from '@/utils/errors'
import { $Enums } from '@/generated/prisma'

function parseTimeToDate(timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const empleado = await prisma.empleado.findFirst({
      where: {
        id,
        deleted: false
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        telefono: true,
        email: true,
        tipoSalario: true,
        salarioBase: true,
        fechaContratacion: true,
        sucursalId: true,
        usuarioId: true,
        createdAt: true,
        updatedAt: true,
        horarioEmpleados: {
          where: { deleted: false },
          select: {
            id: true,
            diaSemana: true,
            horaInicio: true,
            horaFin: true
          }
        },
        bloqueoHorarios: {
          where: { deleted: false },
          select: {
            id: true,
            inicio: true,
            fin: true,
            motivo: true
          }
        },
        comisionEmpleados: {
          where: { deleted: false },
          select: {
            id: true,
            servicioId: true,
            porcentaje: true,
            servicio: {
              select: {
                nombre: true
              }
            }
          }
        }
      }
    })

    if (!empleado) {
      throw new NotFoundError('Empleado no encontrado o inactivo')
    }

    return successResponse(empleado)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const validatedData = await actualizarEmpleadoSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    const empleadoExiste = await prisma.empleado.findFirst({
      where: { id, deleted: false }
    })

    if (!empleadoExiste) {
      throw new NotFoundError('Empleado no encontrado')
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const { horario, bloqueos, servicios, ...datosEmpleado } = validatedData

      const datosActualizar: any = {}
      if (datosEmpleado.nombre !== undefined) datosActualizar.nombre = datosEmpleado.nombre
      if (datosEmpleado.apellido !== undefined) datosActualizar.apellido = datosEmpleado.apellido
      if (datosEmpleado.telefono !== undefined) datosActualizar.telefono = datosEmpleado.telefono
      if (datosEmpleado.tipoSalario !== undefined) datosActualizar.tipoSalario = datosEmpleado.tipoSalario as $Enums.TipoSalario
      if (datosEmpleado.salarioBase !== undefined) datosActualizar.salarioBase = datosEmpleado.salarioBase
      if (datosEmpleado.fechaContratacion !== undefined) datosActualizar.fechaContratacion = datosEmpleado.fechaContratacion
      if (datosEmpleado.sucursalId !== undefined) datosActualizar.sucursalId = datosEmpleado.sucursalId

      if (Object.keys(datosActualizar).length > 0) {
        await tx.empleado.update({
          where: { id },
          data: datosActualizar
        })
      }

      if (horario !== undefined) {
        await tx.horarioEmpleado.updateMany({
          where: { empleadoId: id },
          data: { deleted: true }
        })

        if (horario && horario.length > 0) {
          const horariosData = horario.map((h) => ({
            empleadoId: id,
            diaSemana: h.diaSemana as $Enums.DiaSemana,
            horaInicio: parseTimeToDate(h.horaInicio),
            horaFin: parseTimeToDate(h.horaFin)
          }))

          await tx.horarioEmpleado.createMany({ data: horariosData })
        }
      }

      if (bloqueos !== undefined) {
        await tx.bloqueoHorario.updateMany({
          where: { empleadoId: id },
          data: { deleted: true }
        })

        if (bloqueos && bloqueos.length > 0) {
          const bloqueosData = bloqueos.map((b) => ({
            empleadoId: id,
            inicio: new Date(b.inicio),
            fin: new Date(b.fin),
            motivo: b.motivo || null
          }))

          await tx.bloqueoHorario.createMany({ data: bloqueosData })
        }
      }

      if (servicios !== undefined) {
        await tx.comisionEmpleado.updateMany({
          where: { empleadoId: id },
          data: { deleted: true }
        })

        await tx.servicioEmpleado.updateMany({
          where: { empleadoId: id },
          data: { deleted: true }
        })

        if (servicios && servicios.length > 0) {
          for (const servicio of servicios) {
            await tx.comisionEmpleado.create({
              data: {
                empleadoId: id,
                servicioId: servicio.servicioId,
                porcentaje: servicio.porcentaje
              }
            })

            await tx.servicioEmpleado.create({
              data: {
                empleadoId: id,
                servicioId: servicio.servicioId
              }
            })
          }
        }
      }

      return tx.empleado.findUnique({
        where: { id },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          telefono: true,
          email: true,
          tipoSalario: true,
          salarioBase: true,
          fechaContratacion: true,
          sucursalId: true,
          createdAt: true
        }
      })
    })

    return successResponse(resultado)
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await prisma.empleado.update({
      where: { id },
      data: { deleted: true }
    })

    return successResponse('Empleado eliminado con exito')
  } catch (error) {
    return handleApiError(error)
  }
}