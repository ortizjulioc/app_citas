import * as yup from 'yup'

const tipoSalarioEnum = ['FIJO', 'POR_HORA', 'POR_COMISION']
const diaSemanaEnum = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO']

const horarioSchema = yup.object({
  diaSemana: yup.string().oneOf(diaSemanaEnum, 'Día de semana inválido').required('El día de la semana es requerido'),
  horaInicio: yup.string().required('La hora de inicio es requerida'),
  horaFin: yup.string().required('La hora de fin es requerida')
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

export const crearEmpleadoSchema = yup.object({
  email: yup.string().email('Email inválido').required('El email es requerido'),
  password: yup
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .required('La contraseña es requerida'),
  nombre: yup.string().required('El nombre es requerido'),
  apellido: yup.string().required('El apellido es requerido'),
  telefono: yup.string().nullable(),
  tipoSalario: yup
    .string()
    .oneOf(tipoSalarioEnum, 'Tipo de salario inválido')
    .required('El tipo de salario es requerido'),
  salarioBase: yup.number().nullable(),
  fechaContratacion: yup.date().nullable(),
  sucursalId: yup.string().required('La sucursal es requerida'),
  negocioId: yup.string().required('El negocio es requerido'),
  horario: yup.array().of(horarioSchema).nullable(),
  bloqueos: yup.array().of(bloqueoSchema).nullable(),
  servicios: yup.array().of(servicioSchema).nullable()
})
