import * as yup from 'yup'

const horarioSchema = yup.object({
  diaSemana: yup.string().oneOf(['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO']).required(),
  horaInicio: yup.string().required(),
  horaFin: yup.string().required(),
  activo: yup.boolean().default(true)
})

export const sucursalSchema = yup.object({
  nombre: yup.string().required('El nombre es requerido'),
  negocioId: yup.string().nullable(),
  horarios: yup.array().of(horarioSchema).optional()
})

export const sucursalUpdateSchema = yup.object({
  nombre: yup.string(),
  negocioId: yup.string().nullable(),
  horarios: yup.array().of(horarioSchema).optional()
})
