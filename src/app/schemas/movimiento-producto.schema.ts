import * as yup from 'yup'

export const crearMovimientoProductoSchema = yup
  .object({
    tipo: yup.string().required('El tipo es requerido').oneOf(['ENTRADA', 'SALIDA', 'AJUSTE'], 'Tipo inválido'),
    cantidad: yup.number().required('La cantidad es requerida').min(1, 'La cantidad debe ser al menos 1'),
    referencia: yup.string().optional()
  })
  .test('referencia-required', 'La referencia es requerida para ENTRADA y SALIDA', function (values) {
    if (values.tipo === 'AJUSTE') return true
    if (!values.referencia || values.referencia.trim() === '') {
      return false
    }
    return true
  })
