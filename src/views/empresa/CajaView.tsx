'use client'

import { useState, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TablePagination from '@mui/material/TablePagination'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Tooltip from '@mui/material/Tooltip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'

import { useAuth } from '@/contexts/AuthContext'
import { useConfirmDialog } from '@/components/shared/confirm-dialog'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Sucursal { id: string; nombre: string }
interface MetodoPago { id: string; nombre: string; descripcion?: string; esEfectivo: boolean }
interface Servicio { id: string; nombre: string }
interface Producto { id: string; nombre: string; precio: number; stock: number }
interface Cliente { id: string; nombre: string; apellido: string; telefono?: string }

interface Factura {
  id: string
  numeroFactura: string
  estado: 'PENDIENTE' | 'PARCIAL' | 'PAGADA' | 'CANCELADA'
  total: number
  montoPagado: number
  createdAt: string
  cliente: Cliente
  sucursal: { nombre: string }
}

interface SesionCaja {
  id: string
  montoApertura: number
  horaApertura: string
  horaCierre?: string | null
  montoEsperado?: number | null
  montoRealContado?: number | null
  diferencia?: number | null
  notasCierre?: string | null
  abiertoPor?: { nombre: string; apellido: string }
  cerradoPor?: { nombre: string; apellido: string }
  caja?: { nombre: string }
  resumen?: {
    montoApertura: number
    ingresoEfectivo: number
    gastos: number
    retiros: number
    montoEsperado: number
    totalCobrado: number
    resumenPorMetodo: Array<{ nombre: string; monto: number; cantidad: number }>
  }
}

interface Caja {
  id: string
  nombre: string
  estado: 'ABIERTA' | 'CERRADA'
  sucursal: Sucursal
  sesionActiva?: SesionCaja | null
}

interface MovimientoCaja {
  id: string
  tipo: 'INGRESO' | 'GASTO' | 'RETIRO'
  monto: number
  descripcion?: string
  createdAt: string
  metodoPago?: { nombre: string }
  pago?: { factura?: { numeroFactura: string } }
}

interface ItemRow {
  tipo: 'SERVICIO' | 'PRODUCTO'
  servicioId: string
  productoId: string
  descripcion: string
  cantidad: number
  precioUnitario: number
  descuento: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(n)
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('es-DO', { dateStyle: 'short', timeStyle: 'short' })

const estadoColor: Record<string, any> = {
  PENDIENTE: 'warning', PARCIAL: 'info', PAGADA: 'success', CANCELADA: 'error'
}
const estadoLabel: Record<string, string> = {
  PENDIENTE: 'Pendiente', PARCIAL: 'Parcial', PAGADA: 'Pagada', CANCELADA: 'Cancelada'
}
const tipoColor: Record<string, string> = { INGRESO: '#4caf50', GASTO: '#f44336', RETIRO: '#ff9800' }
const tipoLabel: Record<string, string> = { INGRESO: 'Ingreso', GASTO: 'Gasto', RETIRO: 'Retiro' }

const emptyItem = (): ItemRow => ({
  tipo: 'SERVICIO', servicioId: '', productoId: '',
  descripcion: '', cantidad: 1, precioUnitario: 0, descuento: 0
})

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CajaView() {
  const { token } = useAuth()
  const { confirm } = useConfirmDialog()

  const [tab, setTab] = useState(0)

  // Catálogos
  const [cajas, setCajas] = useState<Caja[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loadingCajas, setLoadingCajas] = useState(true)

  // Sesión activa seleccionada
  const [sesionSeleccionada, setSesionSeleccionada] = useState<SesionCaja | null>(null)
  const [cajaSeleccionada, setCajaSeleccionada] = useState<Caja | null>(null)

  // Ventas del día (facturas de la sesión)
  const [ventas, setVentas] = useState<Factura[]>([])
  const [loadingVentas, setLoadingVentas] = useState(false)

  // Historial sesiones
  const [sesiones, setSesiones] = useState<SesionCaja[]>([])
  const [loadingSesiones, setLoadingSesiones] = useState(false)
  const [sesionPage, setSesionPage] = useState(0)
  const [sesionTotal, setSesionTotal] = useState(0)

  // Detalle sesión
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [sesionDetalle, setSesionDetalle] = useState<SesionCaja | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([])

  // Crear caja
  const [crearCajaOpen, setCrearCajaOpen] = useState(false)
  const [crearCajaNombre, setCrearCajaNombre] = useState('')
  const [crearCajaSucursal, setCrearCajaSucursal] = useState('')
  const [crearCajaLoading, setCrearCajaLoading] = useState(false)

  // Abrir sesión
  const [abrirOpen, setAbrirOpen] = useState(false)
  const [abrirCaja, setAbrirCaja] = useState<Caja | null>(null)
  const [montoApertura, setMontoApertura] = useState('0')
  const [abrirLoading, setAbrirLoading] = useState(false)

  // Cerrar sesión
  const [cerrarOpen, setCerrarOpen] = useState(false)
  const [cerrarSesion, setCerrarSesion] = useState<SesionCaja | null>(null)
  const [montoContado, setMontoContado] = useState('')
  const [notasCierre, setNotasCierre] = useState('')
  const [cerrarLoading, setCerrarLoading] = useState(false)
  const [arqueoResult, setArqueoResult] = useState<any>(null)

  // Movimiento manual
  const [movOpen, setMovOpen] = useState(false)
  const [movSesion, setMovSesion] = useState<SesionCaja | null>(null)
  const [movTipo, setMovTipo] = useState<'GASTO' | 'RETIRO'>('GASTO')
  const [movMonto, setMovMonto] = useState('')
  const [movDescripcion, setMovDescripcion] = useState('')
  const [movLoading, setMovLoading] = useState(false)

  // Nueva venta (POS)
  const [ventaOpen, setVentaOpen] = useState(false)
  const [ventaLoading, setVentaLoading] = useState(false)
  // Cliente para la venta
  const [clienteBusqueda, setClienteBusqueda] = useState('')
  const [clientesEncontrados, setClientesEncontrados] = useState<Cliente[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [clienteRapidoNombre, setClienteRapidoNombre] = useState('')
  const [clienteRapidoApellido, setClienteRapidoApellido] = useState('')
  const [clienteRapidoTelefono, setClienteRapidoTelefono] = useState('')
  const [modoClienteRapido, setModoClienteRapido] = useState(false)
  const [sucursalVenta, setSucursalVenta] = useState('')
  const [descuentoVenta, setDescuentoVenta] = useState('0')
  const [itemsVenta, setItemsVenta] = useState<ItemRow[]>([emptyItem()])

  // Registrar pago
  const [pagoOpen, setPagoOpen] = useState(false)
  const [pagoFactura, setPagoFactura] = useState<Factura | null>(null)
  const [pagoMetodo, setPagoMetodo] = useState('')
  const [pagoMonto, setPagoMonto] = useState('')
  const [pagoReferencia, setPagoReferencia] = useState('')
  const [pagoLoading, setPagoLoading] = useState(false)

  // Métodos de pago (gestión)
  const [loadingMetodos, setLoadingMetodos] = useState(false)
  const [metodoDialogOpen, setMetodoDialogOpen] = useState(false)
  const [metodoEditando, setMetodoEditando] = useState<MetodoPago | null>(null)
  const [metodoNombre, setMetodoNombre] = useState('')
  const [metodoDescripcion, setMetodoDescripcion] = useState('')
  const [metodoEsEfectivo, setMetodoEsEfectivo] = useState(false)
  const [metodoLoading, setMetodoLoading] = useState(false)

  // Notificaciones
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // ── Carga inicial ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!token) return
    fetchCajas()
    fetchSucursales()
    fetchMetodosPago()
    fetchCatalogos()
  }, [token])

  useEffect(() => {
    if (!token || tab !== 2) return
    fetchSesiones()
  }, [token, tab, sesionPage])

  useEffect(() => {
    if (!token || tab !== 3) return
    fetchMetodosPago()
  }, [token, tab])

  // Cuando hay una sesión seleccionada, cargar sus ventas
  useEffect(() => {
    if (sesionSeleccionada) fetchVentasDeSesion(sesionSeleccionada.id)
  }, [sesionSeleccionada])

  // ── Fetches ───────────────────────────────────────────────────────────────

  const fetchCajas = async () => {
    setLoadingCajas(true)
    try {
      const res = await fetch('/api/caja', { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (res.ok) {
        const lista: Caja[] = json.data?.cajas || []
        setCajas(lista)
        // Auto-seleccionar la primera caja abierta
        const abierta = lista.find(c => c.estado === 'ABIERTA' && c.sesionActiva)
        if (abierta && abierta.sesionActiva) {
          setCajaSeleccionada(abierta)
          setSesionSeleccionada(abierta.sesionActiva)
        }
      }
    } catch { setErrorMsg('Error al cargar cajas') }
    finally { setLoadingCajas(false) }
  }

  const fetchSucursales = async () => {
    try {
      const res = await fetch('/api/sucursales?limit=100', { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (res.ok) setSucursales(json.data?.sucursales || [])
    } catch { }
  }

  const fetchMetodosPago = async () => {
    setLoadingMetodos(true)
    try {
      const res = await fetch('/api/metodos-pago', { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (res.ok) setMetodosPago(json.data?.metodoPagos || [])
    } catch { }
    finally { setLoadingMetodos(false) }
  }

  const fetchCatalogos = async () => {
    try {
      const [svRes, prRes] = await Promise.all([
        fetch('/api/servicios?limit=200', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/productos?limit=200', { headers: { Authorization: `Bearer ${token}` } })
      ])
      const [svJson, prJson] = await Promise.all([svRes.json(), prRes.json()])
      setServicios(svJson.data?.servicios || [])
      setProductos(prJson.data?.productos || [])
    } catch { }
  }

  const fetchVentasDeSesion = async (sesionId: string) => {
    setLoadingVentas(true)
    try {
      // Traer facturas del día de esta sesión — usamos fecha de apertura como filtro
      const res = await fetch(`/api/facturas?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (res.ok) {
        // Filtrar facturas creadas durante esta sesión (desde horaApertura)
        const sesion = sesionSeleccionada
        const desde = sesion?.horaApertura ? new Date(sesion.horaApertura) : null
        const hasta = sesion?.horaCierre ? new Date(sesion.horaCierre) : new Date()
        const facturasSesion = (json.data?.facturas || []).filter((f: Factura) => {
          const fecha = new Date(f.createdAt)
          return desde ? fecha >= desde && fecha <= hasta : true
        })
        setVentas(facturasSesion)
      }
    } catch { }
    finally { setLoadingVentas(false) }
  }

  const fetchSesiones = async () => {
    setLoadingSesiones(true)
    try {
      const params = new URLSearchParams({ page: String(sesionPage + 1), limit: '20' })
      const res = await fetch(`/api/caja/sesiones?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (res.ok) { setSesiones(json.data?.sesiones || []); setSesionTotal(json.data?.pagination?.total || 0) }
    } catch { }
    finally { setLoadingSesiones(false) }
  }

  // ── Búsqueda de clientes ──────────────────────────────────────────────────

  useEffect(() => {
    if (!clienteBusqueda || clienteBusqueda.length < 2) { setClientesEncontrados([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/clientes?search=${encodeURIComponent(clienteBusqueda)}&limit=10`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const json = await res.json()
        if (res.ok) setClientesEncontrados(json.data?.clientes || [])
      } catch { }
    }, 350)
    return () => clearTimeout(t)
  }, [clienteBusqueda])

  // ── Abrir sesión ──────────────────────────────────────────────────────────

  const handleAbrirSesion = async () => {
    if (!abrirCaja) return
    setAbrirLoading(true)
    try {
      const res = await fetch('/api/caja/sesiones/abrir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cajaId: abrirCaja.id, montoApertura: parseFloat(montoApertura) || 0 })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'Error')
      setSuccessMsg(`Caja "${abrirCaja.nombre}" abierta`)
      setAbrirOpen(false)
      setMontoApertura('0')
      await fetchCajas()
    } catch (e: any) { setErrorMsg(e.message) }
    finally { setAbrirLoading(false) }
  }

  // ── Cerrar sesión ─────────────────────────────────────────────────────────

  const handleCerrarSesion = async () => {
    if (!cerrarSesion) return
    setCerrarLoading(true)
    try {
      const res = await fetch(`/api/caja/sesiones/${cerrarSesion.id}/cerrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ montoRealContado: parseFloat(montoContado) || 0, notasCierre: notasCierre || undefined })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'Error')
      setArqueoResult(json.data?.arqueo)
      setSuccessMsg('Sesión cerrada')
      setSesionSeleccionada(null)
      setCajaSeleccionada(null)
      setVentas([])
      await fetchCajas()
      if (tab === 2) fetchSesiones()
    } catch (e: any) { setErrorMsg(e.message) }
    finally { setCerrarLoading(false) }
  }

  // ── Movimiento manual ─────────────────────────────────────────────────────

  const handleMovimientoManual = async () => {
    if (!movSesion || !movMonto || !movDescripcion) { setErrorMsg('Completa todos los campos'); return }
    setMovLoading(true)
    try {
      const res = await fetch(`/api/caja/sesiones/${movSesion.id}/movimientos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tipo: movTipo, monto: parseFloat(movMonto), descripcion: movDescripcion })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'Error')
      setSuccessMsg('Movimiento registrado')
      setMovOpen(false); setMovMonto(''); setMovDescripcion('')
    } catch (e: any) { setErrorMsg(e.message) }
    finally { setMovLoading(false) }
  }

  // ── Nueva venta ────────────────────────────────────────────────────────────

  const resetVentaForm = () => {
    setClienteBusqueda(''); setClientesEncontrados([]); setClienteSeleccionado(null)
    setClienteRapidoNombre(''); setClienteRapidoApellido(''); setClienteRapidoTelefono('')
    setModoClienteRapido(false); setSucursalVenta(''); setDescuentoVenta('0')
    setItemsVenta([emptyItem()])
  }

  const updateItemVenta = (idx: number, field: keyof ItemRow, value: any) => {
    setItemsVenta(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      if (field === 'tipo') { next[idx].servicioId = ''; next[idx].productoId = ''; next[idx].precioUnitario = 0; next[idx].descripcion = '' }
      if (field === 'servicioId') { const s = servicios.find(x => x.id === value); if (s) next[idx].descripcion = s.nombre }
      if (field === 'productoId') { const p = productos.find(x => x.id === value); if (p) { next[idx].precioUnitario = p.precio; next[idx].descripcion = p.nombre } }
      return next
    })
  }

  const calcVentaTotales = () => {
    const subtotal = itemsVenta.reduce((acc, it) => acc + it.precioUnitario * it.cantidad - it.descuento, 0)
    const descGlobal = parseFloat(descuentoVenta) || 0
    return { subtotal, base: Math.max(0, subtotal - descGlobal) }
  }

  const handleCrearVenta = async () => {
    if (!sesionSeleccionada) { setErrorMsg('No hay sesión de caja abierta'); return }

    // Validar cliente
    let clienteId: string | null = null
    if (modoClienteRapido) {
      if (!clienteRapidoNombre || !clienteRapidoApellido) { setErrorMsg('Ingresa nombre y apellido del cliente'); return }
    } else {
      if (!clienteSeleccionado) { setErrorMsg('Selecciona un cliente'); return }
      clienteId = clienteSeleccionado.id
    }

    if (!sucursalVenta) { setErrorMsg('Selecciona la sucursal'); return }

    const validItems = itemsVenta.filter(it =>
      (it.tipo === 'SERVICIO' && it.servicioId) || (it.tipo === 'PRODUCTO' && it.productoId)
    )
    if (validItems.length === 0) { setErrorMsg('Agrega al menos un ítem'); return }

    setVentaLoading(true)
    setErrorMsg(null)
    try {
      // Si cliente rápido, crearlo primero
      if (modoClienteRapido) {
        const cRes = await fetch('/api/clientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ nombre: clienteRapidoNombre, apellido: clienteRapidoApellido, telefono: clienteRapidoTelefono || undefined })
        })
        const cJson = await cRes.json()
        if (!cRes.ok) throw new Error(cJson.error?.message || 'Error al crear cliente')
        clienteId = cJson.data?.id || cJson.data?.cliente?.id
      }

      const payload = {
        clienteId,
        sucursalId: sucursalVenta,
        descuentos: parseFloat(descuentoVenta) || 0,
        items: validItems.map(it => ({
          tipo: it.tipo,
          servicioId: it.tipo === 'SERVICIO' ? it.servicioId : undefined,
          productoId: it.tipo === 'PRODUCTO' ? it.productoId : undefined,
          descripcion: it.descripcion || undefined,
          cantidad: it.cantidad,
          precioUnitario: it.precioUnitario,
          descuento: it.descuento
        }))
      }

      const res = await fetch('/api/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'Error')

      setSuccessMsg(`Factura ${json.data.numeroFactura} creada`)
      setVentaOpen(false)
      resetVentaForm()
      fetchVentasDeSesion(sesionSeleccionada.id)

      // Abrir pago inmediatamente
      const nuevaFactura = { ...json.data, cliente: { nombre: clienteRapidoNombre || clienteSeleccionado?.nombre, apellido: clienteRapidoApellido || clienteSeleccionado?.apellido } }
      setPagoFactura(nuevaFactura)
      setPagoMonto(json.data.total.toFixed(2))
      setPagoMetodo(metodosPago[0]?.id || '')
      setPagoReferencia('')
      setPagoOpen(true)
    } catch (e: any) { setErrorMsg(e.message) }
    finally { setVentaLoading(false) }
  }

  // ── Registrar pago ────────────────────────────────────────────────────────

  const openPago = (f: Factura) => {
    setPagoFactura(f)
    setPagoMonto((f.total - f.montoPagado).toFixed(2))
    setPagoMetodo(metodosPago[0]?.id || '')
    setPagoReferencia('')
    setPagoOpen(true)
  }

  const handleRegistrarPago = async () => {
    if (!pagoMetodo || !pagoMonto) { setErrorMsg('Completa los campos'); return }
    setPagoLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          facturaId: pagoFactura!.id,
          metodoPagoId: pagoMetodo,
          sesionCajaId: sesionSeleccionada?.id || undefined,
          monto: parseFloat(pagoMonto),
          referencia: pagoReferencia || undefined
        })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'Error')
      setSuccessMsg('Pago registrado')
      setPagoOpen(false)
      if (sesionSeleccionada) fetchVentasDeSesion(sesionSeleccionada.id)
    } catch (e: any) { setErrorMsg(e.message) }
    finally { setPagoLoading(false) }
  }

  // ── Gestión métodos de pago ───────────────────────────────────────────────

  const openCrearMetodo = () => { setMetodoEditando(null); setMetodoNombre(''); setMetodoDescripcion(''); setMetodoEsEfectivo(false); setMetodoDialogOpen(true) }
  const openEditarMetodo = (m: MetodoPago) => { setMetodoEditando(m); setMetodoNombre(m.nombre); setMetodoDescripcion(m.descripcion || ''); setMetodoEsEfectivo(m.esEfectivo); setMetodoDialogOpen(true) }

  const handleGuardarMetodo = async () => {
    if (!metodoNombre.trim()) { setErrorMsg('El nombre es requerido'); return }
    setMetodoLoading(true)
    try {
      const url = metodoEditando ? `/api/metodos-pago/${metodoEditando.id}` : '/api/metodos-pago'
      const res = await fetch(url, {
        method: metodoEditando ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: metodoNombre.trim(), descripcion: metodoDescripcion || undefined, esEfectivo: metodoEsEfectivo })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'Error')
      setSuccessMsg(metodoEditando ? 'Método actualizado' : 'Método creado')
      setMetodoDialogOpen(false)
      fetchMetodosPago()
    } catch (e: any) { setErrorMsg(e.message) }
    finally { setMetodoLoading(false) }
  }

  const handleEliminarMetodo = async (m: MetodoPago) => {
    const ok = await confirm({ title: 'Eliminar Método', message: `¿Eliminar "<b>${m.nombre}</b>"?`, confirmText: 'Eliminar' })
    if (!ok) return
    try {
      const res = await fetch(`/api/metodos-pago/${m.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error?.message || 'Error') }
      setSuccessMsg('Método eliminado')
      fetchMetodosPago()
    } catch (e: any) { setErrorMsg(e.message) }
  }

  // ── Detalle sesión ────────────────────────────────────────────────────────

  const openDetalle = async (sesion: SesionCaja) => {
    setDetalleOpen(true); setSesionDetalle(null); setMovimientos([]); setLoadingDetalle(true)
    try {
      const [dRes, mRes] = await Promise.all([
        fetch(`/api/caja/sesiones/${sesion.id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/caja/sesiones/${sesion.id}/movimientos`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      const [dJson, mJson] = await Promise.all([dRes.json(), mRes.json()])
      if (dRes.ok) setSesionDetalle(dJson.data)
      if (mRes.ok) setMovimientos(mJson.data?.movimientos || [])
    } catch { setErrorMsg('Error al cargar detalle') }
    finally { setLoadingDetalle(false) }
  }

  const { subtotal: ventaSubtotal, base: ventaBase } = calcVentaTotales()

  if (!token) return <Box display='flex' justifyContent='center' pt={8}><CircularProgress /></Box>

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Box className='w-full' display='flex' flexDirection='column' gap={2}>

      {/* ── PANEL SUPERIOR: selección de caja ─────────────────────────────── */}
      {loadingCajas ? (
        <Box display='flex' justifyContent='center' py={4}><CircularProgress /></Box>
      ) : cajas.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign='center' py={4}>
              <i className='tabler-cash-register' style={{ fontSize: 52, color: '#bdbdbd' }} />
              <Typography color='text.secondary' mt={2} mb={2}>No hay cajas configuradas</Typography>
              <Button variant='contained' onClick={() => setCrearCajaOpen(true)} startIcon={<i className='tabler-plus' />}>
                Crear primera caja
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {cajas.map(caja => (
            <Grid item xs={12} sm={6} md={4} key={caja.id}>
              <Paper
                variant='outlined'
                sx={{
                  p: 2, borderRadius: 2, cursor: 'pointer',
                  borderColor: cajaSeleccionada?.id === caja.id ? 'primary.main' : caja.estado === 'ABIERTA' ? 'success.main' : undefined,
                  borderWidth: cajaSeleccionada?.id === caja.id ? 2 : 1,
                  bgcolor: cajaSeleccionada?.id === caja.id ? 'primary.lighter' : undefined
                }}
                onClick={() => {
                  if (caja.sesionActiva) { setCajaSeleccionada(caja); setSesionSeleccionada(caja.sesionActiva) }
                }}
              >
                <Box display='flex' justifyContent='space-between' alignItems='flex-start'>
                  <Box>
                    <Typography variant='subtitle1' fontWeight={700}>{caja.nombre}</Typography>
                    <Typography variant='caption' color='text.secondary'>{caja.sucursal.nombre}</Typography>
                  </Box>
                  <Chip label={caja.estado === 'ABIERTA' ? 'Abierta' : 'Cerrada'} color={caja.estado === 'ABIERTA' ? 'success' : 'default'} size='small' />
                </Box>
                {caja.sesionActiva && (
                  <Typography variant='caption' color='text.secondary' display='block' mt={1}>
                    Desde {fmtDate(caja.sesionActiva.horaApertura)}
                  </Typography>
                )}
                <Box mt={1.5}>
                  {caja.estado === 'CERRADA' ? (
                    <Button size='small' variant='contained' color='success' fullWidth
                      onClick={e => { e.stopPropagation(); setAbrirCaja(caja); setMontoApertura('0'); setAbrirOpen(true) }}>
                      Abrir Caja
                    </Button>
                  ) : (
                    <Stack direction='row' spacing={1}>
                      <Button size='small' variant='outlined' color='error' onClick={e => { e.stopPropagation(); setCerrarSesion(caja.sesionActiva!); setMontoContado(''); setNotasCierre(''); setArqueoResult(null); setCerrarOpen(true) }}>
                        Cerrar
                      </Button>
                      <Button size='small' variant='outlined' onClick={e => { e.stopPropagation(); setMovSesion(caja.sesionActiva!); setMovTipo('GASTO'); setMovMonto(''); setMovDescripcion(''); setMovOpen(true) }}>
                        Movimiento
                      </Button>
                    </Stack>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
          <Grid item xs={12} sm={6} md={4}>
            <Paper variant='outlined' sx={{ p: 2, borderRadius: 2, border: '1px dashed', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120, cursor: 'pointer' }}
              onClick={() => setCrearCajaOpen(true)}>
              <Box textAlign='center'>
                <i className='tabler-plus' style={{ fontSize: 28, color: '#9e9e9e' }} />
                <Typography variant='caption' color='text.secondary' display='block'>Nueva Caja</Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ── PANEL PRINCIPAL: sesión activa ────────────────────────────────── */}
      <Card>
        <Box borderBottom={1} borderColor='divider' px={2}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label='Ventas del Día' icon={<i className='tabler-shopping-cart' />} iconPosition='start' />
            <Tab label='Movimientos' icon={<i className='tabler-arrows-exchange' />} iconPosition='start' disabled={!sesionSeleccionada} />
            <Tab label='Historial' icon={<i className='tabler-history' />} iconPosition='start' />
            <Tab label='Métodos de Pago' icon={<i className='tabler-credit-card' />} iconPosition='start' />
          </Tabs>
        </Box>

        <CardContent>
          {/* ── TAB 0: Ventas del día ─── */}
          {tab === 0 && (
            <Box>
              {!sesionSeleccionada ? (
                <Box py={6} textAlign='center'>
                  <i className='tabler-lock' style={{ fontSize: 48, color: '#bdbdbd' }} />
                  <Typography color='text.secondary' mt={2}>Abre una caja para comenzar a registrar ventas</Typography>
                </Box>
              ) : (
                <>
                  {/* Resumen rápido de la sesión */}
                  <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2, mb: 2 }}>
                    <Grid container spacing={2} alignItems='center'>
                      <Grid item xs={12} sm='auto'>
                        <Typography variant='subtitle2' color='text.secondary'>Sesión activa</Typography>
                        <Typography variant='body1' fontWeight={700}>{cajaSeleccionada?.nombre}</Typography>
                        <Typography variant='caption' color='text.secondary'>Desde {fmtDate(sesionSeleccionada.horaApertura)}</Typography>
                      </Grid>
                      <Grid item xs={6} sm='auto'>
                        <Typography variant='caption' color='text.secondary'>Apertura</Typography>
                        <Typography variant='body2' fontWeight={600}>{fmt(sesionSeleccionada.montoApertura)}</Typography>
                      </Grid>
                      <Grid item xs={6} sm='auto'>
                        <Typography variant='caption' color='text.secondary'>Ventas registradas</Typography>
                        <Typography variant='body2' fontWeight={600}>{ventas.length}</Typography>
                      </Grid>
                      <Grid item xs={12} sm='auto' sx={{ ml: 'auto' }}>
                        <Button variant='contained' color='primary' size='large'
                          startIcon={<i className='tabler-plus' />}
                          onClick={() => { resetVentaForm(); setSucursalVenta(cajaSeleccionada?.sucursal?.id || ''); setVentaOpen(true) }}>
                          Nueva Venta
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>

                  {loadingVentas ? (
                    <Box display='flex' justifyContent='center' py={4}><CircularProgress /></Box>
                  ) : ventas.length === 0 ? (
                    <Box py={4} textAlign='center'>
                      <i className='tabler-receipt-off' style={{ fontSize: 40, color: '#bdbdbd' }} />
                      <Typography color='text.secondary' mt={1}>Sin ventas en esta sesión</Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>N° Factura</TableCell>
                            <TableCell>Cliente</TableCell>
                            <TableCell align='right'>Total</TableCell>
                            <TableCell align='right'>Pagado</TableCell>
                            <TableCell align='right'>Saldo</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Hora</TableCell>
                            <TableCell align='center'>Acción</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {ventas.map(f => {
                            const saldo = Math.max(0, f.total - f.montoPagado)
                            return (
                              <TableRow key={f.id} hover>
                                <TableCell><Typography variant='body2' fontWeight={600} color='primary'>{f.numeroFactura}</Typography></TableCell>
                                <TableCell>{f.cliente.nombre} {f.cliente.apellido}</TableCell>
                                <TableCell align='right'>{fmt(f.total)}</TableCell>
                                <TableCell align='right'>{fmt(f.montoPagado)}</TableCell>
                                <TableCell align='right'>
                                  <Typography variant='body2' color={saldo > 0 ? 'error' : 'success.main'} fontWeight={600}>{fmt(saldo)}</Typography>
                                </TableCell>
                                <TableCell><Chip label={estadoLabel[f.estado]} color={estadoColor[f.estado]} size='small' /></TableCell>
                                <TableCell>{fmtDate(f.createdAt)}</TableCell>
                                <TableCell align='center'>
                                  {(f.estado === 'PENDIENTE' || f.estado === 'PARCIAL') && (
                                    <Tooltip title='Cobrar'>
                                      <Button size='small' variant='contained' color='success' onClick={() => openPago(f)}>
                                        Cobrar
                                      </Button>
                                    </Tooltip>
                                  )}
                                  {f.estado === 'PAGADA' && (
                                    <Chip label='✓ Cobrada' color='success' size='small' variant='outlined' />
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </>
              )}
            </Box>
          )}

          {/* ── TAB 1: Movimientos manuales ─── */}
          {tab === 1 && sesionSeleccionada && (
            <Box>
              <Box display='flex' justifyContent='flex-end' mb={2}>
                <Button variant='outlined' startIcon={<i className='tabler-plus' />}
                  onClick={() => { setMovSesion(sesionSeleccionada); setMovTipo('GASTO'); setMovMonto(''); setMovDescripcion(''); setMovOpen(true) }}>
                  Registrar Movimiento
                </Button>
              </Box>
              <Button variant='text' size='small' onClick={() => openDetalle(sesionSeleccionada)} startIcon={<i className='tabler-eye' />}>
                Ver detalle completo de la sesión
              </Button>
            </Box>
          )}

          {/* ── TAB 2: Historial ─── */}
          {tab === 2 && (
            loadingSesiones ? <Box display='flex' justifyContent='center' py={4}><CircularProgress /></Box> :
            sesiones.length === 0 ? (
              <Box py={4} textAlign='center'>
                <i className='tabler-history-off' style={{ fontSize: 40, color: '#bdbdbd' }} />
                <Typography color='text.secondary' mt={1}>Sin sesiones registradas</Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Caja</TableCell>
                        <TableCell>Apertura</TableCell>
                        <TableCell>Cierre</TableCell>
                        <TableCell align='right'>Apertura $</TableCell>
                        <TableCell align='right'>Esperado</TableCell>
                        <TableCell align='right'>Contado</TableCell>
                        <TableCell align='right'>Diferencia</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sesiones.map(s => (
                        <TableRow key={s.id} hover>
                          <TableCell>{s.caja?.nombre || '-'}</TableCell>
                          <TableCell>{fmtDate(s.horaApertura)}</TableCell>
                          <TableCell>{s.horaCierre ? fmtDate(s.horaCierre) : '-'}</TableCell>
                          <TableCell align='right'>{fmt(s.montoApertura)}</TableCell>
                          <TableCell align='right'>{s.montoEsperado != null ? fmt(s.montoEsperado) : '-'}</TableCell>
                          <TableCell align='right'>{s.montoRealContado != null ? fmt(s.montoRealContado) : '-'}</TableCell>
                          <TableCell align='right'>
                            {s.diferencia != null ? (
                              <Typography variant='body2' color={s.diferencia >= 0 ? 'success.main' : 'error'} fontWeight={600}>
                                {s.diferencia >= 0 ? '+' : ''}{fmt(s.diferencia)}
                              </Typography>
                            ) : '-'}
                          </TableCell>
                          <TableCell><Chip label={s.horaCierre ? 'Cerrada' : 'Abierta'} color={s.horaCierre ? 'default' : 'success'} size='small' /></TableCell>
                          <TableCell>
                            <IconButton size='small' onClick={() => openDetalle(s)}><i className='tabler-eye' /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination component='div' count={sesionTotal} page={sesionPage}
                  onPageChange={(_, p) => setSesionPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} labelRowsPerPage='Filas' />
              </>
            )
          )}

          {/* ── TAB 3: Métodos de pago ─── */}
          {tab === 3 && (
            <Box>
              <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
                <Typography variant='body2' color='text.secondary'>
                  Marca como <b>Efectivo</b> los que muevan dinero físico en la caja.
                </Typography>
                <Button variant='contained' size='small' startIcon={<i className='tabler-plus' />} onClick={openCrearMetodo}>Nuevo Método</Button>
              </Box>
              {loadingMetodos ? <CircularProgress size={24} /> :
              metodosPago.length === 0 ? (
                <Box py={4} textAlign='center'>
                  <i className='tabler-credit-card-off' style={{ fontSize: 40, color: '#bdbdbd' }} />
                  <Typography color='text.secondary' mt={1} mb={2}>No hay métodos configurados</Typography>
                  <Button variant='outlined' onClick={openCrearMetodo}>Crear primer método</Button>
                </Box>
              ) : (
                <TableContainer component={Paper} variant='outlined'>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nombre</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell align='center'>Genera movimiento en caja</TableCell>
                        <TableCell align='center'>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {metodosPago.map(m => (
                        <TableRow key={m.id} hover>
                          <TableCell><Typography variant='body2' fontWeight={600}>{m.nombre}</Typography></TableCell>
                          <TableCell><Typography variant='body2' color='text.secondary'>{m.descripcion || '-'}</Typography></TableCell>
                          <TableCell align='center'>
                            {m.esEfectivo
                              ? <Chip label='Sí — Efectivo' color='success' size='small' />
                              : <Chip label='No' variant='outlined' size='small' />}
                          </TableCell>
                          <TableCell align='center'>
                            <Stack direction='row' spacing={0.5} justifyContent='center'>
                              <IconButton size='small' color='primary' onClick={() => openEditarMetodo(m)}><i className='tabler-edit' /></IconButton>
                              <IconButton size='small' color='error' onClick={() => handleEliminarMetodo(m)}><i className='tabler-trash' /></IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ══════════════════════ DIALOGS ══════════════════════════════════════ */}

      {/* Crear caja */}
      <Dialog open={crearCajaOpen} onClose={() => setCrearCajaOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Nueva Caja <IconButton onClick={() => setCrearCajaOpen(false)} size='small'><i className='tabler-x' /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box display='flex' flexDirection='column' gap={2}>
            <TextField label='Nombre' fullWidth value={crearCajaNombre} onChange={e => setCrearCajaNombre(e.target.value)} placeholder='Ej: Caja Principal' />
            <FormControl fullWidth>
              <InputLabel>Sucursal</InputLabel>
              <Select value={crearCajaSucursal} label='Sucursal' onChange={e => setCrearCajaSucursal(e.target.value)}>
                {sucursales.map(s => <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCrearCajaOpen(false)}>Cancelar</Button>
          <Button variant='contained' disabled={crearCajaLoading} onClick={async () => {
            if (!crearCajaNombre || !crearCajaSucursal) { setErrorMsg('Completa los campos'); return }
            setCrearCajaLoading(true)
            try {
              const res = await fetch('/api/caja', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ nombre: crearCajaNombre, sucursalId: crearCajaSucursal }) })
              const json = await res.json()
              if (!res.ok) throw new Error(json.error?.message || 'Error')
              setSuccessMsg('Caja creada'); setCrearCajaOpen(false); setCrearCajaNombre(''); fetchCajas()
            } catch (e: any) { setErrorMsg(e.message) }
            finally { setCrearCajaLoading(false) }
          }}>
            {crearCajaLoading ? 'Creando...' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Abrir sesión */}
      <Dialog open={abrirOpen} onClose={() => setAbrirOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Abrir Caja: {abrirCaja?.nombre} <IconButton onClick={() => setAbrirOpen(false)} size='small'><i className='tabler-x' /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box display='flex' flexDirection='column' gap={2}>
            <Typography variant='body2' color='text.secondary'>Ingresa el efectivo con que inicias el turno (fondo de caja).</Typography>
            <TextField label='Monto de apertura' type='number' fullWidth value={montoApertura}
              onChange={e => setMontoApertura(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position='start'>$</InputAdornment> }} inputProps={{ min: 0 }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setAbrirOpen(false)}>Cancelar</Button>
          <Button variant='contained' color='success' onClick={handleAbrirSesion} disabled={abrirLoading}>
            {abrirLoading ? 'Abriendo...' : 'Abrir Caja'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cerrar sesión + arqueo */}
      <Dialog open={cerrarOpen} onClose={() => { if (!arqueoResult) setCerrarOpen(false) }} maxWidth='sm' fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {arqueoResult ? 'Resultado del Arqueo' : 'Cerrar Caja'}
          <IconButton onClick={() => setCerrarOpen(false)} size='small'><i className='tabler-x' /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {arqueoResult ? (
            <Box display='flex' flexDirection='column' gap={1.5}>
              <Box sx={{ bgcolor: arqueoResult.diferencia === 0 ? 'success.lighter' : arqueoResult.diferencia > 0 ? 'info.lighter' : 'error.lighter', borderRadius: 1, p: 2, textAlign: 'center' }}>
                <Typography variant='h6' color={arqueoResult.diferencia === 0 ? 'success.main' : arqueoResult.diferencia > 0 ? 'info.main' : 'error.main'}>
                  {arqueoResult.estado === 'CUADRADO' ? '✓ Caja cuadrada' : arqueoResult.diferencia > 0 ? '↑ Sobrante' : '↓ Faltante'}
                </Typography>
                {arqueoResult.diferencia !== 0 && (
                  <Typography variant='h5' fontWeight={700} color={arqueoResult.diferencia > 0 ? 'info.main' : 'error.main'}>
                    {arqueoResult.diferencia > 0 ? '+' : ''}{fmt(arqueoResult.diferencia)}
                  </Typography>
                )}
              </Box>
              <Divider />
              {[
                { label: 'Monto apertura', val: arqueoResult.montoApertura },
                { label: 'Ingresos efectivo', val: arqueoResult.ingresoEfectivo },
                { label: 'Gastos', val: -arqueoResult.gastos },
                { label: 'Retiros', val: -arqueoResult.retiros },
                { label: 'Esperado en caja', val: arqueoResult.montoEsperado, bold: true },
                { label: 'Contado físicamente', val: arqueoResult.montoRealContado, bold: true },
              ].map(row => (
                <Box key={row.label} display='flex' justifyContent='space-between'>
                  <Typography variant='body2' color='text.secondary'>{row.label}</Typography>
                  <Typography variant='body2' fontWeight={row.bold ? 700 : 400} color={row.val < 0 ? 'error' : undefined}>
                    {row.val < 0 ? `-${fmt(Math.abs(row.val))}` : fmt(row.val)}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Box display='flex' flexDirection='column' gap={2}>
              <Typography variant='body2' color='text.secondary'>Cuenta el efectivo físico e ingresa el monto real.</Typography>
              <TextField label='Monto contado' type='number' fullWidth value={montoContado}
                onChange={e => setMontoContado(e.target.value)} autoFocus
                InputProps={{ startAdornment: <InputAdornment position='start'>$</InputAdornment> }} />
              <TextField label='Notas (opcional)' fullWidth multiline rows={2} value={notasCierre} onChange={e => setNotasCierre(e.target.value)} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCerrarOpen(false)}>{arqueoResult ? 'Cerrar' : 'Cancelar'}</Button>
          {!arqueoResult && (
            <Button variant='contained' color='error' onClick={handleCerrarSesion} disabled={cerrarLoading || !montoContado}>
              {cerrarLoading ? 'Cerrando...' : 'Confirmar Cierre'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Movimiento manual */}
      <Dialog open={movOpen} onClose={() => setMovOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Movimiento Manual <IconButton onClick={() => setMovOpen(false)} size='small'><i className='tabler-x' /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box display='flex' flexDirection='column' gap={2}>
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select value={movTipo} label='Tipo' onChange={e => setMovTipo(e.target.value as any)}>
                <MenuItem value='GASTO'>Gasto (egreso operativo)</MenuItem>
                <MenuItem value='RETIRO'>Retiro (sacar efectivo)</MenuItem>
              </Select>
            </FormControl>
            <TextField label='Monto' type='number' fullWidth value={movMonto} onChange={e => setMovMonto(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position='start'>$</InputAdornment> }} />
            <TextField label='Descripción' fullWidth value={movDescripcion} onChange={e => setMovDescripcion(e.target.value)} placeholder='Ej: Compra de materiales...' />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setMovOpen(false)}>Cancelar</Button>
          <Button variant='contained' onClick={handleMovimientoManual} disabled={movLoading}>
            {movLoading ? 'Guardando...' : 'Registrar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Nueva Venta (POS) */}
      <Dialog open={ventaOpen} onClose={() => setVentaOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Nueva Venta <IconButton onClick={() => setVentaOpen(false)} size='small'><i className='tabler-x' /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box display='flex' flexDirection='column' gap={2.5}>
            {/* Cliente */}
            <Box>
              <Box display='flex' justifyContent='space-between' alignItems='center' mb={1}>
                <Typography variant='subtitle2'>Cliente</Typography>
                <FormControlLabel
                  control={<Switch size='small' checked={modoClienteRapido} onChange={e => { setModoClienteRapido(e.target.checked); setClienteSeleccionado(null); setClienteBusqueda('') }} />}
                  label={<Typography variant='caption'>Cliente rápido (nuevo)</Typography>}
                />
              </Box>
              {modoClienteRapido ? (
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={4}>
                    <TextField label='Nombre *' fullWidth size='small' value={clienteRapidoNombre} onChange={e => setClienteRapidoNombre(e.target.value)} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField label='Apellido *' fullWidth size='small' value={clienteRapidoApellido} onChange={e => setClienteRapidoApellido(e.target.value)} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField label='Teléfono' fullWidth size='small' value={clienteRapidoTelefono} onChange={e => setClienteRapidoTelefono(e.target.value)} />
                  </Grid>
                </Grid>
              ) : (
                <Box position='relative'>
                  <TextField
                    label='Buscar cliente por nombre o teléfono'
                    fullWidth size='small'
                    value={clienteBusqueda}
                    onChange={e => { setClienteBusqueda(e.target.value); setClienteSeleccionado(null) }}
                    InputProps={{ startAdornment: <InputAdornment position='start'><i className='tabler-search' /></InputAdornment> }}
                  />
                  {clienteSeleccionado && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'success.lighter', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant='body2' fontWeight={600}>✓ {clienteSeleccionado.nombre} {clienteSeleccionado.apellido} {clienteSeleccionado.telefono && `· ${clienteSeleccionado.telefono}`}</Typography>
                      <IconButton size='small' onClick={() => { setClienteSeleccionado(null); setClienteBusqueda('') }}><i className='tabler-x' /></IconButton>
                    </Box>
                  )}
                  {clientesEncontrados.length > 0 && !clienteSeleccionado && (
                    <Paper variant='outlined' sx={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, maxHeight: 200, overflow: 'auto' }}>
                      {clientesEncontrados.map(c => (
                        <Box key={c.id} sx={{ p: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                          onClick={() => { setClienteSeleccionado(c); setClienteBusqueda(''); setClientesEncontrados([]) }}>
                          <Typography variant='body2' fontWeight={600}>{c.nombre} {c.apellido}</Typography>
                          {c.telefono && <Typography variant='caption' color='text.secondary'>{c.telefono}</Typography>}
                        </Box>
                      ))}
                    </Paper>
                  )}
                </Box>
              )}
            </Box>

            <FormControl fullWidth size='small' required>
              <InputLabel>Sucursal</InputLabel>
              <Select value={sucursalVenta} label='Sucursal' onChange={e => setSucursalVenta(e.target.value)}>
                {sucursales.map(s => <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>)}
              </Select>
            </FormControl>

            <Divider><Typography variant='caption'>Ítems</Typography></Divider>

            {itemsVenta.map((item, idx) => (
              <Paper key={idx} variant='outlined' sx={{ p: 1.5 }}>
                <Grid container spacing={1} alignItems='center'>
                  <Grid item xs={2}>
                    <FormControl fullWidth size='small'>
                      <InputLabel>Tipo</InputLabel>
                      <Select value={item.tipo} label='Tipo' onChange={e => updateItemVenta(idx, 'tipo', e.target.value)}>
                        <MenuItem value='SERVICIO'>Servicio</MenuItem>
                        <MenuItem value='PRODUCTO'>Producto</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={4}>
                    {item.tipo === 'SERVICIO' ? (
                      <FormControl fullWidth size='small'>
                        <InputLabel>Servicio</InputLabel>
                        <Select value={item.servicioId} label='Servicio' onChange={e => updateItemVenta(idx, 'servicioId', e.target.value)}>
                          {servicios.map(s => <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>)}
                        </Select>
                      </FormControl>
                    ) : (
                      <FormControl fullWidth size='small'>
                        <InputLabel>Producto</InputLabel>
                        <Select value={item.productoId} label='Producto' onChange={e => updateItemVenta(idx, 'productoId', e.target.value)}>
                          {productos.map(p => <MenuItem key={p.id} value={p.id}>{p.nombre} ({p.stock})</MenuItem>)}
                        </Select>
                      </FormControl>
                    )}
                  </Grid>
                  <Grid item xs={2}>
                    <TextField size='small' label='Precio' type='number' fullWidth value={item.precioUnitario}
                      onChange={e => updateItemVenta(idx, 'precioUnitario', parseFloat(e.target.value) || 0)}
                      InputProps={{ startAdornment: <InputAdornment position='start'>$</InputAdornment> }} />
                  </Grid>
                  <Grid item xs={1}>
                    <TextField size='small' label='Cant.' type='number' fullWidth value={item.cantidad}
                      onChange={e => updateItemVenta(idx, 'cantidad', parseInt(e.target.value) || 1)} inputProps={{ min: 1 }} />
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant='body2' fontWeight={600} textAlign='center'>
                      {fmt(item.precioUnitario * item.cantidad)}
                    </Typography>
                  </Grid>
                  <Grid item xs={1} display='flex' justifyContent='center'>
                    {itemsVenta.length > 1 && (
                      <IconButton size='small' color='error' onClick={() => setItemsVenta(p => p.filter((_, i) => i !== idx))}>
                        <i className='tabler-trash' />
                      </IconButton>
                    )}
                  </Grid>
                </Grid>
              </Paper>
            ))}

            <Button size='small' variant='outlined' startIcon={<i className='tabler-plus' />} sx={{ alignSelf: 'flex-start' }}
              onClick={() => setItemsVenta(p => [...p, emptyItem()])}>
              Agregar ítem
            </Button>

            <Box display='flex' justifyContent='space-between' alignItems='flex-end'>
              <TextField size='small' label='Descuento global' type='number' sx={{ width: 180 }}
                value={descuentoVenta} onChange={e => setDescuentoVenta(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position='start'>$</InputAdornment> }} />
              <Box textAlign='right'>
                <Typography variant='caption' color='text.secondary'>Subtotal: {fmt(ventaSubtotal)}</Typography>
                <Typography variant='h6' fontWeight={700} color='primary'>Total: {fmt(ventaBase)}</Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setVentaOpen(false)}>Cancelar</Button>
          <Button variant='contained' onClick={handleCrearVenta} disabled={ventaLoading}>
            {ventaLoading ? 'Creando...' : 'Crear y Cobrar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Registrar pago */}
      <Dialog open={pagoOpen} onClose={() => setPagoOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Cobrar <IconButton onClick={() => setPagoOpen(false)} size='small'><i className='tabler-x' /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box display='flex' flexDirection='column' gap={2}>
            {pagoFactura && (
              <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 1.5 }}>
                <Typography variant='caption' color='text.secondary'>Factura {pagoFactura.numeroFactura}</Typography>
                <Typography variant='body1' fontWeight={700}>{pagoFactura.cliente?.nombre} {pagoFactura.cliente?.apellido}</Typography>
                <Typography variant='caption'>Total: {fmt(pagoFactura.total)} · Saldo: {fmt(pagoFactura.total - pagoFactura.montoPagado)}</Typography>
              </Box>
            )}
            <FormControl fullWidth required>
              <InputLabel>Método de pago</InputLabel>
              <Select value={pagoMetodo} label='Método de pago' onChange={e => setPagoMetodo(e.target.value)}>
                {metodosPago.map(m => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.nombre} {m.esEfectivo && <Chip label='Efectivo' size='small' sx={{ ml: 1 }} />}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label='Monto' type='number' fullWidth required value={pagoMonto} onChange={e => setPagoMonto(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position='start'>$</InputAdornment> }} />
            <TextField label='Referencia (opcional)' fullWidth value={pagoReferencia} onChange={e => setPagoReferencia(e.target.value)} placeholder='N° transacción, cheque...' />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setPagoOpen(false)}>Cancelar</Button>
          <Button variant='contained' color='success' onClick={handleRegistrarPago} disabled={pagoLoading}>
            {pagoLoading ? 'Procesando...' : 'Confirmar Pago'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detalle sesión */}
      <Dialog open={detalleOpen} onClose={() => setDetalleOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Detalle de Sesión — {sesionDetalle?.caja?.nombre}
          <IconButton onClick={() => setDetalleOpen(false)} size='small'><i className='tabler-x' /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {loadingDetalle ? <Box display='flex' justifyContent='center' py={4}><CircularProgress /></Box> :
          sesionDetalle && (
            <Box display='flex' flexDirection='column' gap={2}>
              {sesionDetalle.resumen && (
                <>
                  <Grid container spacing={1.5}>
                    {[
                      { label: 'Apertura', val: sesionDetalle.resumen.montoApertura },
                      { label: 'Ing. efectivo', val: sesionDetalle.resumen.ingresoEfectivo, color: 'success.main' },
                      { label: 'Gastos', val: sesionDetalle.resumen.gastos, color: 'error.main' },
                      { label: 'Retiros', val: sesionDetalle.resumen.retiros, color: 'warning.main' },
                      { label: 'Total cobrado', val: sesionDetalle.resumen.totalCobrado, color: 'primary.main' },
                    ].map(r => (
                      <Grid item xs={6} sm={2.4} key={r.label}>
                        <Paper variant='outlined' sx={{ p: 1.5, textAlign: 'center', borderRadius: 1.5 }}>
                          <Typography variant='caption' color='text.secondary' display='block'>{r.label}</Typography>
                          <Typography variant='subtitle2' color={(r as any).color || 'text.primary'} fontWeight={700}>{fmt(r.val)}</Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                  {sesionDetalle.montoRealContado != null && (
                    <Box display='flex' justifyContent='space-between' p={2} sx={{ bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Box><Typography variant='caption' color='text.secondary'>Esperado</Typography><Typography fontWeight={700}>{fmt(sesionDetalle.montoEsperado ?? 0)}</Typography></Box>
                      <Box><Typography variant='caption' color='text.secondary'>Contado</Typography><Typography fontWeight={700}>{fmt(sesionDetalle.montoRealContado)}</Typography></Box>
                      <Box><Typography variant='caption' color='text.secondary'>Diferencia</Typography>
                        <Typography fontWeight={700} color={(sesionDetalle.diferencia ?? 0) >= 0 ? 'success.main' : 'error.main'}>
                          {(sesionDetalle.diferencia ?? 0) >= 0 ? '+' : ''}{fmt(sesionDetalle.diferencia ?? 0)}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </>
              )}
              <Divider />
              <Typography variant='subtitle2'>Movimientos</Typography>
              {movimientos.length === 0 ? <Typography variant='body2' color='text.secondary'>Sin movimientos</Typography> : (
                <TableContainer component={Paper} variant='outlined'>
                  <Table size='small'>
                    <TableHead><TableRow><TableCell>Tipo</TableCell><TableCell>Descripción</TableCell><TableCell align='right'>Monto</TableCell><TableCell>Hora</TableCell></TableRow></TableHead>
                    <TableBody>
                      {movimientos.map(m => (
                        <TableRow key={m.id}>
                          <TableCell><Chip label={tipoLabel[m.tipo]} size='small' sx={{ bgcolor: tipoColor[m.tipo], color: 'white' }} /></TableCell>
                          <TableCell>{m.descripcion}{m.pago?.factura && <Typography variant='caption' color='text.secondary' display='block'>{m.pago.factura.numeroFactura}</Typography>}</TableCell>
                          <TableCell align='right'><Typography variant='body2' fontWeight={600} color={m.tipo === 'INGRESO' ? 'success.main' : 'error.main'}>{m.tipo === 'INGRESO' ? '+' : '-'}{fmt(m.monto)}</Typography></TableCell>
                          <TableCell>{fmtDate(m.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}><Button onClick={() => setDetalleOpen(false)}>Cerrar</Button></DialogActions>
      </Dialog>

      {/* Método de pago */}
      <Dialog open={metodoDialogOpen} onClose={() => setMetodoDialogOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {metodoEditando ? 'Editar Método' : 'Nuevo Método de Pago'}
          <IconButton onClick={() => setMetodoDialogOpen(false)} size='small'><i className='tabler-x' /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box display='flex' flexDirection='column' gap={2}>
            <TextField label='Nombre *' fullWidth value={metodoNombre} onChange={e => setMetodoNombre(e.target.value)} placeholder='Efectivo, Tarjeta, Transferencia...' />
            <TextField label='Descripción' fullWidth value={metodoDescripcion} onChange={e => setMetodoDescripcion(e.target.value)} />
            <Paper variant='outlined' sx={{ p: 2 }}>
              <FormControlLabel
                control={<Switch checked={metodoEsEfectivo} onChange={e => setMetodoEsEfectivo(e.target.checked)} color='success' />}
                label={<Box><Typography variant='body2' fontWeight={600}>Genera movimiento en caja</Typography><Typography variant='caption' color='text.secondary'>Activa para pagos en efectivo físico</Typography></Box>}
              />
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setMetodoDialogOpen(false)}>Cancelar</Button>
          <Button variant='contained' onClick={handleGuardarMetodo} disabled={metodoLoading}>
            {metodoLoading ? 'Guardando...' : metodoEditando ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notificaciones */}
      <Snackbar open={!!errorMsg} autoHideDuration={6000} onClose={() => setErrorMsg(null)}>
        <Alert severity='error' onClose={() => setErrorMsg(null)}>{errorMsg}</Alert>
      </Snackbar>
      <Snackbar open={!!successMsg} autoHideDuration={4000} onClose={() => setSuccessMsg(null)}>
        <Alert severity='success' onClose={() => setSuccessMsg(null)}>{successMsg}</Alert>
      </Snackbar>
    </Box>
  )
}
