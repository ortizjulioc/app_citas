import * as yup from 'yup'

export const clienteSchema = yup.object({
  nombre: yup.string().required('El nombre es requerido'),
  apellido: yup.string().required('El apellido es requerido'),
  telefono: yup.string().required('El telefono es requerido'),
  email: yup.string().email('Email invalido').nullable(),
  fechaNacimiento: yup.date().nullable(),
  direccion: yup.string().nullable(),
  notas: yup.string().nullable()
})

export const clienteUpdateSchema = yup.object({
  nombre: yup.string(),
  apellido: yup.string(),
  telefono: yup.string(),
  email: yup.string().email('Email invalido').nullable(),
  fechaNacimiento: yup.date().nullable(),
  direccion: yup.string().nullable(),
  notas: yup.string().nullable()
})
