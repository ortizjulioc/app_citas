import * as Yup from 'yup'

export const agregarDetalleNominaSchema = Yup.object({
  tipo: Yup.string()
    .oneOf(['INGRESO', 'DEDUCCION', 'AJUSTE'], 'Tipo inválido')
    .required('El tipo es requerido'),
  descripcion: Yup.string().required('La descripción es requerida').min(1).max(200),
  cantidad: Yup.number()
    .typeError('El monto debe ser un número')
    .required('El monto es requerido')
    .min(0, 'El monto no puede ser negativo')
})
