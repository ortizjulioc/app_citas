import * as yup from 'yup'

export const crearProductoSchema = yup.object({
  nombre: yup.string().required('El nombre es requerido'),
  descripcion: yup.string().optional(),
  precio: yup.number().required('El precio es requerido').min(0, 'El precio no puede ser negativo'),
  costo: yup.number().required('El costo es requerido').min(0, 'El costo no puede ser negativo'),
  stock: yup.number().required('El stock inicial es requerido').min(0, 'El stock no puede ser negativo'),
  sucursalId: yup.string().required('La sucursal es requerida')
})

export const actualizarProductoSchema = yup.object({
  nombre: yup.string().optional(),
  descripcion: yup.string().optional(),
  precio: yup.number().optional().min(0, 'El precio no puede ser negativo'),
  costo: yup.number().optional().min(0, 'El costo no puede ser negativo'),
  sucursalId: yup.string().optional()
})
