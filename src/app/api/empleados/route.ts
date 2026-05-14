import bcrypt from 'bcryptjs'
import prisma from '@/utils/lib/prisma'
import { crearEmpleadoSchema } from '@/app/schemas/crear-empleado.schema'
import { handleApiError, successResponse, createdResponse } from '@/utils/api-response'
import { verifyToken, JwtPayload } from '@/utils/lib/jwt'
import { ConflictError } from '@/utils/errors'
import { $Enums } from '@/generated/prisma'

function getUserFromRequest(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  return verifyToken(token)
}

function parseTimeToDate(timeString: string): Date {
  // Usar UTC para que sea consistente con la lectura en disponibilidad
  const [hours, minutes] = timeString.split(':').map(Number)
  return new Date(`1970-01-01T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const validatedData = await crearEmpleadoSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    const existeUsuario = await prisma.usuario.findUnique({
      where: { email: validatedData.email }
    })

    if (existeUsuario) {
      throw new ConflictError('El correo del usuario ya está registrado')
    }

    const resultado = await prisma.$transaction(async tx => {
      const hashedPassword = await bcrypt.hash(validatedData.password, 10)

      const nuevoUsuario = await tx.usuario.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          nombre: validatedData.nombre,
          apellido: validatedData.apellido,
          telefono: validatedData.telefono || null
        }
      })

      const rolEmpleado = await tx.rol.findFirst({
        where: { nombre: 'empleado', deleted: false }
      })

      if (!rolEmpleado) {
        throw new Error('Rol empleado no encontrado. Ejecute el seed.')
      }

      await tx.usuarioRol.create({
        data: {
          usuarioId: nuevoUsuario.id,
          rolId: rolEmpleado.id
        }
      })

      const nuevoEmpleado = await tx.empleado.create({
        data: {
          usuarioId: nuevoUsuario.id,
          nombre: validatedData.nombre,
          apellido: validatedData.apellido,
          telefono: validatedData.telefono || '',
          email: validatedData.email,
          tipoSalario: validatedData.tipoSalario as $Enums.TipoSalario,
          salarioBase: validatedData.salarioBase,
          fechaContratacion: validatedData.fechaContratacion,
          sucursalId: validatedData.sucursalId,
          negocioId: validatedData.negocioId
        }
      })

      if (validatedData.horario && validatedData.horario.length > 0) {
        const horariosData = validatedData.horario.map(h => ({
          empleadoId: nuevoEmpleado.id,
          diaSemana: h.diaSemana as $Enums.DiaSemana,
          horaInicio: parseTimeToDate(h.horaInicio),
          horaFin: parseTimeToDate(h.horaFin)
        }))

        await tx.horarioEmpleado.createMany({ data: horariosData })
      }

      if (validatedData.bloqueos && validatedData.bloqueos.length > 0) {
        const bloqueosData = validatedData.bloqueos.map(b => ({
          empleadoId: nuevoEmpleado.id,
          inicio: b.inicio,
          fin: b.fin,
          motivo: b.motivo || null
        }))

        await tx.bloqueoHorario.createMany({ data: bloqueosData })
      }

      if (validatedData.servicios && validatedData.servicios.length > 0) {
        for (const servicio of validatedData.servicios) {
          await tx.comisionEmpleado.create({
            data: {
              empleadoId: nuevoEmpleado.id,
              servicioId: servicio.servicioId,
              porcentaje: servicio.porcentaje
            }
          })

          await tx.servicioEmpleado.create({
            data: {
              empleadoId: nuevoEmpleado.id,
              servicioId: servicio.servicioId
            }
          })
        }
      }

      return {
        usuario: {
          id: nuevoUsuario.id,
          email: nuevoUsuario.email,
          nombre: nuevoUsuario.nombre,
          apellido: nuevoUsuario.apellido,
          telefono: nuevoUsuario.telefono
        },
        empleado: nuevoEmpleado
      }
    })

    return createdResponse(resultado)
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    const search = searchParams.get('search') || ''
    const sucursalIdQuery = searchParams.get('sucursalId')
    const negocioIdQuery = searchParams.get('negocioId')

    const where: any = {
      deleted: false
    }

    if (sucursalIdQuery) {
      where.sucursalId = sucursalIdQuery
    }

    if (negocioIdQuery) {
      where.negocioId = negocioIdQuery
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' } },
            { apellido: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { telefono: { contains: search, mode: 'insensitive' } }
          ]
        }
      ]
    }

    const [empleados, total] = await Promise.all([
      prisma.empleado.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
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
          createdAt: true
        }
      }),
      prisma.empleado.count({ where })
    ])

    return successResponse({
      empleados,
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
