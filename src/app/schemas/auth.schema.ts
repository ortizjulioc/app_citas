import * as yup from 'yup'

export const loginSchema = yup.object({
  email: yup.string().required('El correo es requerido').email('Correo inválido'),
  password: yup.string().required('La contraseña es requerida').min(6, 'Mínimo 6 caracteres')
})
