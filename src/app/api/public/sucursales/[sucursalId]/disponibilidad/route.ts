import prisma from '@/utils/lib/prisma'
import { handleApiError, successResponse, notFoundResponse, badRequestResponse } from '@/utils/api-response'

const DIA_SEMANA_MAP: Record<number, string> = {
  0: 'DOMINGO',
  1: 'LUNES',
  2: 'MARTES',
  3: 'MIERCOLES',
  4: 'JUEVES',
  5: 'VIERNES',
  6: 'SABADO'
}

function getDiaSemana(date: Date): string {
  return DIA_SEMANA_MAP[date.getUTCDay()]
}

// Prisma devuelve @db.Time como Date con la hora en UTC (e.g. 08:00 → T08:00:00Z)
// Usamos getUTCHours/getUTCMinutes para leer el valor real independiente del TZ del servidor
function timeToMinutes(time: Date): number {
  return time.getUTCHours() * 60 + time.getUTCMinutes()
}

export async function GET(request: Request, { params }: { params: Promise<{ sucursalId: string }> }) {
  try {
    const { sucursalId } = await params
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha')
    const duracion = parseInt(searchParams.get('duracion') || '60')
    const servicioId = searchParams.get('servicioId')

    if (!fecha) {
      return badRequestResponse('Fecha requerida')
    }

    const [year, month, day] = fecha.split('-').map(Number)
    // Crear la fecha en UTC para que getDiaSemana y los slots sean consistentes
    const fechaDate = new Date(Date.UTC(year, month - 1, day))
    const diaSemana = getDiaSemana(fechaDate)

    const sucursal = await prisma.sucursal.findFirst({
      where: { id: sucursalId, deleted: false }
    })

    if (!sucursal) {
      return notFoundResponse('Sucursal no encontrada')
    }

    const empleados = await prisma.empleado.findMany({
      where: {
        sucursalId,
        deleted: false,
        ...(servicioId && {
          servicioEmpleados: {
            some: {
              servicioId,
              deleted: false
            }
          }
        })
      },
      select: {
        id: true,
        nombre: true,
        apellido: true
      }
    })

    const disponibilidadPorEmpleado = await Promise.all(
      empleados.map(async empleado => {
        const horarios = await prisma.horarioEmpleado.findMany({
          where: {
            empleadoId: empleado.id,
            diaSemana: diaSemana as any,
            deleted: false
          }
        })

        if (horarios.length === 0) {
          return {
            empleado,
            disponible: false,
            mensaje: 'No trabaja este día',
            horarios: []
          }
        }

        const inicio = timeToMinutes(horarios[0].horaInicio)
        const fin = timeToMinutes(horarios[0].horaFin)

        const bloqueos = await prisma.bloqueoHorario.findMany({
          where: {
            empleadoId: empleado.id,
            deleted: false,
            inicio: { lte: new Date(fechaDate.getTime() + 24 * 60 * 60 * 1000) },
            fin: { gte: fechaDate }
          }
        })

        const citas = await prisma.cita.findMany({
          where: {
            empleadoId: empleado.id,
            deleted: false,
            estado: { not: 'CANCELADA' },
            inicio: {
              gte: new Date(fechaDate.getTime()),
              lt: new Date(fechaDate.getTime() + 24 * 60 * 60 * 1000)
            }
          },
          select: {
            inicio: true,
            fin: true
          }
        })

        const slots: { inicio: string; fin: string }[] = []

        for (let time = inicio; time + duracion <= fin; time += 30) {
          const slotInicio = new Date(fechaDate.getTime())
          // setUTCHours para ser consistente con cómo leemos los tiempos del DB
          slotInicio.setUTCHours(Math.floor(time / 60), time % 60, 0, 0)

          const slotFin = new Date(slotInicio)
          slotFin.setMinutes(slotFin.getMinutes() + duracion)

          const bloqueado = bloqueos.some(b => slotInicio < b.fin && slotFin > b.inicio)

          if (bloqueado) continue

          const ocupado = citas.some(c => slotInicio < c.fin && slotFin > c.inicio)

          if (ocupado) continue

          slots.push({
            inicio: slotInicio.toISOString(),
            fin: slotFin.toISOString()
          })
        }

        return {
          empleado,
          disponible: slots.length > 0,
          mensaje: slots.length > 0 ? `${slots.length} horarios disponibles` : 'Sin horarios disponibles',
          horarios: slots
        }
      })
    )

    const empleadosConSlots = disponibilidadPorEmpleado.filter(e => e.disponible)

    return successResponse({
      disponibles: empleadosConSlots.length > 0,
      fecha: fecha,
      diaSemana,
      duracion,
      empleados: disponibilidadPorEmpleado,
      empleadosDisponibles: empleadosConSlots.length
    })
  } catch (error) {
    return handleApiError(error)
  }
}
