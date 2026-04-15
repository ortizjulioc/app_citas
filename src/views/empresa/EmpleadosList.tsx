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

import { useConfirmDialog } from '@/components/shared/confirm-dialog'

interface Empleado {
  id: string
  nombre: string
  apellido: string
  telefono: string
  email: string
  tipoSalario: string
  salarioBase: number | null
  fechaContratacion: string | null
  sucursalId: string
  createdAt: string
}

interface Sucursal {
  id: string
  nombre: string
}

const tipoSalarioOptions = [
  { value: 'FIJO', label: 'Fijo' },
  { value: 'POR_HORA', label: 'Por Hora' },
  { value: 'POR_COMISION', label: 'Por Comisión' }
]

export default function EmpleadosList() {
  const { confirm } = useConfirmDialog()
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    tipoSalario: '',
    salarioBase: '',
    fechaContratacion: '',
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

  const fetchEmpleados = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/empleados')
      const json = await res.json()
      if (res.ok) {
        setEmpleados(json.data?.empleados || [])
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
    fetchEmpleados()
  }, [])

  const handleOpen = (empleado?: Empleado) => {
    if (empleado) {
      setEditingId(empleado.id)
      setFormData({
        nombre: empleado.nombre,
        apellido: empleado.apellido,
        telefono: empleado.telefono,
        email: empleado.email,
        tipoSalario: empleado.tipoSalario,
        salarioBase: empleado.salarioBase?.toString() || '',
        fechaContratacion: empleado.fechaContratacion ? empleado.fechaContratacion.split('T')[0] : '',
        sucursalId: empleado.sucursalId
      })
    } else {
      setEditingId(null)
      setFormData({
        nombre: '',
        apellido: '',
        telefono: '',
        email: '',
        tipoSalario: '',
        salarioBase: '',
        fechaContratacion: '',
        sucursalId: ''
      })
    }
    setOpenDialog(true)
  }

  const handleClose = () => {
    setOpenDialog(false)
    setFormData({
      nombre: '',
      apellido: '',
      telefono: '',
      email: '',
      tipoSalario: '',
      salarioBase: '',
      fechaContratacion: '',
      sucursalId: ''
    })
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) return setErrorMsg('El nombre es requerido')
    if (!formData.apellido.trim()) return setErrorMsg('El apellido es requerido')
    if (!formData.telefono.trim()) return setErrorMsg('El teléfono es requerido')
    if (!formData.email.trim()) return setErrorMsg('El email es requerido')
    if (!formData.tipoSalario) return setErrorMsg('El tipo de salario es requerido')
    if (!formData.sucursalId) return setErrorMsg('La sucursal es requerida')

    try {
      const url = editingId ? `/api/empleados/${editingId}` : '/api/empleados'
      const method = editingId ? 'PUT' : 'POST'

      const body = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono,
        email: formData.email,
        tipoSalario: formData.tipoSalario,
        salarioBase: formData.salarioBase ? parseFloat(formData.salarioBase) : null,
        fechaContratacion: formData.fechaContratacion ? new Date(formData.fechaContratacion).toISOString() : null,
        sucursalId: formData.sucursalId
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'Error saving data')

      setSuccessMsg(`Empleado ${editingId ? 'actualizado' : 'creado'} con éxito`)
      handleClose()
      fetchEmpleados()
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  const handleDelete = async (id: string, nombre: string) => {
    const isConfirmed = await confirm({
      title: 'Eliminar Empleado',
      message: `¿Estás seguro de que deseas eliminar al empleado <b>${nombre}</b>? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar'
    })

    if (!isConfirmed) return

    try {
      const res = await fetch(`/api/empleados/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'Error deleting empleado')

      setSuccessMsg('Empleado eliminado')
      fetchEmpleados()
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  const getSucursalName = (sucursalId: string) => {
    const sucursal = sucursales.find(s => s.id === sucursalId)
    return sucursal?.nombre || '-'
  }

  return (
    <Box className='w-full'>
      <Card>
        <CardHeader
          title='Gestión de Empleados'
          action={
            <Button variant='contained' onClick={() => handleOpen()} startIcon={<i className='tabler-plus' />}>
              Nuevo Empleado
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
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Tipo Salario</TableCell>
                  <TableCell>Sucursal</TableCell>
                  <TableCell align='center'>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {empleados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
                      No hay empleados registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  empleados.map(e => (
                    <TableRow key={e.id} hover>
                      <TableCell>
                        {e.nombre} {e.apellido}
                      </TableCell>
                      <TableCell>{e.telefono}</TableCell>
                      <TableCell>{e.email}</TableCell>
                      <TableCell>{e.tipoSalario}</TableCell>
                      <TableCell>{getSucursalName(e.sucursalId)}</TableCell>
                      <TableCell align='center'>
                        <IconButton color='primary' onClick={() => handleOpen(e)}>
                          <i className='tabler-edit' />
                        </IconButton>
                        <IconButton color='error' onClick={() => handleDelete(e.id, `${e.nombre} ${e.apellido}`)}>
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
        <DialogTitle>{editingId ? 'Editar Empleado' : 'Nuevo Empleado'}</DialogTitle>
        <DialogContent dividers>
          <Box display='flex' flexDirection='column' gap={2}>
            <TextField
              autoFocus
              fullWidth
              label='Nombre'
              value={formData.nombre}
              onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              placeholder='Juan'
            />
            <TextField
              fullWidth
              label='Apellido'
              value={formData.apellido}
              onChange={e => setFormData({ ...formData, apellido: e.target.value })}
              placeholder='Pérez'
            />
            <TextField
              fullWidth
              label='Teléfono'
              value={formData.telefono}
              onChange={e => setFormData({ ...formData, telefono: e.target.value })}
              placeholder='1234567890'
            />
            <TextField
              fullWidth
              label='Email'
              type='email'
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder='juan@ejemplo.com'
            />
            <FormControl fullWidth>
              <InputLabel>Tipo de Salario</InputLabel>
              <Select
                value={formData.tipoSalario}
                label='Tipo de Salario'
                onChange={e => setFormData({ ...formData, tipoSalario: e.target.value })}
              >
                {tipoSalarioOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label='Salario Base'
              type='number'
              value={formData.salarioBase}
              onChange={e => setFormData({ ...formData, salarioBase: e.target.value })}
              placeholder='0.00'
            />
            <TextField
              fullWidth
              label='Fecha de Contratación'
              type='date'
              value={formData.fechaContratacion}
              onChange={e => setFormData({ ...formData, fechaContratacion: e.target.value })}
              InputLabelProps={{ shrink: true }}
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
