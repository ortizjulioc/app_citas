import * as yup from 'yup'

export const sucursalSchema = yup.object({
  nombre: yup.string().required('El nombre es requerido'),
  negocioId: yup.string().nullable()
})

export const sucursalUpdateSchema = yup.object({
  nombre: yup.string(),
  negocioId: yup.string().nullable()
})
