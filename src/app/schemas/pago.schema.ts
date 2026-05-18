import * as Yup from 'yup'

export const registrarPagoSchema = Yup.object({
  facturaId: Yup.string().required('La factura es requerida'),
  metodoPagoId: Yup.string().required('El método de pago es requerido'),
  sesionCajaId: Yup.string().nullable().optional(),
  monto: Yup.number().positive('El monto debe ser mayor a 0').required('El monto es requerido'),
  referencia: Yup.string().nullable().optional()
})
