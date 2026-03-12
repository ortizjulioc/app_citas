import * as yup from 'yup'

export const usuarioSchema = yup.object({
  email: yup.string().email().required(),
  negocioId: yup.string().optional(),
  password: yup.string().required(),
  nombre: yup.string().required(),
  apellido: yup.string().required(),
  telefono: yup.string().required(),
  deleted: yup.boolean().default(false),
  createdAt: yup.date().optional(),
  updatedAt: yup.date().optional()
})

export const usuarioUpdateSchema = yup.object({
  email: yup.string().email().optional(),
  negocioId: yup.string().optional(),
  password: yup.string().optional(),
  nombre: yup.string().optional(),
  apellido: yup.string().optional(),
  telefono: yup.string().optional(),
  deleted: yup.boolean().optional()
})
