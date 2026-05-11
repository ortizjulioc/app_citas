import * as yup from 'yup'

const estadoCitaEnum = ['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'FINALIZADA']

export const citaSchema = yup.object({
  clienteId: yup.string().required('El cliente es requerido'),
  empleadoId: yup.string().required('El empleado es requerido'),
  sucursalId: yup.string().required('La sucursal es requerida'),
  inicio: yup.date().required('La fecha de inicio es requerida'),
  fin: yup.date().required('La fecha de fin es requerida'),
  estado: yup.string().oneOf(estadoCitaEnum, 'Estado de cita invalido').default('PENDIENTE'),
  servicioIds: yup.array().of(yup.string()).optional()
})

export const citaUpdateSchema = yup.object({
  clienteId: yup.string(),
  empleadoId: yup.string(),
  sucursalId: yup.string(),
  inicio: yup.date(),
  fin: yup.date(),
  estado: yup.string().oneOf(estadoCitaEnum, 'Estado de cita invalido'),
  servicioIds: yup.array().of(yup.string()).optional()
})
