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

export const diasSemanaEnum = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO'
] as const

export const negocioSchema = yup.object({
  nombre: yup.string().required('El nombre es requerido'),
  descripcion: yup.string().nullable(),
  RNC: yup.string().nullable(),
  telefono: yup.string().nullable(),
  email: yup.string().email('Email inválido').nullable(),
  direccion: yup.string().nullable(),
  categoriaServicio: yup.string().oneOf(categoriaServicioEnum).required('La categoría del servicio es requerida'),
  horaApertura: yup.string().required('La hora de apertura es requerida'),
  horaCierre: yup.string().required('La hora de cierre es requerida'),
  diasLaborables: yup
    .array()
    .of(yup.string().oneOf(diasSemanaEnum))
    .required('Los días laborales son requeridos')
    .min(1, 'Debe seleccionar al menos un día'),
  sucursal: yup.string().required('El nombre de la sucursal es requerido')
})

export const negocioUpdateSchema = yup.object({
  nombre: yup.string(),
  descripcion: yup.string().nullable(),
  RNC: yup.string().nullable(),
  telefono: yup.string().nullable(),
  email: yup.string().email('Email inválido').nullable(),
  direccion: yup.string().nullable(),
  categoriaServicio: yup.string().oneOf(categoriaServicioEnum),
  horaApertura: yup.string(),
  horaCierre: yup.string(),
  diasLaborables: yup.array().of(yup.string().oneOf(diasSemanaEnum)),
  sucursal: yup.string()
})
