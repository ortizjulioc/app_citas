import * as yup from 'yup'

export const rolSchema = yup.object({
  nombre: yup.string().required(),
  descripcion: yup.string().required()
})

export const rolUpdateSchema = yup.object({
  nombre: yup.string().optional(),
  descripcion: yup.string().optional()
})
