import * as Yup from 'yup'

export const crearCajaSchema = Yup.object({
  sucursalId: Yup.string().required('La sucursal es requerida'),
  nombre: Yup.string().required('El nombre de la caja es requerido')
})

export const abrirSesionCajaSchema = Yup.object({
  cajaId: Yup.string().required('La caja es requerida'),
  montoApertura: Yup.number()
    .min(0, 'El monto de apertura no puede ser negativo')
    .required('El monto de apertura es requerido')
})

export const cerrarSesionCajaSchema = Yup.object({
  montoRealContado: Yup.number()
    .min(0, 'El monto contado no puede ser negativo')
    .required('El monto contado es requerido'),
  notasCierre: Yup.string().nullable().optional()
})

export const movimientoManualSchema = Yup.object({
  tipo: Yup.string()
    .oneOf(['GASTO', 'RETIRO'], 'Tipo inválido. Solo se permiten GASTO o RETIRO')
    .required('El tipo es requerido'),
  monto: Yup.number().positive('El monto debe ser mayor a 0').required('El monto es requerido'),
  descripcion: Yup.string().required('La descripción es requerida')
})

export const crearMetodoPagoSchema = Yup.object({
  nombre: Yup.string().required('El nombre es requerido'),
  descripcion: Yup.string().nullable().optional(),
  esEfectivo: Yup.boolean().default(false)
})
