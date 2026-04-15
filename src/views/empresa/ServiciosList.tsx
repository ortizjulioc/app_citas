'use client'

import { useState, useEffect } from 'react'
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
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'

import { useConfirmDialog } from '@/components/shared/confirm-dialog'

interface Servicio {
  id: string
  nombre: string
  descripcion: string | null
  precio: number | null
  costo: number | null
  duracionMinutos: number
  activo: boolean
  sucursalId: string
  createdAt: string
}

interface Sucursal {
  id: string
  nombre: string
}

export default function ServiciosList() {
  const { confirm } = useConfirmDialog()
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    costo: '',
    duracionMinutos: '',
    activo: true,
    sucursalId: ''
  })

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const fetchSucursales = async () => {
    try {
      const res = await fetch('/api/sucursales?limit=100')
      const json = await res.json()
      if (res.ok) {
        setSucursales(json.data?.sucursales || [])
      }
    } catch (err) {
      console.error('Error fetching sucursales', err)
    }
  }

  const fetchServicios = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/servicios')
      const json = await res.json()
      if (res.ok) {
        setServicios(json.data?.servicios || [])
      } else {
        throw new Error(json.error?.message || 'Error fetching data')
      }
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSucursales()
    fetchServicios()
  }, [])

  const handleOpen = (servicio?: Servicio) => {
    if (servicio) {
      setEditingId(servicio.id)
      setFormData({
        nombre: servicio.nombre,
        descripcion: servicio.descripcion || '',
        precio: servicio.precio?.toString() || '',
        costo: servicio.costo?.toString() || '',
        duracionMinutos: servicio.duracionMinutos.toString(),
        activo: servicio.activo,
        sucursalId: servicio.sucursalId
      })
    } else {
      setEditingId(null)
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        costo: '',
        duracionMinutos: '',
        activo: true,
        sucursalId: ''
      })
    }
    setOpenDialog(true)
  }

  const handleClose = () => {
    setOpenDialog(false)
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      costo: '',
      duracionMinutos: '',
      activo: true,
      sucursalId: ''
    })
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) return setErrorMsg('El nombre es requerido')
    if (!formData.duracionMinutos.trim()) return setErrorMsg('La duración en minutos es requerida')
    if (!formData.sucursalId) return setErrorMsg('La sucursal es requerida')

    try {
      const url = editingId ? `/api/servicios/${editingId}` : '/api/servicios'
      const method = editingId ? 'PUT' : 'POST'

      const body = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        precio: formData.precio ? parseFloat(formData.precio) : null,
        costo: formData.costo ? parseFloat(formData.costo) : null,
        duracionMinutos: parseInt(formData.duracionMinutos),
        activo: formData.activo,
        sucursalId: formData.sucursalId
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'Error saving data')

      setSuccessMsg(`Servicio ${editingId ? 'actualizado' : 'creado'} con éxito`)
      handleClose()
      fetchServicios()
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  const handleDelete = async (id: string, nombre: string) => {
    const isConfirmed = await confirm({
      title: 'Eliminar Servicio',
      message: `¿Estás seguro de que deseas eliminar el servicio <b>${nombre}</b>? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar'
    })

    if (!isConfirmed) return

    try {
      const res = await fetch(`/api/servicios/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'Error deleting servicio')

      setSuccessMsg('Servicio eliminado')
      fetchServicios()
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  const getSucursalName = (sucursalId: string) => {
    const sucursal = sucursales.find(s => s.id === sucursalId)
    return sucursal?.nombre || '-'
  }

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-'
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value)
  }

  return (
    <Box className='w-full'>
      <Card>
        <CardHeader
          title='Gestión de Servicios'
          action={
            <Button variant='contained' onClick={() => handleOpen()} startIcon={<i className='tabler-plus' />}>
              Nuevo Servicio
            </Button>
          }
        />
        <TableContainer>
          {loading ? (
            <Box p={4} display='flex' justifyContent='center'>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Precio</TableCell>
                  <TableCell>Costo</TableCell>
                  <TableCell>Duración (min)</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Sucursal</TableCell>
                  <TableCell align='center'>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {servicios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align='center'>
                      No hay servicios registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  servicios.map(s => (
                    <TableRow key={s.id} hover>
                      <TableCell>{s.nombre}</TableCell>
                      <TableCell>{s.descripcion || '-'}</TableCell>
                      <TableCell>{formatCurrency(s.precio)}</TableCell>
                      <TableCell>{formatCurrency(s.costo)}</TableCell>
                      <TableCell>{s.duracionMinutos}</TableCell>
                      <TableCell>
                        <Typography color={s.activo ? 'success.main' : 'error.main'}>
                          {s.activo ? 'Activo' : 'Inactivo'}
                        </Typography>
                      </TableCell>
                      <TableCell>{getSucursalName(s.sucursalId)}</TableCell>
                      <TableCell align='center'>
                        <IconButton color='primary' onClick={() => handleOpen(s)}>
                          <i className='tabler-edit' />
                        </IconButton>
                        <IconButton color='error' onClick={() => handleDelete(s.id, s.nombre)}>
                          <i className='tabler-trash' />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Card>

      <Dialog open={openDialog} onClose={handleClose} fullWidth maxWidth='sm'>
        <DialogTitle>{editingId ? 'Editar Servicio' : 'Nuevo Servicio'}</DialogTitle>
        <DialogContent dividers>
          <Box display='flex' flexDirection='column' gap={2}>
            <TextField
              autoFocus
              fullWidth
              label='Nombre'
              value={formData.nombre}
              onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              placeholder='Corte de Cabello'
            />
            <TextField
              fullWidth
              label='Descripción'
              value={formData.descripcion}
              onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder='Descripción del servicio'
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label='Precio'
              type='number'
              value={formData.precio}
              onChange={e => setFormData({ ...formData, precio: e.target.value })}
              placeholder='0.00'
            />
            <TextField
              fullWidth
              label='Costo'
              type='number'
              value={formData.costo}
              onChange={e => setFormData({ ...formData, costo: e.target.value })}
              placeholder='0.00'
            />
            <TextField
              fullWidth
              label='Duración (minutos)'
              type='number'
              value={formData.duracionMinutos}
              onChange={e => setFormData({ ...formData, duracionMinutos: e.target.value })}
              placeholder='30'
            />
            <FormControl fullWidth>
              <InputLabel>Sucursal</InputLabel>
              <Select
                value={formData.sucursalId}
                label='Sucursal'
                onChange={e => setFormData({ ...formData, sucursalId: e.target.value })}
              >
                {sucursales.map(s => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.activo}
                  onChange={e => setFormData({ ...formData, activo: e.target.checked })}
                />
              }
              label='Activo'
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color='inherit'>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} variant='contained'>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!errorMsg} autoHideDuration={6000} onClose={() => setErrorMsg(null)}>
        <Alert severity='error' onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      </Snackbar>
      <Snackbar open={!!successMsg} autoHideDuration={6000} onClose={() => setSuccessMsg(null)}>
        <Alert severity='success' onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      </Snackbar>
    </Box>
  )
}
