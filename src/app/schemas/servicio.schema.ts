import * as yup from 'yup'

export const servicioSucursalSchema = yup.object({
  sucursalId: yup.string().required('La sucursal es requerida'),
  precio: yup.number().nullable().transform((v) => (v === '' ? null : v)),
  costo: yup.number().nullable().transform((v) => (v === '' ? null : v)),
  activo: yup.boolean().default(true)
})

export const servicioSchema = yup.object({
  nombre: yup.string().required('El nombre es requerido'),
  descripcion: yup.string().nullable(),
  duracionMinutos: yup.number().required('La duracion en minutos es requerida'),
  negocioId: yup.string(), // Opcional si viene del contexto
  sucursales: yup.array().of(servicioSucursalSchema).min(1, 'Debe seleccionar al menos una sucursal')
})

export const servicioUpdateSchema = yup.object({
  nombre: yup.string(),
  descripcion: yup.string().nullable(),
  duracionMinutos: yup.number(),
  sucursales: yup.array().of(servicioSucursalSchema)
})
