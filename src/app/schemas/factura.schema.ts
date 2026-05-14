import * as Yup from 'yup'

const detalleItemSchema = Yup.object({
  tipo: Yup.string().oneOf(['SERVICIO', 'PRODUCTO']).required('El tipo de ítem es requerido'),
  servicioId: Yup.string().when('tipo', {
    is: 'SERVICIO',
    then: schema => schema.required('El servicioId es requerido para ítems de tipo SERVICIO'),
    otherwise: schema => schema.nullable().optional()
  }),
  productoId: Yup.string().when('tipo', {
    is: 'PRODUCTO',
    then: schema => schema.required('El productoId es requerido para ítems de tipo PRODUCTO'),
    otherwise: schema => schema.nullable().optional()
  }),
  descripcion: Yup.string().nullable().optional(),
  cantidad: Yup.number().integer().min(1, 'La cantidad mínima es 1').required('La cantidad es requerida'),
  precioUnitario: Yup.number().min(0, 'El precio no puede ser negativo').required('El precio es requerido'),
  descuento: Yup.number().min(0).default(0)
})

export const crearFacturaSchema = Yup.object({
  clienteId: Yup.string().required('El cliente es requerido'),
  sucursalId: Yup.string().required('La sucursal es requerida'),
  citaId: Yup.string().nullable().optional(),
  descuentos: Yup.number().min(0).default(0),
  notas: Yup.string().nullable().optional(),
  items: Yup.array(detalleItemSchema).min(1, 'Debe incluir al menos un ítem').required('Los ítems son requeridos')
})

export const crearFacturaDesdeCitaSchema = Yup.object({
  citaId: Yup.string().required('La cita es requerida'),
  sucursalId: Yup.string().required('La sucursal es requerida'),
  descuentos: Yup.number().min(0).default(0),
  notas: Yup.string().nullable().optional(),
  // Permite agregar productos extra además de los servicios de la cita
  itemsExtra: Yup.array(detalleItemSchema).default([])
})
