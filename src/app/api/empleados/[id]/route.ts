import prisma from '@/utils/lib/prisma'
import { actualizarEmpleadoSchema } from '@/app/schemas/actualizar-empleado.schema'
import { handleApiError, successResponse } from '@/utils/api-response'
import { NotFoundError } from '@/utils/errors'
import { $Enums } from '@/generated/prisma'
import bcrypt from 'bcryptjs'

function formatTime(date: Date | null): string {
  if (!date) return ''
  // getUTCHours/getUTCMinutes para leer consistente con cómo se almacena (UTC)
  const h = String(date.getUTCHours()).padStart(2, '0')
  const m = String(date.getUTCMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function parseTimeToDate(timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number)
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time string: ${timeString}`)
  }
  // Almacenar como UTC para ser consistente con la lectura en disponibilidad
  return new Date(`1970-01-01T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`)
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
        negocioId: true,
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

    const horarioFormateado = empleado.horarioEmpleados.map(h => ({
      ...h,
      horaInicio: formatTime(h.horaInicio),
      horaFin: formatTime(h.horaFin)
    }))

    const empleadoFormateado = {
      ...empleado,
      horarioEmpleados: horarioFormateado
    }

    return successResponse(empleadoFormateado)
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

    const resultado = await prisma.$transaction(async tx => {
      const { horario, bloqueos, servicios, password, ...datosEmpleado } = validatedData

      const datosActualizar: any = {}
      if (datosEmpleado.nombre !== undefined) datosActualizar.nombre = datosEmpleado.nombre
      if (datosEmpleado.apellido !== undefined) datosActualizar.apellido = datosEmpleado.apellido
      if (datosEmpleado.telefono !== undefined) datosActualizar.telefono = datosEmpleado.telefono
      if (datosEmpleado.tipoSalario !== undefined)
        datosActualizar.tipoSalario = datosEmpleado.tipoSalario as $Enums.TipoSalario
      if (datosEmpleado.salarioBase !== undefined) datosActualizar.salarioBase = datosEmpleado.salarioBase
      if (datosEmpleado.fechaContratacion !== undefined)
        datosActualizar.fechaContratacion = datosEmpleado.fechaContratacion
      if (datosEmpleado.sucursalId !== undefined) datosActualizar.sucursalId = datosEmpleado.sucursalId
      if (datosEmpleado.negocioId !== undefined) datosActualizar.negocioId = datosEmpleado.negocioId

      if (Object.keys(datosActualizar).length > 0) {
        await tx.empleado.update({
          where: { id },
          data: datosActualizar
        })
      }

      if (password && empleadoExiste.usuarioId) {
        const hashedPassword = await bcrypt.hash(password, 10)
        await tx.usuario.update({
          where: { id: empleadoExiste.usuarioId },
          data: { password: hashedPassword }
        })
      }

      if (horario !== undefined) {
        await tx.horarioEmpleado.updateMany({
          where: { empleadoId: id },
          data: { deleted: true }
        })

        if (horario && horario.length > 0) {
          const horariosData = horario.map(h => ({
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
          const bloqueosData = bloqueos.map(b => ({
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
