import * as yup from 'yup'

const tipoSalarioEnum = ['FIJO', 'POR_HORA', 'POR_COMISION']
const diaSemanaEnum = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO']

const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/

const horarioSchema = yup.object({
  diaSemana: yup.string().oneOf(diaSemanaEnum, 'Día de semana inválido').required('El día de la semana es requerido'),
  horaInicio: yup
    .string()
    .matches(timeRegex, 'Formato de hora inválido, use HH:mm')
    .required('La hora de inicio es requerida'),
  horaFin: yup
    .string()
    .matches(timeRegex, 'Formato de hora inválido, use HH:mm')
    .required('La hora de fin es requerida')
})

const bloqueoSchema = yup.object({
  inicio: yup.date().required('La fecha de inicio es requerida'),
  fin: yup.date().required('La fecha de fin es requerida'),
  motivo: yup.string().nullable()
})

const servicioSchema = yup.object({
  servicioId: yup.string().required('El servicio es requerido'),
  porcentaje: yup.number().min(0).max(100).required('El porcentaje es requerido')
})

export const actualizarEmpleadoSchema = yup.object({
  nombre: yup.string(),
  apellido: yup.string(),
  telefono: yup.string().nullable(),
  email: yup.string().email('Email inválido'),
  password: yup.string().nullable(),
  tipoSalario: yup.string().oneOf(tipoSalarioEnum, 'Tipo de salario inválido'),
  salarioBase: yup.number().nullable(),
  fechaContratacion: yup.date().nullable(),
  sucursalId: yup.string(),
  negocioId: yup.string(),
  horario: yup.array().of(horarioSchema).nullable(),
  bloqueos: yup.array().of(bloqueoSchema).nullable(),
  servicios: yup.array().of(servicioSchema).nullable()
})
