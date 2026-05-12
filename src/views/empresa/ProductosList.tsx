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
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'

import { useConfirmDialog } from '@/components/shared/confirm-dialog'
import { useAuth } from '@/contexts/AuthContext'

interface Producto {
  id: string
  nombre: string
  descripcion: string | null
  precio: number
  costo: number
  stock: number
  sucursalId: string
  sucursal: { id: string; nombre: string }
}

interface Movimiento {
  id: string
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE'
  cantidadAnterior: number
  cantidad: number
  cantidadNueva: number
  referencia: string | null
  createdAt: string
}

interface Sucursal {
  id: string
  nombre: string
}

const tipoColores: Record<string, string> = {
  ENTRADA: '#4caf50',
  SALIDA: '#f44336',
  AJUSTE: '#ff9800'
}

const tipoLabels: Record<string, string> = {
  ENTRADA: 'Entrada',
  SALIDA: 'Salida',
  AJUSTE: 'Ajuste'
}

export default function ProductosList() {
  const { confirm } = useConfirmDialog()
  const { token } = useAuth()

  const [productos, setProductos] = useState<Producto[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [total, setTotal] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [sucursalFiltro, setSucursalFiltro] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [openDialog, setOpenDialog] = useState(false)
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    costo: '',
    stock: '',
    sucursalId: ''
  })

  const [historialOpen, setHistorialOpen] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loadingMovimientos, setLoadingMovimientos] = useState(false)
  const [historialTotal, setHistorialTotal] = useState(0)
  const [historialPage, setHistorialPage] = useState(0)

  const [stockAdjustOpen, setStockAdjustOpen] = useState(false)
  const [stockAdjustProducto, setStockAdjustProducto] = useState<Producto | null>(null)
  const [stockTipo, setStockTipo] = useState<'ENTRADA' | 'SALIDA' | 'AJUSTE'>('ENTRADA')
  const [stockCantidad, setStockCantidad] = useState('')
  const [stockReferencia, setStockReferencia] = useState('')
  const [stockAdjustLoading, setStockAdjustLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (token) {
      fetchSucursales()
    }
  }, [token])

  useEffect(() => {
    if (token) {
      fetchProductos()
    }
  }, [token, sucursalFiltro, debouncedSearch, page, rowsPerPage])

  const fetchSucursales = async () => {
    try {
      const res = await fetch('/api/sucursales?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (res.ok) {
        setSucursales(json.data?.sucursales || [])
      }
    } catch (err) {
      console.error('Error fetching sucursales', err)
    }
  }

  const fetchProductos = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const params = new URLSearchParams()
      params.append('page', String(page + 1))
      params.append('limit', String(rowsPerPage))
      if (sucursalFiltro) params.append('sucursalId', sucursalFiltro)
      if (debouncedSearch) params.append('search', debouncedSearch)

      const res = await fetch(`/api/productos?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (res.ok) {
        setProductos(json.data?.productos || [])
        setTotal(json.data?.pagination?.total || 0)
      } else {
        setErrorMsg('Error al cargar productos')
      }
    } catch {
      setErrorMsg('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingProducto(null)
    const defaultSucursal = sucursalFiltro || (sucursales[0]?.id ?? '')
    setFormData({ nombre: '', descripcion: '', precio: '', costo: '', stock: '', sucursalId: defaultSucursal })
    setOpenDialog(true)
    setErrorMsg(null)
  }

  const handleOpenEdit = (producto: Producto) => {
    setEditingProducto(producto)
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: producto.precio.toString(),
      costo: producto.costo.toString(),
      stock: producto.stock.toString(),
      sucursalId: producto.sucursalId
    })
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingProducto(null)
  }

  const handleSubmit = async () => {
    if (!formData.nombre || !formData.precio || !formData.costo || !formData.stock || !formData.sucursalId) {
      setErrorMsg('Completa los campos requeridos')
      return
    }
    if (isNaN(parseFloat(formData.precio)) || isNaN(parseFloat(formData.costo)) || isNaN(parseInt(formData.stock))) {
      setErrorMsg('Precio, costo y stock deben ser números válidos')
      return
    }

    setFormLoading(true)
    setErrorMsg(null)
    try {
      const payload: Record<string, any> = {
        nombre: formData.nombre,
        precio: parseFloat(formData.precio),
        costo: parseFloat(formData.costo),
        stock: parseInt(formData.stock),
        sucursalId: formData.sucursalId
      }
      if (formData.descripcion.trim()) {
        payload.descripcion = formData.descripcion.trim()
      }

      const url = editingProducto ? `/api/productos/${editingProducto.id}` : '/api/productos'
      const method = editingProducto ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || `Error ${res.status}`)

      setSuccessMsg(`Producto ${editingProducto ? 'actualizado' : 'creado'} exitosamente`)
      handleCloseDialog()
      fetchProductos()
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (producto: Producto) => {
    const isConfirmed = await confirm({
      title: 'Eliminar Producto',
      message: `¿Eliminar el producto <b>${producto.nombre}</b>?`,
      confirmText: 'Eliminar'
    })
    if (!isConfirmed) return

    try {
      const res = await fetch(`/api/productos/${producto.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Error')
      setSuccessMsg('Producto eliminado')
      fetchProductos()
    } catch {
      setErrorMsg('Error al eliminar')
    }
  }

  const openHistorial = async (producto: Producto) => {
    setSelectedProducto(producto)
    setHistorialOpen(true)
    setLoadingMovimientos(true)
    setHistorialPage(0)
    try {
      const res = await fetch(`/api/productos/${producto.id}/movimientos?page=1&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (res.ok) {
        setMovimientos(json.data?.movimientos || [])
        setHistorialTotal(json.data?.pagination?.total || 0)
      }
    } catch {
      setMovimientos([])
    } finally {
      setLoadingMovimientos(false)
    }
  }

  const fetchMovimientos = async (productoId: string, pageNum: number) => {
    setLoadingMovimientos(true)
    try {
      const res = await fetch(`/api/productos/${productoId}/movimientos?page=${pageNum + 1}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (res.ok) {
        setMovimientos(json.data?.movimientos || [])
        setHistorialTotal(json.data?.pagination?.total || 0)
      }
    } catch {
      setMovimientos([])
    } finally {
      setLoadingMovimientos(false)
    }
  }

  const openStockAdjust = (producto: Producto) => {
    setStockAdjustProducto(producto)
    setStockTipo('ENTRADA')
    setStockCantidad('')
    setStockReferencia('')
    setStockAdjustOpen(true)
  }

  const handleStockAdjust = async () => {
    if (!stockAdjustProducto || !stockCantidad) return

    const cantidad = parseInt(stockCantidad)
    if (isNaN(cantidad) || cantidad <= 0) {
      setErrorMsg('Cantidad inválida')
      return
    }

    if (stockTipo !== 'AJUSTE' && !stockReferencia.trim()) {
      setErrorMsg('La referencia es requerida')
      return
    }

    setStockAdjustLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/productos/${stockAdjustProducto.id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          tipo: stockTipo,
          cantidad,
          referencia: stockTipo === 'AJUSTE' ? null : stockReferencia
        })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'Error al ajustar stock')

      setSuccessMsg('Stock actualizado')
      setStockAdjustOpen(false)
      fetchProductos()
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setStockAdjustLoading(false)
    }
  }

  const quickAdjustStock = async (productoId: string, delta: number, tipo: 'ENTRADA' | 'SALIDA') => {
    if (delta === 0) return

    try {
      const res = await fetch(`/api/productos/${productoId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          tipo,
          cantidad: Math.abs(delta),
          referencia: tipo === 'ENTRADA' ? 'Ajuste rápido' : 'Ajuste rápido'
        })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'Error')

      fetchProductos()
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(val)

  const formatDateTime = (iso: string) => {
    const date = new Date(iso)
    return date.toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' })
  }

  if (!token) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='50vh'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box className='w-full'>
      <Card>
        <CardHeader
          title='Gestión de Productos'
          action={
            <Button variant='contained' onClick={handleOpenCreate} startIcon={<i className='tabler-plus' />}>
              Nuevo Producto
            </Button>
          }
        />
        <CardContent>
          <Box display='flex' gap={2} mb={3} flexWrap='wrap'>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Sucursal</InputLabel>
              <Select value={sucursalFiltro} label='Sucursal' onChange={(e) => setSucursalFiltro(e.target.value)}>
                <MenuItem value=''>Todas</MenuItem>
                {sucursales.map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label='Buscar'
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0) }}
              InputProps={{
                startAdornment: <InputAdornment position='start'><i className='tabler-search' /></InputAdornment>
              }}
              sx={{ minWidth: 250 }}
            />
          </Box>

          {loading ? (
            <Box display='flex' justifyContent='center' py={4}><CircularProgress /></Box>
          ) : productos.length === 0 ? (
            <Box py={4} textAlign='center'>
              <i className='tabler-package-off' style={{ fontSize: 48, color: '#bdbdbd' }} />
              <Typography color='text.secondary' mt={2}>No hay productos registrados</Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Precio</TableCell>
                      <TableCell>Costo</TableCell>
                      <TableCell>Stock</TableCell>
                      <TableCell>Sucursal</TableCell>
                      <TableCell align='center'>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {productos.map(p => (
                      <TableRow key={p.id} hover>
                        <TableCell>
                          <Typography variant='subtitle2'>{p.nombre}</Typography>
                          {p.descripcion && <Typography variant='caption' color='text.secondary'>{p.descripcion}</Typography>}
                        </TableCell>
                        <TableCell>{formatCurrency(p.precio)}</TableCell>
                        <TableCell>{formatCurrency(p.costo)}</TableCell>
                        <TableCell>
                          <Box display='flex' alignItems='center' gap={0.5}>
                            <Tooltip title='-5'>
                              <Button size='small' variant='outlined' color='error' sx={{ minWidth: 32, p: 0.5, height: 28 }} onClick={() => quickAdjustStock(p.id, 5, 'SALIDA')}>-5</Button>
                            </Tooltip>
                            <Tooltip title='-1'>
                              <Button size='small' variant='outlined' color='error' sx={{ minWidth: 32, p: 0.5, height: 28 }} onClick={() => quickAdjustStock(p.id, 1, 'SALIDA')}>-1</Button>
                            </Tooltip>
                            <TextField
                              size='small'
                              type='number'
                              value={p.stock}
                              inputProps={{ readOnly: true, style: { width: 50, textAlign: 'center', padding: '4px 8px' } }}
                              sx={{ '& input': { MozAppearance: 'textfield' } }}
                            />
                            <Tooltip title='+1'>
                              <Button size='small' variant='contained' sx={{ minWidth: 32, p: 0.5, height: 28 }} onClick={() => quickAdjustStock(p.id, 1, 'ENTRADA')}>+1</Button>
                            </Tooltip>
                            <Tooltip title='+5'>
                              <Button size='small' variant='contained' sx={{ minWidth: 32, p: 0.5, height: 28 }} onClick={() => quickAdjustStock(p.id, 5, 'ENTRADA')}>+5</Button>
                            </Tooltip>
                            <Tooltip title='Ver histórico'>
                              <IconButton size='small' color='default' onClick={() => openHistorial(p)}>
                                <i className='tabler-history' />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                        <TableCell>{p.sucursal.nombre}</TableCell>
                        <TableCell align='center'>
                          <IconButton color='primary' onClick={() => handleOpenEdit(p)}><i className='tabler-edit' /></IconButton>
                          <IconButton color='error' onClick={() => handleDelete(p)}><i className='tabler-trash' /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component='div'
                count={total}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0) }}
                rowsPerPageOptions={[10, 20, 50]}
                labelRowsPerPage='Filas'
              />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
          <IconButton onClick={handleCloseDialog} size='small'><i className='tabler-x' /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box display='flex' flexDirection='column' gap={2}>
            <TextField label='Nombre' value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} fullWidth required />
            <TextField label='Descripción' value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} fullWidth multiline rows={2} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label='Precio' type='number' value={formData.precio} onChange={e => setFormData({ ...formData, precio: e.target.value })} fullWidth required inputProps={{ min: 0 }} InputProps={{ startAdornment: <InputAdornment position='start'>$</InputAdornment> }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label='Costo' type='number' value={formData.costo} onChange={e => setFormData({ ...formData, costo: e.target.value })} fullWidth required inputProps={{ min: 0 }} InputProps={{ startAdornment: <InputAdornment position='start'>$</InputAdornment> }} />
              </Grid>
            </Grid>
            {!editingProducto && (
              <TextField label='Stock Inicial' type='number' value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} fullWidth required inputProps={{ min: 0 }} />
            )}
            <FormControl fullWidth required>
              <InputLabel>Sucursal</InputLabel>
              <Select value={formData.sucursalId} label='Sucursal' onChange={e => setFormData({ ...formData, sucursalId: e.target.value })}>
                {sucursales.map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button variant='contained' onClick={handleSubmit} disabled={formLoading}>
            {formLoading ? 'Guardando...' : editingProducto ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={stockAdjustOpen} onClose={() => setStockAdjustOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Ajustar Stock: {stockAdjustProducto?.nombre}
          <IconButton onClick={() => setStockAdjustOpen(false)} size='small'><i className='tabler-x' /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box display='flex' flexDirection='column' gap={2}>
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select value={stockTipo} label='Tipo' onChange={e => setStockTipo(e.target.value as any)}>
                <MenuItem value='ENTRADA'>Entrada (+)</MenuItem>
                <MenuItem value='SALIDA'>Salida (-)</MenuItem>
                <MenuItem value='AJUSTE'>Ajuste (stock exacto)</MenuItem>
              </Select>
            </FormControl>
            <TextField label='Cantidad' type='number' value={stockCantidad} onChange={e => setStockCantidad(e.target.value)} fullWidth required inputProps={{ min: 1 }} />
            {stockTipo !== 'AJUSTE' && (
              <TextField label='Referencia' value={stockReferencia} onChange={e => setStockReferencia(e.target.value)} fullWidth placeholder='Factura, nota, etc.' />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setStockAdjustOpen(false)}>Cancelar</Button>
          <Button variant='contained' onClick={handleStockAdjust} disabled={stockAdjustLoading || !stockCantidad}>
            {stockAdjustLoading ? 'Guardando...' : 'Aplicar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={historialOpen} onClose={() => setHistorialOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Historial: {selectedProducto?.nombre}
          <IconButton onClick={() => setHistorialOpen(false)} size='small'><i className='tabler-x' /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {loadingMovimientos ? (
            <Box display='flex' justifyContent='center' py={4}><CircularProgress /></Box>
          ) : movimientos.length === 0 ? (
            <Box py={4} textAlign='center'>
              <i className='tabler-history-off' style={{ fontSize: 40, color: '#bdbdbd' }} />
              <Typography color='text.secondary' mt={1}>Sin movimientos</Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant='outlined'>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell align='right'>Cantidad</TableCell>
                    <TableCell align='right'>Stock Anterior</TableCell>
                    <TableCell align='right'>Stock Nuevo</TableCell>
                    <TableCell>Referencia</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movimientos.map(m => (
                    <TableRow key={m.id}>
                      <TableCell>{formatDateTime(m.createdAt)}</TableCell>
                      <TableCell>
                        <Chip label={tipoLabels[m.tipo]} size='small' sx={{ bgcolor: tipoColores[m.tipo], color: 'white' }} />
                      </TableCell>
                      <TableCell align='right'>{m.tipo === 'SALIDA' ? `-${m.cantidad}` : m.tipo === 'ENTRADA' ? `+${m.cantidad}` : m.cantidad}</TableCell>
                      <TableCell align='right'>{m.cantidadAnterior}</TableCell>
                      <TableCell align='right'>{m.cantidadNueva}</TableCell>
                      <TableCell>{m.referencia || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <Box display='flex' justifyContent='center' mt={2}>
            <TablePagination
              component='div'
              count={historialTotal}
              page={historialPage}
              onPageChange={(_, p) => { setHistorialPage(p); fetchMovimientos(selectedProducto!.id, p) }}
              rowsPerPage={20}
              rowsPerPageOptions={[20]}
              labelRowsPerPage='Filas'
            />
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar open={!!errorMsg} autoHideDuration={6000} onClose={() => setErrorMsg(null)}>
        <Alert severity='error' onClose={() => setErrorMsg(null)}>{errorMsg}</Alert>
      </Snackbar>
      <Snackbar open={!!successMsg} autoHideDuration={4000} onClose={() => setSuccessMsg(null)}>
        <Alert severity='success' onClose={() => setSuccessMsg(null)}>{successMsg}</Alert>
      </Snackbar>
    </Box>
  )
}
