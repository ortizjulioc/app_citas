import * as yup from 'yup'

export const categoriaServicioEnum = [
  'SALUD',
  'BELLEZA',
  'AUTOMOTRIZ',
  'PROFESIONAL',
  'EDUCACION',
  'HOGAR',
  'TECNOLOGIA',
  'FITNESS',
  'OTROS'
] as const

export const negocioSchema = yup.object({
  nombre: yup.string().required('El nombre es requerido'),
  descripcion: yup.string().nullable(),
  RNC: yup.string().nullable(),
  telefono: yup.string().nullable(),
  email: yup.string().email('Email inválido').nullable(),
  direccion: yup.string().nullable(),
  categoriaServicio: yup.string().oneOf(categoriaServicioEnum).required('La categoría del servicio es requerida')
})

export const negocioUpdateSchema = yup.object({
  nombre: yup.string(),
  descripcion: yup.string().nullable(),
  RNC: yup.string().nullable(),
  telefono: yup.string().nullable(),
  email: yup.string().email('Email inválido').nullable(),
  direccion: yup.string().nullable(),
  categoriaServicio: yup.string().oneOf(categoriaServicioEnum)
})
