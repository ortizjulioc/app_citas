import * as yup from 'yup'

export const servicioSchema = yup.object({
  nombre: yup.string().required('El nombre es requerido'),
  descripcion: yup.string().nullable(),
  precio: yup.number().nullable(),
  costo: yup.number().nullable(),
  duracionMinutos: yup.number().required('La duracion en minutos es requerida'),
  activo: yup.boolean().default(true),
  sucursalId: yup.string().required('La sucursal es requerida')
})

export const servicioUpdateSchema = yup.object({
  nombre: yup.string(),
  descripcion: yup.string().nullable(),
  precio: yup.number().nullable(),
  costo: yup.number().nullable(),
  duracionMinutos: yup.number(),
  activo: yup.boolean(),
  sucursalId: yup.string()
})
