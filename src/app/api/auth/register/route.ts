import bcrypt from 'bcryptjs'
import * as yup from 'yup'

import prisma from '@/utils/lib/prisma'
import { handleApiError, createdResponse } from '@/utils/api-response'
import { ConflictError } from '@/utils/errors'
import { usuarioSchema } from '@/app/schemas/usuario.schema'
import { negocioSchema } from '@/app/schemas/negocio.schema'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validar tipoRegistro primero
    const baseSchema = yup.object({
      tipoRegistro: yup.string().oneOf(['cliente', 'empresa']).required('El tipo de registro es requerido'),
      usuario: usuarioSchema,
    })

    const initialData = await baseSchema.validate(body, { stripUnknown: true })

    // Schema dinámico basado en tipoRegistro
    const registerSchema = yup.object({
      tipoRegistro: yup.string().oneOf(['cliente', 'empresa']).required(),
      usuario: usuarioSchema,
      negocio: initialData.tipoRegistro === 'empresa' ? negocioSchema.required('Datos de empresa requeridos') : yup.object().nullable().strip()
    })

    const validatedData = await registerSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    // Comprobar si existe el correo del usuario
    const existe = await prisma.usuario.findUnique({
      where: { email: validatedData.usuario.email }
    })

    if (existe) {
      throw new ConflictError('El correo del usuario ya está registrado')
    }

    // Comprobar si existe el correo de la empresa
    if (validatedData.tipoRegistro === 'empresa' && validatedData.negocio?.email) {
      const existeNegocio = await prisma.negocio.findFirst({
        where: { email: validatedData.negocio.email }
      })

      if (existeNegocio) {
        throw new ConflictError('El correo de la empresa ya está registrado')
      }
    }

    const hashedPassword = await bcrypt.hash(validatedData.usuario.password, 10)

    let nuevoUsuario

    if (validatedData.tipoRegistro === 'empresa' && validatedData.negocio) {
      // Crear negocio y usuario en una transacción
      nuevoUsuario = await prisma.$transaction(async (tx) => {
        const nuevoNegocio = await tx.negocio.create({
          data: validatedData.negocio!
        })

        const user = await tx.usuario.create({
          data: {
            ...validatedData.usuario,
            password: hashedPassword,
            negocioId: nuevoNegocio.id
          }
        })

        return user
      })
    } else {
      // Crear solo el usuario (cliente)
      nuevoUsuario = await prisma.usuario.create({
        data: {
          ...validatedData.usuario,
          password: hashedPassword
        }
      })
    }

    const { password, ...usuarioSinPassword } = nuevoUsuario

    return createdResponse(usuarioSinPassword)
  } catch (error) {
    console.log(error)
    return handleApiError(error)
  }
}
