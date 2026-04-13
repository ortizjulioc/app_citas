import * as yup from 'yup'

const tipoSalarioEnum = ['FIJO', 'POR_HORA', 'POR_COMISION']

export const empleadoSchema = yup.object({
  nombre: yup.string().required('El nombre es requerido'),
  apellido: yup.string().required('El apellido es requerido'),
  telefono: yup.string().required('El telefono es requerido'),
  email: yup.string().email('Email invalido').required('El email es requerido'),
  tipoSalario: yup
    .string()
    .oneOf(tipoSalarioEnum, 'Tipo de salario invalido')
    .required('El tipo de salario es requerido'),
  salarioBase: yup.number().nullable(),
  fechaContratacion: yup.date().nullable(),
  sucursalId: yup.string().required('La sucursal es requerida'),
  usuarioId: yup.string().nullable()
})

export const empleadoUpdateSchema = yup.object({
  nombre: yup.string(),
  apellido: yup.string(),
  telefono: yup.string(),
  email: yup.string().email('Email invalido'),
  tipoSalario: yup.string().oneOf(tipoSalarioEnum, 'Tipo de salario invalido'),
  salarioBase: yup.number().nullable(),
  fechaContratacion: yup.date().nullable(),
  sucursalId: yup.string(),
  usuarioId: yup.string().nullable()
})
