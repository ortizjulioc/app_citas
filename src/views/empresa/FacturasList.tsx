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
import Divider from '@mui/material/Divider'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Tooltip from '@mui/material/Tooltip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'

import { useAuth } from '@/contexts/AuthContext'
import { useConfirmDialog } from '@/components/shared/confirm-dialog'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Cliente {
  id: string
  nombre: string
  apellido: string
  telefono?: string
}
interface Sucursal {
  id: string
  nombre: string
}
interface ServicioSucursal {
  sucursalId: string
  precio: number | null
}

interface Servicio {
  id: string
  nombre: string
  precio?: number | null
  servicioSucursals?: ServicioSucursal[]
}
interface Producto {
  id: string
  nombre: string
  precio: number
  stock: number
}
interface MetodoPago {
  id: string
  nombre: string
  esEfectivo: boolean
}

interface DetalleFactura {
  id: string
  tipo: 'SERVICIO' | 'PRODUCTO'
  descripcion: string
  cantidad: number
  precioUnitario: number
  descuento: number
  subtotal: number
  servicio?: { nombre: string }
  producto?: { nombre: string }
}

interface Pago {
  id: string
  monto: number
  estado: string
  referencia?: string
  createdAt: string
  metodoPago: { nombre: string }
}

interface Factura {
  id: string
  numeroFactura: string
  estado: 'PENDIENTE' | 'PARCIAL' | 'PAGADA' | 'CANCELADA'
  subtotal: number
  descuentos: number
  itbisAplicado: number
  total: number
  montoPagado: number
  notas?: string
  createdAt: string
  cliente: Cliente
  sucursal: Sucursal
  detalleFacturas?: DetalleFactura[]
  pagos?: Pago[]
  saldoPendiente?: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const estadoColor: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  PENDIENTE: 'warning',
  PARCIAL: 'info',
  PAGADA: 'success',
  CANCELADA: 'error'
}

const estadoLabel: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  PARCIAL: 'Parcial',
  PAGADA: 'Pagada',
  CANCELADA: 'Cancelada'
}

const fmt = (n: number) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(n)

const fmtDate = (iso: string) => new Date(iso).toLocaleString('es-DO', { dateStyle: 'short', timeStyle: 'short' })

// ─── Item row para formulario de nueva factura ────────────────────────────────

interface ItemRow {
  tipo: 'SERVICIO' | 'PRODUCTO'
  servicioId: string
  productoId: string
  descripcion: string
  cantidad: number
  precioUnitario: number
  descuento: number
}

const emptyItem = (): ItemRow => ({
  tipo: 'SERVICIO',
  servicioId: '',
  productoId: '',
  descripcion: '',
  cantidad: 1,
  precioUnitario: 0,
  descuento: 0
})

// ─── Componente principal ─────────────────────────────────────────────────────

