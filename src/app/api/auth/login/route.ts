import bcrypt from 'bcryptjs'

import prisma from '@/utils/lib/prisma'
import { loginSchema } from '@/app/schemas/auth.schema'
import { UnauthorizedError, NotFoundError } from '@/utils/errors'
import { handleApiError, successResponse } from '@/utils/api-response'
import { generateToken, JwtPayload } from '@/utils/lib/jwt'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const validatedData = await loginSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    const usuario = await prisma.usuario.findUnique({
      where: { email: validatedData.email, deleted: false },
      include: {
        usuarioRols: {
          where: { deleted: false },
          include: { rol: true }
        }
      }
    })

    if (!usuario) {
      throw new NotFoundError('Usuario no encontrado')
    }

    const isValidPassword = await bcrypt.compare(validatedData.password, usuario.password)

    if (!isValidPassword) {
      throw new UnauthorizedError('Credenciales inválidas')
    }

    const roles = usuario.usuarioRols.map(ur => ur.rol.nombre)

    const payload: JwtPayload = {
      userId: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      negocioId: usuario.negocioId,
      roles
    }

    const token = generateToken(payload)

    const { password, ...usuarioSinPassword } = usuario

    return successResponse({
      token,
      user: {
        id: usuarioSinPassword.id,
        email: usuarioSinPassword.email,
        nombre: usuarioSinPassword.nombre,
        apellido: usuarioSinPassword.apellido,
        telefono: usuarioSinPassword.telefono,
        negocioId: usuarioSinPassword.negocioId,
        roles
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
