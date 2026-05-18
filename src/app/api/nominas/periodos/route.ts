// @ts-nocheck
import prisma from '@/utils/lib/prisma'
import { crearPeriodoNominaSchema } from '@/app/schemas/periodo-nomina.schema'
import { handleApiError, successResponse, createdResponse } from '@/utils/api-response'
import { verifyToken, JwtPayload } from '@/utils/lib/jwt'
import { BadRequestError } from '@/utils/errors'

function getUserFromRequest(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  return verifyToken(token)
}

/**
 * Calcula las comisiones ganadas por un empleado en un período dado.
 * Busca citas FINALIZADAS del empleado, identifica los servicios realizados,
 * obtiene el precio del servicio en la sucursal y aplica el porcentaje de comisión.
 */
async function calcularComisiones(
  empleadoId: string,
  sucursalId: string,
  fechaInicio: Date,
  fechaFin: Date
): Promise<{ comision: number; detalles: { descripcion: string; cantidad: number }[] }> {
  const citas = await prisma.cita.findMany({
    where: {
      empleadoId,
      estado: 'FINALIZADA',
      deleted: false,
      inicio: { gte: fechaInicio, lte: fechaFin }
    },
    include: {
      servicioCitas: {
        where: { deleted: false },
        include: {
          servicio: {
            include: {
              servicioSucursals: { where: { sucursalId } },
              comisionEmpleados: { where: { empleadoId, deleted: false } }
            }
          }
        }
      }
    }
  })

  let comisionTotal = 0
  const detalles: { descripcion: string; cantidad: number }[] = []

  for (const cita of citas) {
    for (const sc of cita.servicioCitas) {
      const precio = sc.servicio.servicioSucursals[0]?.precio ?? 0
      const porcentaje = sc.servicio.comisionEmpleados[0]?.porcentaje ?? 0
      if (porcentaje > 0 && precio > 0) {
        const monto = Math.round(precio * (porcentaje / 100) * 100) / 100
        comisionTotal += monto
        detalles.push({
          descripcion: `Comisión ${sc.servicio.nombre} (${porcentaje}% de RD$${precio.toFixed(2)})`,
          cantidad: monto
        })
      }
    }
  }

  return { comision: Math.round(comisionTotal * 100) / 100, detalles }
}

// GET /api/nominas/periodos — lista períodos del negocio (filtrado por empleados del negocio)
export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Filtramos los períodos que tienen nóminas de empleados de este negocio
    const [periodos, total] = await Promise.all([
      prisma.periodoNomina.findMany({
        skip,
        take: limit,
        where: {
          nominas: {
            some: {
              deleted: false,
              empleado: { negocioId: user.negocioId }
            }
          }
        },
        orderBy: { fechaInicio: 'desc' },
        include: {
          nominas: {
            where: {
              deleted: false,
              empleado: { negocioId: user.negocioId }
            },
            select: {
              id: true,
              total: true,
              empleado: { select: { id: true, nombre: true, apellido: true } }
            }
          }
        }
      }),
      prisma.periodoNomina.count({
        where: {
          nominas: {
            some: {
              deleted: false,
              empleado: { negocioId: user.negocioId }
            }
          }
        }
      })
    ])

    // Enriquecer con totales
    const periodosEnriquecidos = periodos.map(p => ({
      ...p,
      totalNomina: p.nominas.reduce((acc, n) => acc + n.total, 0),
      cantidadEmpleados: p.nominas.length
    }))

    return successResponse({
      periodos: periodosEnriquecidos,
      pagination: { total, page, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/nominas/periodos — crea un período y genera nóminas automáticamente
export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.negocioId) {
      return handleApiError(new BadRequestError('No autorizado'))
    }

    const body = await request.json()
    const data = await crearPeriodoNominaSchema.validate(body, { abortEarly: false, stripUnknown: true })

    const fechaInicio = new Date(data.fechaInicio)
    const fechaFin = new Date(data.fechaFin)

    // Verificar que no exista ya un período solapado para este negocio
    const periodoSolapado = await prisma.periodoNomina.findFirst({
      where: {
        nominas: {
          some: {
            deleted: false,
            empleado: { negocioId: user.negocioId }
          }
        },
        OR: [
          { fechaInicio: { lte: fechaFin }, fechaFin: { gte: fechaInicio } }
        ]
      }
    })

    if (periodoSolapado) {
      return handleApiError(new BadRequestError('Ya existe un período de nómina que se solapa con las fechas indicadas'))
    }

    // Obtener todos los empleados activos del negocio
    const empleados = await prisma.empleado.findMany({
      where: { negocioId: user.negocioId, deleted: false },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        tipoSalario: true,
        salarioBase: true,
        sucursalId: true
      }
    })

    if (empleados.length === 0) {
      return handleApiError(new BadRequestError('No hay empleados activos en el negocio'))
    }

    // Calcular nóminas para cada empleado y crear todo en una transacción
    const nominasData = await Promise.all(
      empleados.map(async emp => {
        let salarioBase = 0
        let comision = 0
        const detallesComision: { descripcion: string; cantidad: number }[] = []

        if (emp.tipoSalario === 'FIJO') {
          salarioBase = emp.salarioBase ?? 0
        } else if (emp.tipoSalario === 'POR_COMISION') {
          const resultado = await calcularComisiones(emp.id, emp.sucursalId, fechaInicio, fechaFin)
          comision = resultado.comision
          detallesComision.push(...resultado.detalles)
        } else if (emp.tipoSalario === 'POR_HORA') {
          // Para POR_HORA se usa salarioBase como base y se ajusta manualmente
          salarioBase = emp.salarioBase ?? 0
        }

        const total = Math.round((salarioBase + comision) * 100) / 100

        return { emp, salarioBase, comision, detallesComision, total }
      })
    )

    const resultado = await prisma.$transaction(async tx => {
      const periodo = await tx.periodoNomina.create({
        data: {
          fechaInicio,
          fechaFin,
          estado: 'ABIERTO'
        }
      })

      const nominasCreadas = []
      for (const { emp, salarioBase, comision, detallesComision, total } of nominasData) {
        const nomina = await tx.nomina.create({
          data: {
            empleadoId: emp.id,
            periodonominaId: periodo.id,
            salarioBase,
            comision,
            bonos: 0,
            total
          }
        })

        // Crear detalles de comisión si existen
        if (detallesComision.length > 0) {
          await tx.detalleNomina.createMany({
            data: detallesComision.map(d => ({
              nominaId: nomina.id,
              tipo: 'INGRESO',
              descripcion: d.descripcion,
              cantidad: d.cantidad
            }))
          })
        }

        // Crear detalle de salario base si aplica
        if (salarioBase > 0) {
          await tx.detalleNomina.create({
            data: {
              nominaId: nomina.id,
              tipo: 'INGRESO',
              descripcion: emp.tipoSalario === 'FIJO' ? 'Salario fijo del período' : 'Salario base del período',
              cantidad: salarioBase
            }
          })
        }

        nominasCreadas.push(nomina)
      }

      return { periodo, nominasCreadas }
    })

    return createdResponse({
      periodo: resultado.periodo,
      nominasGeneradas: resultado.nominasCreadas.length
    })
  } catch (error) {
    return handleApiError(error)
  }
}
