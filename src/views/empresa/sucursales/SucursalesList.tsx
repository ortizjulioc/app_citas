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
import Switch from '@mui/material/Switch'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import { styled } from '@mui/material/styles'

import { useConfirmDialog } from '@/components/shared/confirm-dialog'
import BusinessHoursDisplay from '@/components/empresa/BusinessHoursDisplay'

// Types
const DIAS_SEMANA = [
  { key: 'LUNES', label: 'Lunes' },
  { key: 'MARTES', label: 'Martes' },
  { key: 'MIERCOLES', label: 'Miércoles' },
  { key: 'JUEVES', label: 'Jueves' },
  { key: 'VIERNES', label: 'Viernes' },
  { key: 'SABADO', label: 'Sábado' },
  { key: 'DOMINGO', label: 'Domingo' }
]

interface Horario {
  diaSemana: string
  horaInicio: string
  horaFin: string
  activo: boolean
}

interface Sucursal {
  id: string
  nombre: string
  negocioId: string
  createdAt: string
  horarioSucursals: {
    diaSemana: string
    horaInicio: string
    horaFin: string
    activo: boolean
  }[]
}

// Styled components
const DayRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2, 0),
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&:last-child': {
    borderBottom: 'none'
  }
}))

export default function SucursalesList() {
  const { confirm } = useConfirmDialog()
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nombre: '',
    horarios: DIAS_SEMANA.map(d => ({
      diaSemana: d.key,
      horaInicio: '08:00',
      horaFin: '18:00',
      activo: true
    }))
  })

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const formatTimeFromDB = (dateStr: string) => {
    if (!dateStr) return '08:00'
    const date = new Date(dateStr)
    return date.toISOString().substring(11, 16)
  }

  const fetchSucursales = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/sucursales?limit=100')
      const json = await res.json()
      if (res.ok) {
        setSucursales(json.data?.sucursales || [])
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
  }, [])

  const handleOpen = (sucursal?: Sucursal) => {
    if (sucursal) {
      setEditingId(sucursal.id)

      // Map existing horarios or use defaults
      const existingHorarios = DIAS_SEMANA.map(d => {
        const found = sucursal.horarioSucursals.find(h => h.diaSemana === d.key)
        return {
          diaSemana: d.key,
          horaInicio: found ? formatTimeFromDB(found.horaInicio) : '08:00',
          horaFin: found ? formatTimeFromDB(found.horaFin) : '18:00',
          activo: found ? found.activo : false
        }
      })

      setFormData({
        nombre: sucursal.nombre,
        horarios: existingHorarios
      })
    } else {
      setEditingId(null)
      setFormData({
        nombre: '',
        horarios: DIAS_SEMANA.map(d => ({
          diaSemana: d.key,
          horaInicio: '08:00',
          horaFin: '18:00',
          activo: true
        }))
      })
    }
    setOpenDialog(true)
  }

  const handleClose = () => {
    setOpenDialog(false)
    setEditingId(null)
  }

  const handleDayToggle = (index: number) => {
    const newHorarios = [...formData.horarios]
    newHorarios[index].activo = !newHorarios[index].activo
    setFormData({ ...formData, horarios: newHorarios })
  }

  const handleTimeChange = (index: number, field: 'horaInicio' | 'horaFin', value: string) => {
    const newHorarios = [...formData.horarios]
    newHorarios[index][field] = value
    setFormData({ ...formData, horarios: newHorarios })
  }

  const handleCopyTimes = (index: number) => {
    const source = formData.horarios[index]
    const newHorarios = formData.horarios.map(h => ({
      ...h,
      horaInicio: source.horaInicio,
      horaFin: source.horaFin
    }))
    setFormData({ ...formData, horarios: newHorarios })
    setSuccessMsg('Horarios copiados a todos los días')
  }

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) return setErrorMsg('El nombre es requerido')

    try {
      const url = editingId ? `/api/sucursales/${editingId}` : '/api/sucursales'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'Error saving data')

      setSuccessMsg(`Sucursal ${editingId ? 'actualizada' : 'creada'} con éxito`)
      handleClose()
      fetchSucursales()
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  const handleDelete = async (id: string, nombre: string) => {
    const isConfirmed = await confirm({
      title: 'Eliminar Sucursal',
      message: `¿Estás seguro de que deseas eliminar la sucursal <b>${nombre}</b>? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar'
    })

    if (!isConfirmed) return

    try {
      const res = await fetch(`/api/sucursales/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'Error deleting sucursal')

      setSuccessMsg('Sucursal eliminada')
      fetchSucursales()
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  return (
    <Box className='w-full'>
      <Card sx={{ boxShadow: 4, borderRadius: 2 }}>
        <CardHeader
          title={
            <Typography variant='h5' fontWeight='700'>
              Gestión de Sucursales
            </Typography>
          }
          subheader='Configura tus sedes y sus horarios de atención'
          action={
            <Button
              variant='contained'
              size='large'
              onClick={() => handleOpen()}
              startIcon={<i className='tabler-plus' />}
              sx={{ borderRadius: 2 }}
            >
              Nueva Sucursal
            </Button>
          }
          sx={{ borderBottom: 1, borderColor: 'divider', py: 3 }}
        />
        <TableContainer>
          {loading ? (
            <Box p={10} display='flex' justifyContent='center' alignItems='center' flexDirection='column' gap={2}>
              <CircularProgress size={60} thickness={4} />
              <Typography color='textSecondary'>Cargando sucursales...</Typography>
            </Box>
          ) : (
            <Table>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Horarios Activos</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Fecha Registro</TableCell>
                  <TableCell align='center' sx={{ fontWeight: 'bold' }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sucursales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align='center' sx={{ py: 10 }}>
                      <Box display='flex' flexDirection='column' alignItems='center' gap={2}>
                        <i className='tabler-building-off' style={{ fontSize: '3rem', opacity: 0.3 }} />
                        <Typography color='textSecondary' variant='h6'>
                          No hay sucursales registradas
                        </Typography>
                        <Button variant='outlined' onClick={() => handleOpen()}>
                          Crear mi primera sucursal
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  sucursales.map(s => (
                    <TableRow key={s.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Box display='flex' alignItems='center' gap={2}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 1,
                              bgcolor: 'primary.light',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'primary.contrastText'
                            }}
                          >
                            <i className='tabler-building-store' />
                          </Box>
                          <Typography variant='body1' fontWeight='600'>
                            {s.nombre}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <BusinessHoursDisplay horarios={s.horarioSucursals} />
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' color='textSecondary'>
                          {new Date(s.createdAt).toLocaleDateString('es-DO', { dateStyle: 'medium' })}
                        </Typography>
                      </TableCell>
                      <TableCell align='center'>
                        <Box display='flex' justifyContent='center' gap={1}>
                          <IconButton color='primary' onClick={() => handleOpen(s)} sx={{ bgcolor: 'primary.lighter' }}>
                            <i className='tabler-edit' />
                          </IconButton>
                          <IconButton
                            color='error'
                            onClick={() => handleDelete(s.id, s.nombre)}
                            sx={{ bgcolor: 'error.lighter' }}
                          >
                            <i className='tabler-trash' />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Card>

      <Dialog
        open={openDialog}
        onClose={handleClose}
        fullWidth
        maxWidth='md'
        scroll='body'
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: editingId ? 'primary.main' : 'success.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}
          >
            <i className={editingId ? 'tabler-edit' : 'tabler-plus'} style={{ fontSize: '1.5rem' }} />
          </Box>
          <Box>
            <Typography variant='h5' fontWeight='700'>
              {editingId ? 'Editar Sucursal' : 'Nueva Sucursal'}
            </Typography>
            <Typography variant='caption' color='textSecondary'>
              Define el nombre y los horarios de operación
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 4 }}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box display='flex' flexDirection='column' gap={3}>
                <Typography variant='h6' fontWeight='600' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <i className='tabler-info-circle' style={{ color: 'var(--mui-palette-primary-main)' }} />
                  Información Básica
                </Typography>
                <TextField
                  autoFocus
                  fullWidth
                  label='Nombre de la Sucursal'
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder='Ej: Sede Norte'
                  helperText='Nombre que identificarán tus clientes'
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <Paper variant='outlined' sx={{ p: 3, borderRadius: 2, bgcolor: 'action.hover' }}>
                <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
                  <Typography variant='h6' fontWeight='600' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <i className='tabler-clock' style={{ color: 'var(--mui-palette-primary-main)' }} />
                    Horarios de Atención
                  </Typography>
                </Box>

                <Box>
                  {formData.horarios.map((horario, index) => (
                    <DayRow key={horario.diaSemana}>
                      <Box sx={{ width: 100 }}>
                        <Typography variant='body1' fontWeight='600'>
                          {DIAS_SEMANA[index].label}
                        </Typography>
                      </Box>

                      <Switch checked={horario.activo} onChange={() => handleDayToggle(index)} color='primary' />

                      <Box
                        display='flex'
                        alignItems='center'
                        gap={2}
                        ml={2}
                        sx={{ opacity: horario.activo ? 1 : 0.4, pointerEvents: horario.activo ? 'auto' : 'none' }}
                      >
                        <TextField
                          type='time'
                          size='small'
                          value={horario.horaInicio}
                          onChange={e => handleTimeChange(index, 'horaInicio', e.target.value)}
                          sx={{ width: 130 }}
                        />
                        <Typography variant='caption'>a</Typography>
                        <TextField
                          type='time'
                          size='small'
                          value={horario.horaFin}
                          onChange={e => handleTimeChange(index, 'horaFin', e.target.value)}
                          sx={{ width: 130 }}
                        />

                        <Tooltip title='Copiar este horario a todos los días'>
                          <IconButton size='small' color='primary' onClick={() => handleCopyTimes(index)}>
                            <i className='tabler-copy' />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      {!horario.activo && (
                        <Typography variant='caption' color='textSecondary' sx={{ ml: 2, fontStyle: 'italic' }}>
                          Cerrado
                        </Typography>
                      )}
                    </DayRow>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 4, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={handleClose} color='secondary' variant='outlined' sx={{ borderRadius: 2 }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant='contained'
            size='large'
            sx={{ borderRadius: 2, minWidth: 150 }}
            startIcon={<i className='tabler-device-floppy' />}
          >
            {editingId ? 'Guardar Cambios' : 'Crear Sucursal'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!errorMsg}
        autoHideDuration={6000}
        onClose={() => setErrorMsg(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity='error' variant='filled' onClose={() => setErrorMsg(null)} sx={{ borderRadius: 2 }}>
          {errorMsg}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!successMsg}
        autoHideDuration={6000}
        onClose={() => setSuccessMsg(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity='success' variant='filled' onClose={() => setSuccessMsg(null)} sx={{ borderRadius: 2 }}>
          {successMsg}
        </Alert>
      </Snackbar>
    </Box>
  )
}
