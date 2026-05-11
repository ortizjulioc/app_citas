import prisma from '@/utils/lib/prisma'
import { handleApiError, successResponse, notFoundResponse } from '@/utils/api-response'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const negocio = await prisma.negocio.findFirst({
      where: { id, deleted: false },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        telefono: true,
        email: true,
        direccion: true,
        categoriaServicio: true,
        sucursals: {
          where: { deleted: false },
          select: {
            id: true,
            nombre: true
          },
          orderBy: { nombre: 'asc' }
        }
      }
    })

    if (!negocio) {
      return notFoundResponse('Empresa no encontrada')
    }

    return successResponse(negocio)
  } catch (error) {
    return handleApiError(error)
  }
}