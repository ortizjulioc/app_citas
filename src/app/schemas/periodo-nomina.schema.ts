import * as Yup from 'yup'

export const crearPeriodoNominaSchema = Yup.object({
  fechaInicio: Yup.date().typeError('Fecha de inicio inválida').required('La fecha de inicio es requerida'),
  fechaFin: Yup.date()
    .typeError('Fecha de fin inválida')
    .required('La fecha de fin es requerida')
    .min(Yup.ref('fechaInicio'), 'La fecha de fin debe ser posterior a la fecha de inicio')
})