export default function FacturasList() {
  const { token } = useAuth()
  const { confirm } = useConfirmDialog()

  // Lista
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [total, setTotal] = useState(0)

  // Filtros
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroSucursal, setFiltroSucursal] = useState('')

  // Catálogos
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])

  // Notificaciones
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Detalle
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [facturaDetalle, setFacturaDetalle] = useState<Factura | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  // Crear factura
  const [crearOpen, setCrearOpen] = useState(false)
  const [crearLoading, setCrearLoading] = useState(false)
  const [clienteId, setClienteId] = useState('')
  const [sucursalId, setSucursalId] = useState('')
  const [descuentoGlobal, setDescuentoGlobal] = useState('0')
  const [notasFactura, setNotasFactura] = useState('')
  const [items, setItems] = useState<ItemRow[]>([emptyItem()])

  // Registrar pago
  const [pagoOpen, setPagoOpen] = useState(false)
  const [pagoLoading, setPagoLoading] = useState(false)
  const [pagoFactura, setPagoFactura] = useState<Factura | null>(null)
  const [pagoMetodo, setPagoMetodo] = useState('')
  const [pagoMonto, setPagoMonto] = useState('')
  const [pagoReferencia, setPagoReferencia] = useState('')

  // ── Debounce búsqueda
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  // ── Carga inicial catálogos
  useEffect(() => {
    if (!token) return
    fetchCatalogos()
  }, [token])

  // ── Fetch facturas al cambiar filtros
  useEffect(() => {
    if (!token) return
    fetchFacturas()
  }, [token, page, rowsPerPage, debouncedSearch, filtroEstado, filtroSucursal])

  const fetchFacturas = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage)
      })
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (filtroEstado) params.append('estado', filtroEstado)
      if (filtroSucursal) params.append('sucursalId', filtroSucursal)

      const res = await fetch(`/api/facturas?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (res.ok) {
        setFacturas(json.data?.facturas || [])
        setTotal(json.data?.pagination?.total || 0)
      }
    } catch {
      setErrorMsg('Error al cargar facturas')
    } finally {
      setLoading(false)
    }
  }

  const fetchCatalogos = async () => {
    try {
      const [cRes, sRes, svRes, prRes, mpRes] = await Promise.all([
        fetch('/api/clientes?limit=200', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/sucursales?limit=100', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/servicios?limit=200', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/productos?limit=200', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/metodos-pago', { headers: { Authorization: `Bearer ${token}` } })
      ])
      const [cJson, sJson, svJson, prJson, mpJson] = await Promise.all([
        cRes.json(),
        sRes.json(),
        svRes.json(),
        prRes.json(),
        mpRes.json()
      ])
      setClientes(cJson.data?.clientes || [])
      setSucursales(sJson.data?.sucursales || [])
      setServicios(svJson.data?.servicios || [])
      setProductos(prJson.data?.productos || [])
      setMetodosPago(mpJson.data?.metodoPagos || [])
    } catch {
      console.error('Error cargando catálogos')
    }
  }

  const openDetalle = async (factura: Factura) => {
    setDetalleOpen(true)
    setLoadingDetalle(true)
    setFacturaDetalle(null)
    try {
      const res = await fetch(`/api/facturas/${factura.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (res.ok) setFacturaDetalle(json.data)
    } catch {
      setErrorMsg('Error al cargar detalle')
    } finally {
      setLoadingDetalle(false)
    }
  }

  // ── Cancelar factura
  const handleCancelar = async (factura: Factura) => {
    const ok = await confirm({
      title: 'Cancelar Factura',
      message: `¿Cancelar la factura <b>${factura.numeroFactura}</b>? Esta acción no se puede deshacer.`,
      confirmText: 'Cancelar Factura'
    })
    if (!ok) return
    try {
      const res = await fetch(`/api/facturas/${factura.id}/cancelar`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'Error')
      setSuccessMsg('Factura cancelada')
      if (detalleOpen) setDetalleOpen(false)
      fetchFacturas()
    } catch (e: any) {
      setErrorMsg(e.message)
    }
  }

  // ── Crear factura
  const calcTotales = () => {
    const subtotal = items.reduce((acc, it) => acc + it.precioUnitario * it.cantidad - it.descuento, 0)
    const descGlobal = parseFloat(descuentoGlobal) || 0
    const base = Math.max(0, subtotal - descGlobal)
    return { subtotal, base }
  }

  const handleCrearFactura = async () => {
    if (!clienteId || !sucursalId) {
      setErrorMsg('Selecciona cliente y sucursal')
      return
    }
    const validItems = items.filter(
      it => (it.tipo === 'SERVICIO' && it.servicioId) || (it.tipo === 'PRODUCTO' && it.productoId)
    )
    if (validItems.length === 0) {
      setErrorMsg('Agrega al menos un servicio o producto')
      return
    }

    setCrearLoading(true)
    setErrorMsg(null)
    try {
      const payload = {
        clienteId,
        sucursalId,
        descuentos: parseFloat(descuentoGlobal) || 0,
        notas: notasFactura || undefined,
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
      setCrearOpen(false)
      resetCrearForm()
      fetchFacturas()
    } catch (e: any) {
      setErrorMsg(e.message)
    } finally {
      setCrearLoading(false)
    }
  }

  const resetCrearForm = () => {
    setClienteId('')
    setSucursalId('')
    setDescuentoGlobal('0')
    setNotasFactura('')
    setItems([emptyItem()])
  }

  const updateItem = (idx: number, field: keyof ItemRow, value: any) => {
    setItems(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      // Al cambiar tipo, limpiar ids
      if (field === 'tipo') {
        next[idx].servicioId = ''
        next[idx].productoId = ''
        next[idx].precioUnitario = 0
        next[idx].descripcion = ''
      }
      // Al seleccionar servicio, autocompletar precio
      if (field === 'servicioId') {
        const srv = servicios.find(s => s.id === value)
        if (srv) {
          next[idx].descripcion = srv.nombre
          
          let precioServicio = srv.precio ? Number(srv.precio) : 0
          
          if (srv.servicioSucursals && srv.servicioSucursals.length > 0) {
            const ss = srv.servicioSucursals.find(s => s.sucursalId === sucursalId)
            if (ss && ss.precio !== null && ss.precio !== undefined) {
              precioServicio = Number(ss.precio)
            } else {
              const fallback = srv.servicioSucursals.find(s => s.precio !== null && s.precio !== undefined)
              if (fallback && fallback.precio !== null && fallback.precio !== undefined) {
                precioServicio = Number(fallback.precio)
              }
            }
          }
          
          next[idx].precioUnitario = precioServicio
        }
      }
      // Al seleccionar producto, autocompletar precio
      if (field === 'productoId') {
        const pr = productos.find(p => p.id === value)
        if (pr) {
          next[idx].precioUnitario = pr.precio
          next[idx].descripcion = pr.nombre
        }
      }
      return next
    })
  }

  // ── Registrar pago
  const openPago = (factura: Factura) => {
    setPagoFactura(factura)
    const saldo = factura.total - factura.montoPagado
    setPagoMonto(saldo.toFixed(2))
    setPagoMetodo(metodosPago[0]?.id || '')
    setPagoReferencia('')
    setPagoOpen(true)
  }

  const handleRegistrarPago = async () => {
    if (!pagoMetodo || !pagoMonto) {
      setErrorMsg('Completa los campos')
      return
    }
    setPagoLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          facturaId: pagoFactura!.id,
          metodoPagoId: pagoMetodo,
          monto: parseFloat(pagoMonto),
          referencia: pagoReferencia || undefined
        })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'Error')
      setSuccessMsg('Pago registrado')
      setPagoOpen(false)
      if (detalleOpen && facturaDetalle?.id === pagoFactura?.id) {
        openDetalle(pagoFactura!)
      }
      fetchFacturas()
    } catch (e: any) {
      setErrorMsg(e.message)
    } finally {
      setPagoLoading(false)
    }
  }

  const handleAnularPago = async (pagoId: string) => {
    const ok = await confirm({ title: 'Anular Pago', message: '¿Anular este pago?', confirmText: 'Anular' })
    if (!ok) return
    try {
      const res = await fetch(`/api/pagos/${pagoId}/anular`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'Error')
      setSuccessMsg('Pago anulado')
      if (facturaDetalle) openDetalle(facturaDetalle)
      fetchFacturas()
    } catch (e: any) {
      setErrorMsg(e.message)
    }
  }

  // ── Render
  const { subtotal: crearSubtotal, base: crearBase } = calcTotales()

  if (!token)
    return (
      <Box display='flex' justifyContent='center' pt={8}>
        <CircularProgress />
      </Box>
    )

  return (
    <Box className='w-full'>
      <Card>
        <CardHeader
          title='Facturación'
          action={
            <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              onClick={() => {
                resetCrearForm()
                setCrearOpen(true)
              }}
            >
              Nueva Factura
            </Button>
          }
        />
        <CardContent>
          {/* Filtros */}
          <Box display='flex' gap={2} mb={3} flexWrap='wrap'>
            <TextField
              label='Buscar'
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                setPage(0)
              }}
              size='small'
              sx={{ minWidth: 220 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='tabler-search' />
                  </InputAdornment>
                )
              }}
            />
            <FormControl size='small' sx={{ minWidth: 160 }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filtroEstado}
                label='Estado'
                onChange={e => {
                  setFiltroEstado(e.target.value)
                  setPage(0)
                }}
              >
                <MenuItem value=''>Todos</MenuItem>
                <MenuItem value='PENDIENTE'>Pendiente</MenuItem>
                <MenuItem value='PARCIAL'>Parcial</MenuItem>
                <MenuItem value='PAGADA'>Pagada</MenuItem>
                <MenuItem value='CANCELADA'>Cancelada</MenuItem>
              </Select>
            </FormControl>
            <FormControl size='small' sx={{ minWidth: 180 }}>
              <InputLabel>Sucursal</InputLabel>
              <Select
                value={filtroSucursal}
                label='Sucursal'
                onChange={e => {
                  setFiltroSucursal(e.target.value)
                  setPage(0)
                }}
              >
                <MenuItem value=''>Todas</MenuItem>
                {sucursales.map(s => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Tabla */}
          {loading ? (
            <Box display='flex' justifyContent='center' py={6}>
              <CircularProgress />
            </Box>
          ) : facturas.length === 0 ? (
            <Box py={6} textAlign='center'>
              <i className='tabler-receipt-off' style={{ fontSize: 48, color: '#bdbdbd' }} />
              <Typography color='text.secondary' mt={2}>
                No hay facturas
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>N° Factura</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Sucursal</TableCell>
                      <TableCell align='right'>Total</TableCell>
                      <TableCell align='right'>Pagado</TableCell>
                      <TableCell align='right'>Saldo</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell align='center'>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {facturas.map(f => {
                      const saldo = Math.max(0, f.total - f.montoPagado)
                      return (
                        <TableRow key={f.id} hover sx={{ cursor: 'pointer' }}>
                          <TableCell onClick={() => openDetalle(f)}>
                            <Typography variant='body2' fontWeight={600} color='primary'>
                              {f.numeroFactura}
                            </Typography>
                          </TableCell>
                          <TableCell onClick={() => openDetalle(f)}>
                            {f.cliente.nombre} {f.cliente.apellido}
                          </TableCell>
                          <TableCell onClick={() => openDetalle(f)}>{f.sucursal.nombre}</TableCell>
                          <TableCell align='right' onClick={() => openDetalle(f)}>
                            {fmt(f.total)}
                          </TableCell>
                          <TableCell align='right' onClick={() => openDetalle(f)}>
                            {fmt(f.montoPagado)}
                          </TableCell>
                          <TableCell align='right' onClick={() => openDetalle(f)}>
                            <Typography color={saldo > 0 ? 'error' : 'success.main'} variant='body2' fontWeight={600}>
                              {fmt(saldo)}
                            </Typography>
                          </TableCell>
                          <TableCell onClick={() => openDetalle(f)}>
                            <Chip label={estadoLabel[f.estado]} color={estadoColor[f.estado]} size='small' />
                          </TableCell>
                          <TableCell onClick={() => openDetalle(f)}>{fmtDate(f.createdAt)}</TableCell>
                          <TableCell align='center'>
                            <Stack direction='row' spacing={0.5} justifyContent='center'>
                              {(f.estado === 'PENDIENTE' || f.estado === 'PARCIAL') && (
                                <Tooltip title='Registrar pago'>
                                  <IconButton size='small' color='success' onClick={() => openPago(f)}>
                                    <i className='tabler-cash' />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title='Ver detalle'>
                                <IconButton size='small' color='primary' onClick={() => openDetalle(f)}>
                                  <i className='tabler-eye' />
                                </IconButton>
                              </Tooltip>
                              {f.estado !== 'CANCELADA' && f.estado !== 'PAGADA' && (
                                <Tooltip title='Cancelar factura'>
                                  <IconButton size='small' color='error' onClick={() => handleCancelar(f)}>
                                    <i className='tabler-ban' />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component='div'
                count={total}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={e => {
                  setRowsPerPage(parseInt(e.target.value))
                  setPage(0)
                }}
                rowsPerPageOptions={[10, 20, 50]}
                labelRowsPerPage='Filas'
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* ── DIALOG: Detalle factura ─────────────────────────────── */}
      <Dialog open={detalleOpen} onClose={() => setDetalleOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box display='flex' alignItems='center' gap={1.5}>
            <i className='tabler-receipt' style={{ fontSize: 22 }} />
            <span>{facturaDetalle?.numeroFactura || '...'}</span>
            {facturaDetalle && (
              <Chip
                label={estadoLabel[facturaDetalle.estado]}
                color={estadoColor[facturaDetalle.estado]}
                size='small'
              />
            )}
          </Box>
          <IconButton onClick={() => setDetalleOpen(false)} size='small'>
            <i className='tabler-x' />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {loadingDetalle ? (
            <Box display='flex' justifyContent='center' py={4}>
              <CircularProgress />
            </Box>
          ) : facturaDetalle ? (
            <Box display='flex' flexDirection='column' gap={2}>
              {/* Info general */}
              <div className='grid grid-cols-1 sm:grid-cols-4 gap-4'>
                <div className='sm:col-span-2'>
                  <Typography variant='caption' color='text.secondary'>
                    Cliente
                  </Typography>
                  <Typography variant='body1' fontWeight={600}>
                    {facturaDetalle.cliente.nombre} {facturaDetalle.cliente.apellido}
                  </Typography>
                  {facturaDetalle.cliente.telefono && (
                    <Typography variant='caption' color='text.secondary'>
                      {facturaDetalle.cliente.telefono}
                    </Typography>
                  )}
                </div>
                <div>
                  <Typography variant='caption' color='text.secondary'>
                    Sucursal
                  </Typography>
                  <Typography variant='body2'>{facturaDetalle.sucursal.nombre}</Typography>
                </div>
                <div>
                  <Typography variant='caption' color='text.secondary'>
                    Fecha
                  </Typography>
                  <Typography variant='body2'>{fmtDate(facturaDetalle.createdAt)}</Typography>
                </div>
              </div>

              <Divider />

              {/* Ítems */}
              <Typography variant='subtitle2'>Ítems</Typography>
              <TableContainer component={Paper} variant='outlined'>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Descripción</TableCell>
                      <TableCell align='center'>Cant.</TableCell>
                      <TableCell align='right'>Precio</TableCell>
                      <TableCell align='right'>Desc.</TableCell>
                      <TableCell align='right'>Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {facturaDetalle.detalleFacturas?.map(d => (
                      <TableRow key={d.id}>
                        <TableCell>
                          <Box display='flex' alignItems='center' gap={1}>
                            <Chip
                              label={d.tipo === 'SERVICIO' ? 'Srv' : 'Prod'}
                              size='small'
                              color={d.tipo === 'SERVICIO' ? 'primary' : 'secondary'}
                              variant='outlined'
                            />
                            {d.descripcion}
                          </Box>
                        </TableCell>
                        <TableCell align='center'>{d.cantidad}</TableCell>
                        <TableCell align='right'>{fmt(d.precioUnitario)}</TableCell>
                        <TableCell align='right'>{d.descuento > 0 ? fmt(d.descuento) : '-'}</TableCell>
                        <TableCell align='right'>{fmt(d.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Totales */}
              <Box display='flex' justifyContent='flex-end'>
                <Box minWidth={260}>
                  <Box display='flex' justifyContent='space-between' py={0.5}>
                    <Typography variant='body2' color='text.secondary'>
                      Subtotal
                    </Typography>
                    <Typography variant='body2'>{fmt(facturaDetalle.subtotal)}</Typography>
                  </Box>
                  {facturaDetalle.descuentos > 0 && (
                    <Box display='flex' justifyContent='space-between' py={0.5}>
                      <Typography variant='body2' color='text.secondary'>
                        Descuento
                      </Typography>
                      <Typography variant='body2' color='error'>
                        -{fmt(facturaDetalle.descuentos)}
                      </Typography>
                    </Box>
                  )}
                  {facturaDetalle.itbisAplicado > 0 && (
                    <Box display='flex' justifyContent='space-between' py={0.5}>
                      <Typography variant='body2' color='text.secondary'>
                        ITBIS ({(facturaDetalle as any).tasaItbis * 100}%)
                      </Typography>
                      <Typography variant='body2'>{fmt(facturaDetalle.itbisAplicado)}</Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box display='flex' justifyContent='space-between' py={0.5}>
                    <Typography variant='subtitle2'>Total</Typography>
                    <Typography variant='subtitle2'>{fmt(facturaDetalle.total)}</Typography>
                  </Box>
                  <Box display='flex' justifyContent='space-between' py={0.5}>
                    <Typography variant='body2' color='text.secondary'>
                      Pagado
                    </Typography>
                    <Typography variant='body2' color='success.main'>
                      {fmt(facturaDetalle.montoPagado)}
                    </Typography>
                  </Box>
                  <Box display='flex' justifyContent='space-between' py={0.5}>
                    <Typography variant='body2' color='text.secondary'>
                      Saldo
                    </Typography>
                    <Typography variant='body2' color='error' fontWeight={700}>
                      {fmt(facturaDetalle.saldoPendiente ?? facturaDetalle.total - facturaDetalle.montoPagado)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* Pagos */}
              <Typography variant='subtitle2'>Pagos registrados</Typography>
              {facturaDetalle.pagos && facturaDetalle.pagos.length > 0 ? (
                <TableContainer component={Paper} variant='outlined'>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Método</TableCell>
                        <TableCell align='right'>Monto</TableCell>
                        <TableCell>Referencia</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {facturaDetalle.pagos.map(p => (
                        <TableRow key={p.id}>
                          <TableCell>{p.metodoPago.nombre}</TableCell>
                          <TableCell align='right'>{fmt(p.monto)}</TableCell>
                          <TableCell>{p.referencia || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={p.estado === 'COMPLETADO' ? 'Completado' : 'Anulado'}
                              color={p.estado === 'COMPLETADO' ? 'success' : 'error'}
                              size='small'
                            />
                          </TableCell>
                          <TableCell>{fmtDate(p.createdAt)}</TableCell>
                          <TableCell>
                            {p.estado === 'COMPLETADO' && (
                              <Tooltip title='Anular pago'>
                                <IconButton size='small' color='error' onClick={() => handleAnularPago(p.id)}>
                                  <i className='tabler-ban' />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant='body2' color='text.secondary'>
                  Sin pagos registrados
                </Typography>
              )}

              {facturaDetalle.notas && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant='caption' color='text.secondary'>
                      Notas
                    </Typography>
                    <Typography variant='body2'>{facturaDetalle.notas}</Typography>
                  </Box>
                </>
              )}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          {facturaDetalle && (facturaDetalle.estado === 'PENDIENTE' || facturaDetalle.estado === 'PARCIAL') && (
            <>
              <Button color='error' onClick={() => handleCancelar(facturaDetalle)}>
                Cancelar Factura
              </Button>
              <Button
                variant='contained'
                color='success'
                startIcon={<i className='tabler-cash' />}
                onClick={() => {
                  setPagoOpen(true)
                  setPagoFactura(facturaDetalle)
                  const s = facturaDetalle.total - facturaDetalle.montoPagado
                  setPagoMonto(s.toFixed(2))
                  setPagoMetodo(metodosPago[0]?.id || '')
                  setPagoReferencia('')
                }}
              >
                Registrar Pago
              </Button>
            </>
          )}
          <Button onClick={() => setDetalleOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* ── DIALOG: Crear factura ─────────────────────────────── */}
      <Dialog open={crearOpen} onClose={() => setCrearOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Nueva Factura
          <IconButton onClick={() => setCrearOpen(false)} size='small'>
            <i className='tabler-x' />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box display='flex' flexDirection='column' gap={2.5}>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <FormControl fullWidth required>
                  <InputLabel>Cliente</InputLabel>
                  <Select value={clienteId} label='Cliente' onChange={e => setClienteId(e.target.value)}>
                    {clientes.map(c => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.nombre} {c.apellido}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
              <div>
                <FormControl fullWidth required>
                  <InputLabel>Sucursal</InputLabel>
                  <Select value={sucursalId} label='Sucursal' onChange={e => setSucursalId(e.target.value)}>
                    {sucursales.map(s => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            </div>

            <Divider>
              <Typography variant='caption'>Ítems</Typography>
            </Divider>

            {items.map((item, idx) => (
              <Paper key={idx} variant='outlined' sx={{ p: 2 }}>
                <div className='grid grid-cols-12 gap-3 items-start'>
                  <div className='col-span-12 sm:col-span-2'>
                    <FormControl fullWidth size='small'>
                      <InputLabel>Tipo</InputLabel>
                      <Select value={item.tipo} label='Tipo' onChange={e => updateItem(idx, 'tipo', e.target.value)}>
                        <MenuItem value='SERVICIO'>Servicio</MenuItem>
                        <MenuItem value='PRODUCTO'>Producto</MenuItem>
                      </Select>
                    </FormControl>
                  </div>
                  <div className='col-span-12 sm:col-span-3'>
                    {item.tipo === 'SERVICIO' ? (
                      <FormControl fullWidth size='small'>
                        <InputLabel>Servicio</InputLabel>
                        <Select
                          value={item.servicioId}
                          label='Servicio'
                          onChange={e => updateItem(idx, 'servicioId', e.target.value)}
                        >
                          {servicios.map(s => (
                            <MenuItem key={s.id} value={s.id}>
                              {s.nombre}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <FormControl fullWidth size='small'>
                        <InputLabel>Producto</InputLabel>
                        <Select
                          value={item.productoId}
                          label='Producto'
                          onChange={e => updateItem(idx, 'productoId', e.target.value)}
                        >
                          {productos.map(p => (
                            <MenuItem key={p.id} value={p.id}>
                              {p.nombre} (Stock: {p.stock})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </div>
                  <div className='col-span-6 sm:col-span-2'>
                    <TextField
                      size='small'
                      label='Precio'
                      type='number'
                      fullWidth
                      value={item.precioUnitario}
                      onChange={e => updateItem(idx, 'precioUnitario', parseFloat(e.target.value) || 0)}
                      InputProps={{ startAdornment: <InputAdornment position='start'>$</InputAdornment> }}
                    />
                  </div>
                  <div className='col-span-6 sm:col-span-1'>
                    <TextField
                      size='small'
                      label='Cant.'
                      type='number'
                      fullWidth
                      value={item.cantidad}
                      onChange={e => updateItem(idx, 'cantidad', parseInt(e.target.value) || 1)}
                      inputProps={{ min: 1 }}
                    />
                  </div>
                  <div className='col-span-6 sm:col-span-2'>
                    <TextField
                      size='small'
                      label='Desc.'
                      type='number'
                      fullWidth
                      value={item.descuento}
                      onChange={e => updateItem(idx, 'descuento', parseFloat(e.target.value) || 0)}
                      InputProps={{ startAdornment: <InputAdornment position='start'>$</InputAdornment> }}
                    />
                  </div>
                  <div className='col-span-6 sm:col-span-1 flex items-center justify-center pt-2'>
                    <Typography variant='body2' fontWeight={600}>
                      {fmt(item.precioUnitario * item.cantidad - item.descuento)}
                    </Typography>
                  </div>
                  <div className='col-span-12 sm:col-span-1 flex items-center justify-center pt-1'>
                    {items.length > 1 && (
                      <IconButton
                        size='small'
                        color='error'
                        onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                      >
                        <i className='tabler-trash' />
                      </IconButton>
                    )}
                  </div>
                </div>
              </Paper>
            ))}

            <Button
              startIcon={<i className='tabler-plus' />}
              onClick={() => setItems(prev => [...prev, emptyItem()])}
              variant='outlined'
              size='small'
              sx={{ alignSelf: 'flex-start' }}
            >
              Agregar ítem
            </Button>

            <Divider />

            <div className='grid grid-cols-1 sm:grid-cols-12 gap-4'>
              <div className='sm:col-span-4'>
                <TextField
                  label='Descuento global'
                  type='number'
                  fullWidth
                  size='small'
                  value={descuentoGlobal}
                  onChange={e => setDescuentoGlobal(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position='start'>$</InputAdornment> }}
                />
              </div>
              <div className='sm:col-span-8'>
                <TextField
                  label='Notas'
                  fullWidth
                  size='small'
                  value={notasFactura}
                  onChange={e => setNotasFactura(e.target.value)}
                  multiline
                  rows={2}
                />
              </div>
            </div>

            {/* Resumen */}
            <Box display='flex' justifyContent='flex-end'>
              <Paper variant='outlined' sx={{ p: 2, minWidth: 220 }}>
                <Box display='flex' justifyContent='space-between' mb={0.5}>
                  <Typography variant='body2' color='text.secondary'>
                    Subtotal
                  </Typography>
                  <Typography variant='body2'>{fmt(crearSubtotal)}</Typography>
                </Box>
                {parseFloat(descuentoGlobal) > 0 && (
                  <Box display='flex' justifyContent='space-between' mb={0.5}>
                    <Typography variant='body2' color='text.secondary'>
                      Descuento
                    </Typography>
                    <Typography variant='body2' color='error'>
                      -{fmt(parseFloat(descuentoGlobal))}
                    </Typography>
                  </Box>
                )}
                <Divider sx={{ my: 1 }} />
                <Box display='flex' justifyContent='space-between'>
                  <Typography variant='subtitle2'>Estimado</Typography>
                  <Typography variant='subtitle2'>{fmt(crearBase)}</Typography>
                </Box>
                <Typography variant='caption' color='text.secondary'>
                  (sin ITBIS, se aplica según configuración del negocio)
                </Typography>
              </Paper>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCrearOpen(false)}>Cancelar</Button>
          <Button variant='contained' onClick={handleCrearFactura} disabled={crearLoading}>
            {crearLoading ? 'Creando...' : 'Crear Factura'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── DIALOG: Registrar pago ─────────────────────────────── */}
      <Dialog open={pagoOpen} onClose={() => setPagoOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Registrar Pago
          <IconButton onClick={() => setPagoOpen(false)} size='small'>
            <i className='tabler-x' />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box display='flex' flexDirection='column' gap={2}>
            {pagoFactura && (
              <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 1.5 }}>
                <Typography variant='caption' color='text.secondary'>
                  Factura
                </Typography>
                <Typography variant='body2' fontWeight={600}>
                  {pagoFactura.numeroFactura}
                </Typography>
                <Typography variant='caption'>
                  Total: {fmt(pagoFactura.total)} · Saldo: {fmt(pagoFactura.total - pagoFactura.montoPagado)}
                </Typography>
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
            <TextField
              label='Monto'
              type='number'
              fullWidth
              required
              value={pagoMonto}
              onChange={e => setPagoMonto(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position='start'>$</InputAdornment> }}
            />
            <TextField
              label='Referencia (opcional)'
              fullWidth
              value={pagoReferencia}
              onChange={e => setPagoReferencia(e.target.value)}
              placeholder='N° transacción, cheque, etc.'
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setPagoOpen(false)}>Cancelar</Button>
          <Button variant='contained' color='success' onClick={handleRegistrarPago} disabled={pagoLoading}>
            {pagoLoading ? 'Procesando...' : 'Confirmar Pago'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notificaciones */}
      <Snackbar open={!!errorMsg} autoHideDuration={6000} onClose={() => setErrorMsg(null)}>
        <Alert severity='error' onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      </Snackbar>
      <Snackbar open={!!successMsg} autoHideDuration={4000} onClose={() => setSuccessMsg(null)}>
        <Alert severity='success' onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      </Snackbar>
    </Box>
  )
}
