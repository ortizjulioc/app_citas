import * as yup from 'yup'

export const usuarioSchema = yup.object({
  email: yup.string().email().required('El correo es requerido'),
  negocioId: yup.string().optional(),
  password: yup.string().required('La contraseña es requerida'),
  nombre: yup.string().required('El nombre es requerido'),
  apellido: yup.string().required('El apellido es requerido'),
  telefono: yup.string().required('El telefono es requerido'),
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
