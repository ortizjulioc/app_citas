import * as yup from 'yup'

export const disponibilidadEmpleadoSchema = yup.object({
  empleadoId: yup.string().required('El empleado es requerido'),
  diaSemana: yup.string().required('El dia de la semana es requerido'),
  horaInicio: yup.string().required('La hora de inicio es requerida'),
  horaFin: yup.string().required('La hora de fin es requerida'),
})

export const disponibilidadEmpleadoUpdateSchema = yup.object({
  empleadoId: yup.string().optional(),
  diaSemana: yup.string().optional(),
  horaInicio: yup.string().optional(),
  horaFin: yup.string().optional(),
})
