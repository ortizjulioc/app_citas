import * as yup from 'yup'

export const clienteNegocioSchema = yup.object({
  clienteId: yup.string().required('El ID del cliente es requerido'),
  negocioId: yup.string().required('El ID del negocio es requerido')
})

export const clienteNegocioCreateSchema = yup.object({
  email: yup.string().email().required('El email del cliente es requerido'),
  negocioId: yup.string().required('El ID del negocio es requerido')
})