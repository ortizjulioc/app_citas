import bcrypt from 'bcryptjs'
import * as yup from 'yup'
import { PrismaClient, Prisma } from '@/generated/prisma'

import prisma from '@/utils/lib/prisma'
import { handleApiError, createdResponse } from '@/utils/api-response'
import { ConflictError } from '@/utils/errors'
import { usuarioSchema } from '@/app/schemas/usuario.schema'
import { negocioSchema } from '@/app/schemas/negocio.schema'

const ROL_ADMIN = 'admin'
const ROL_CLIENTE = 'cliente'

async function getOrCreateRol(tx: PrismaClient | Prisma.TransactionClient, nombre: string, descripcion: string) {
  let rol = await tx.rol.findFirst({ where: { nombre, deleted: false } })
  if (!rol) {
    rol = await tx.rol.create({
      data: { nombre, descripcion }
    })
  }
  return rol
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const baseSchema = yup.object({
      tipoRegistro: yup.string().oneOf(['cliente', 'empresa']).required('El tipo de registro es requerido'),
      usuario: usuarioSchema,
    })

    const initialData = await baseSchema.validate(body, { stripUnknown: true })

    const registerSchema = yup.object({
      tipoRegistro: yup.string().oneOf(['cliente', 'empresa']).required(),
      usuario: usuarioSchema,
      negocio: initialData.tipoRegistro === 'empresa' ? negocioSchema.required('Datos de empresa requeridos') : yup.object().nullable().strip()
    })

    const validatedData = await registerSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true
    })

    const existe = await prisma.usuario.findUnique({
      where: { email: validatedData.usuario.email }
    })

    if (existe) {
      throw new ConflictError('El correo del usuario ya está registrado')
    }

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

        const rolAdmin = await getOrCreateRol(tx, ROL_ADMIN, 'Administrador del negocio')

        await tx.usuarioRol.create({
          data: {
            usuarioId: user.id,
            rolId: rolAdmin.id
          }
        })

        return user
      })
    } else {
      nuevoUsuario = await prisma.$transaction(async (tx) => {
        const user = await tx.usuario.create({
          data: {
            ...validatedData.usuario,
            password: hashedPassword
          }
        })

        const rolCliente = await getOrCreateRol(tx, ROL_CLIENTE, 'Cliente que agenda citas')

        await tx.usuarioRol.create({
          data: {
            usuarioId: user.id,
            rolId: rolCliente.id
          }
        })

        await tx.cliente.create({
          data: {
            nombre: validatedData.usuario.nombre,
            apellido: validatedData.usuario.apellido,
            telefono: validatedData.usuario.telefono || null,
            email: validatedData.usuario.email
          }
        })

        return user
      })
    }

    const { password, ...usuarioSinPassword } = nuevoUsuario

    return createdResponse(usuarioSinPassword)
  } catch (error) {
    console.log(error)
    return handleApiError(error)
  }
}