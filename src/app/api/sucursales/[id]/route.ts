// @ts-nocheck
import prisma from '@/utils/lib/prisma'
import { sucursalUpdateSchema } from '@/app/schemas/sucursal.schema'
import { handleApiError, successResponse } from '@/utils/api-response'
import { NotFoundError } from '@/utils/errors'
import { verifyToken, JwtPayload } from '@/utils/lib/jwt'
import { getNegocioId } from '@/utils/get-negocio-id'

function getUserFromRequest(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  return verifyToken(token)
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const sucursal = await prisma.sucursal.findFirst({
      where: {
        id,
        deleted: false
      },
      include: {
        horarioSucursals: {
          orderBy: { diaSemana: 'asc' }
        }
      }
    })

    if (!sucursal) {
      throw new NotFoundError('Sucursal no encontrada o inactiva')
    }

    return successResponse(sucursal)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(request)
    const { id } = await params
    const body = await request.json()

    const validatedData = await sucursalUpdateSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    const { horarios, ...rest } = validatedData
    const updateData: any = { ...rest }

    if (body.negocioId) {
      const negocioId = getNegocioId(body, user)
      updateData.negocioId = negocioId
    }

    const sucursalActualizada = await prisma.sucursal.update({
      where: { id },
      data: {
        ...updateData,
        horarioSucursals: {
          deleteMany: {},
          create: horarios?.map(h => ({
            diaSemana: h.diaSemana,
            horaInicio: new Date(`1970-01-01T${h.horaInicio}:00Z`),
            horaFin: new Date(`1970-01-01T${h.horaFin}:00Z`),
            activo: h.activo
          }))
        }
      },
      include: {
        horarioSucursals: true
      }
    })

    return successResponse(sucursalActualizada)
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await prisma.sucursal.update({
      where: { id },
      data: { deleted: true }
    })

    return successResponse('Sucursal eliminada con éxito')
  } catch (error) {
    return handleApiError(error)
  }
}
