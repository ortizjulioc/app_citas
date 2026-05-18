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

export const diasSemanaEnum = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'] as const

export const horarioSchema = yup.object({
  diaSemana: yup.string().oneOf(diasSemanaEnum).required(),
  horaInicio: yup.string().required(),
  horaFin: yup.string().required(),
  activo: yup.boolean().default(true)
})

export const negocioSchema = yup.object({
  nombre: yup.string().required('El nombre es requerido'),
  descripcion: yup.string().nullable(),
  RNC: yup.string().nullable(),
  telefono: yup.string().nullable(),
  email: yup.string().email('Email inválido').nullable(),
  direccion: yup.string().nullable(),
  categoriaServicio: yup.string().oneOf(categoriaServicioEnum).required('La categoría del servicio es requerida'),
  horarios: yup
    .array()
    .of(horarioSchema)
    .required('Los horarios son requeridos')
    .min(1, 'Debe configurar al menos un horario'),
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
  horarios: yup.array().of(horarioSchema),
  sucursal: yup.string()
})
