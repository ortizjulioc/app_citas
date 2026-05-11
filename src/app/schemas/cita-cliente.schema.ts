import * as yup from 'yup'

const estadoCitaEnum = ['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'FINALIZADA']

export const citaClienteSchema = yup.object({
  negocioId: yup.string().required('El negocio es requerido'),
  sucursalId: yup.string().required('La sucursal es requerida'),
  empleadoId: yup.string().nullable().optional(),
  clienteEmail: yup.string().email('Email inválido').required('El email del cliente es requerido'),
  clienteNombre: yup.string().required('El nombre del cliente es requerido'),
  clienteApellido: yup.string().required('El apellido del cliente es requerido'),
  clienteTelefono: yup.string().nullable().optional(),
  inicio: yup.date().required('La fecha de inicio es requerida'),
  fin: yup.date().required('La fecha de fin es requerida'),
  servicioIds: yup.array().of(yup.string()).optional()
})

export const citaClienteUpdateSchema = yup.object({
  empleadoId: yup.string().nullable().optional(),
  estado: yup.string().oneOf(estadoCitaEnum, 'Estado de cita inválido')
})