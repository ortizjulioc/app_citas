import * as yup from 'yup'

export const usuarioRolSchema = yup.object({
  usuarioId: yup.string().required(),
  rolId: yup.string().required()
})

export const usuarioRolUpdateSchema = yup.object({
  usuarioId: yup.string().optional(),
  rolId: yup.string().optional()
})
