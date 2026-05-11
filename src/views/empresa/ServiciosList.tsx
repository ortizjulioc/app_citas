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
import FormControlLabel from '@mui/material/FormControlLabel'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'
import InputAdornment from '@mui/material/InputAdornment'
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import { styled } from '@mui/material/styles'

import { useConfirmDialog } from '@/components/shared/confirm-dialog'

// Styled components for a more premium look
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    borderColor: theme.palette.primary.main,
    transition: 'border-color 0.3s ease'
  }
}))

const DurationChip = styled(Chip)(({ theme }) => ({
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText
  }
}))

interface ServicioSucursal {
  id: string
  sucursalId: string
  precio: number | null
  costo: number | null
  activo: boolean
  sucursal: {
    id: string
    nombre: string
  }
}

interface Servicio {
  id: string
  nombre: string
  descripcion: string | null
  duracionMinutos: number
  createdAt: string
  servicioSucursals: ServicioSucursal[]
}

interface Sucursal {
  id: string
  nombre: string
}

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120]

export default function ServiciosList() {
  const { confirm } = useConfirmDialog()
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Bulk action states
  const [bulkPrice, setBulkPrice] = useState('')
  const [bulkCosto, setBulkCosto] = useState('')

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    duracionMinutos: '',
    sucursales: [] as { sucursalId: string; precio: string; costo: string; activo: boolean }[]
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
        duracionMinutos: servicio.duracionMinutos.toString(),
        sucursales: servicio.servicioSucursals.map(ss => ({
          sucursalId: ss.sucursalId,
          precio: ss.precio?.toString() || '',
          costo: ss.costo?.toString() || '',
          activo: ss.activo
        }))
      })
    } else {
      setEditingId(null)
      setFormData({
        nombre: '',
        descripcion: '',
        duracionMinutos: '',
        sucursales: []
      })
    }
    setBulkPrice('')
    setBulkCosto('')
    setOpenDialog(true)
  }

  const handleClose = () => {
    setOpenDialog(false)
    setFormData({
      nombre: '',
      descripcion: '',
      duracionMinutos: '',
      sucursales: []
    })
    setEditingId(null)
  }

  const handleToggleSucursal = (sucursalId: string) => {
    const exists = formData.sucursales.find(s => s.sucursalId === sucursalId)
    if (exists) {
      setFormData({
        ...formData,
        sucursales: formData.sucursales.filter(s => s.sucursalId !== sucursalId)
      })
    } else {
      setFormData({
        ...formData,
        sucursales: [...formData.sucursales, { sucursalId, precio: bulkPrice, costo: bulkCosto, activo: true }]
      })
    }
  }

  const handleSucursalChange = (sucursalId: string, field: string, value: any) => {
    setFormData({
      ...formData,
      sucursales: formData.sucursales.map(s => (s.sucursalId === sucursalId ? { ...s, [field]: value } : s))
    })
  }

  const handleApplyBulk = () => {
    setFormData({
      ...formData,
      sucursales: formData.sucursales.map(s => ({
        ...s,
        precio: bulkPrice || s.precio,
        costo: bulkCosto || s.costo
      }))
    })
    setSuccessMsg('Valores aplicados a todas las sucursales seleccionadas')
  }

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) return setErrorMsg('El nombre es requerido')
    if (!formData.duracionMinutos.trim()) return setErrorMsg('La duración en minutos es requerida')
    if (formData.sucursales.length === 0) return setErrorMsg('Debe seleccionar al menos una sucursal')

    try {
      const url = editingId ? `/api/servicios/${editingId}` : '/api/servicios'
      const method = editingId ? 'PUT' : 'POST'

      const body = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        duracionMinutos: parseInt(formData.duracionMinutos),
        sucursales: formData.sucursales.map(s => ({
          sucursalId: s.sucursalId,
          precio: s.precio ? parseFloat(s.precio) : null,
          costo: s.costo ? parseFloat(s.costo) : null,
          activo: s.activo
        }))
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

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-'
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
      value
    )
  }

  return (
    <Box className='w-full'>
      <Card sx={{ boxShadow: 4, borderRadius: 2 }}>
        <CardHeader
          title={
            <Typography variant='h5' fontWeight='700'>
              Gestión de Servicios
            </Typography>
          }
          subheader='Administra los servicios ofrecidos en tus diferentes sucursales'
          action={
            <Button
              variant='contained'
              size='large'
              onClick={() => handleOpen()}
              startIcon={<i className='tabler-plus' />}
              sx={{ borderRadius: 2 }}
            >
              Nuevo Servicio
            </Button>
          }
          sx={{ borderBottom: 1, borderColor: 'divider', py: 3 }}
        />
        <TableContainer>
          {loading ? (
            <Box p={10} display='flex' justifyContent='center' alignItems='center' flexDirection='column' gap={2}>
              <CircularProgress size={60} thickness={4} />
              <Typography color='textSecondary'>Cargando servicios...</Typography>
            </Box>
          ) : (
            <Table>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Descripción</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Duración</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Sucursales y Precios</TableCell>
                  <TableCell align='center' sx={{ fontWeight: 'bold' }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {servicios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align='center' sx={{ py: 10 }}>
                      <Box display='flex' flexDirection='column' alignItems='center' gap={2}>
                        <i className='tabler-clipboard-off' style={{ fontSize: '3rem', opacity: 0.3 }} />
                        <Typography color='textSecondary' variant='h6'>
                          No hay servicios registrados
                        </Typography>
                        <Button variant='outlined' onClick={() => handleOpen()}>
                          Crear mi primer servicio
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  servicios.map(s => (
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
                            <i className='tabler-scissors' />
                          </Box>
                          <Typography variant='body1' fontWeight='600'>
                            {s.nombre}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant='body2'
                          color='textSecondary'
                          sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {s.descripcion || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<i className='tabler-clock' />}
                          label={`${s.duracionMinutos} min`}
                          size='small'
                          variant='outlined'
                          color='primary'
                        />
                      </TableCell>
                      <TableCell>
                        <Box display='flex' flexWrap='wrap' gap={1}>
                          {s.servicioSucursals.map(ss => (
                            <Tooltip key={ss.id} title={ss.activo ? 'Activo' : 'Inactivo'} arrow>
                              <span>
                                <Chip
                                  size='small'
                                  label={`${ss.sucursal.nombre}: ${formatCurrency(ss.precio)}`}
                                  color={ss.activo ? 'success' : 'default'}
                                  variant={ss.activo ? 'tonal' : 'outlined'}
                                  sx={{ borderRadius: 1 }}
                                />
                              </span>
                            </Tooltip>
                          ))}
                        </Box>
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
              {editingId ? 'Editar Servicio' : 'Nuevo Servicio'}
            </Typography>
            <Typography variant='caption' color='textSecondary'>
              Configura los detalles del servicio y su disponibilidad
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 4 }}>
          <Grid container spacing={4}>
            {/* Left Side: General Info */}
            <Grid size={{ xs: 12, md: 5 }}>
              <StyledPaper elevation={0}>
                <Box display='flex' flexDirection='column' gap={3}>
                  <Box display='flex' alignItems='center' gap={1}>
                    <i className='tabler-info-circle' style={{ color: 'var(--mui-palette-primary-main)' }} />
                    <Typography variant='h6' fontWeight='600'>
                      Información Básica
                    </Typography>
                  </Box>

                  <TextField
                    autoFocus
                    fullWidth
                    label='Nombre del Servicio'
                    value={formData.nombre}
                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder='Ej: Corte de Cabello Caballero'
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <i className='tabler-tag' />
                        </InputAdornment>
                      )
                    }}
                  />

                  <TextField
                    fullWidth
                    label='Descripción'
                    value={formData.descripcion}
                    onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder='Explica brevemente qué incluye el servicio...'
                    multiline
                    rows={4}
                  />

                  <Box>
                    <Typography
                      variant='body2'
                      gutterBottom
                      sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                    >
                      <i className='tabler-clock' /> Duración Estimada
                    </Typography>
                    <TextField
                      fullWidth
                      type='number'
                      value={formData.duracionMinutos}
                      onChange={e => setFormData({ ...formData, duracionMinutos: e.target.value })}
                      placeholder='30'
                      InputProps={{
                        endAdornment: <InputAdornment position='end'>minutos</InputAdornment>
                      }}
                      sx={{ mb: 2 }}
                    />
                    <Box display='flex' flexWrap='wrap' gap={1}>
                      {DURATION_PRESETS.map(preset => (
                        <DurationChip
                          key={preset}
                          label={`${preset} min`}
                          onClick={() => setFormData({ ...formData, duracionMinutos: preset.toString() })}
                          color={formData.duracionMinutos === preset.toString() ? 'primary' : 'default'}
                          variant={formData.duracionMinutos === preset.toString() ? 'filled' : 'outlined'}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              </StyledPaper>
            </Grid>

            {/* Right Side: Branch Settings */}
            <Grid size={{ xs: 12, md: 7 }}>
              <StyledPaper elevation={0}>
                <Box display='flex' flexDirection='column' gap={3}>
                  <Box display='flex' justifyContent='space-between' alignItems='center'>
                    <Box display='flex' alignItems='center' gap={1}>
                      <i className='tabler-building-store' style={{ color: 'var(--mui-palette-primary-main)' }} />
                      <Typography variant='h6' fontWeight='600'>
                        Disponibilidad y Precios
                      </Typography>
                    </Box>
                  </Box>

                  {/* Bulk Tool */}
                  <Box
                    sx={{
                      bgcolor: 'action.hover',
                      p: 2,
                      borderRadius: 2,
                      border: '1px dashed',
                      borderColor: 'divider'
                    }}
                  >
                    <Typography variant='subtitle2' gutterBottom fontWeight='600'>
                      Asignación Rápida
                    </Typography>
                    <Typography variant='caption' color='textSecondary' display='block' sx={{ mb: 2 }}>
                      Ingresa valores aquí para aplicarlos a todas las sucursales seleccionadas
                    </Typography>
                    <Grid container spacing={2} alignItems='center'>
                      <Grid size={{ xs: 5 }}>
                        <TextField
                          label='Precio Global'
                          size='small'
                          type='number'
                          value={bulkPrice}
                          onChange={e => setBulkPrice(e.target.value)}
                          fullWidth
                          InputProps={{ startAdornment: <InputAdornment position='start'>$</InputAdornment> }}
                        />
                      </Grid>
                      <Grid size={{ xs: 5 }}>
                        <TextField
                          label='Costo Global'
                          size='small'
                          type='number'
                          value={bulkCosto}
                          onChange={e => setBulkCosto(e.target.value)}
                          fullWidth
                          InputProps={{ startAdornment: <InputAdornment position='start'>$</InputAdornment> }}
                        />
                      </Grid>
                      <Grid size={{ xs: 2 }}>
                        <Tooltip title='Aplicar a seleccionados'>
                          <span>
                            <IconButton color='primary' onClick={handleApplyBulk} disabled={!bulkPrice && !bulkCosto}>
                              <i className='tabler-check' />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  </Box>

                  <Divider />

                  <Box maxHeight={400} sx={{ overflowY: 'auto', pr: 1 }}>
                    <Typography variant='caption' color='textSecondary' sx={{ mb: 2, display: 'block' }}>
                      Selecciona las sucursales donde se ofrecerá este servicio:
                    </Typography>

                    {sucursales.map(sucursal => {
                      const ss = formData.sucursales.find(s => s.sucursalId === sucursal.id)
                      const isSelected = !!ss

                      return (
                        <Box
                          key={sucursal.id}
                          sx={{
                            mb: 2,
                            p: 2,
                            borderRadius: 2,
                            border: 1,
                            borderColor: isSelected ? 'primary.main' : 'divider',
                            bgcolor: isSelected ? 'primary.lighter' : 'transparent',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <Box display='flex' justifyContent='space-between' alignItems='center'>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={isSelected}
                                  onChange={() => handleToggleSucursal(sucursal.id)}
                                  color='primary'
                                />
                              }
                              label={<Typography fontWeight={isSelected ? '600' : '400'}>{sucursal.nombre}</Typography>}
                            />
                            {isSelected && (
                              <Chip
                                size='small'
                                label={ss.activo ? 'Habilitado' : 'Deshabilitado'}
                                color={ss.activo ? 'success' : 'error'}
                                variant='tonal'
                              />
                            )}
                          </Box>

                          {isSelected && (
                            <Box mt={2} display='flex' flexDirection='column' gap={2}>
                              <Grid container spacing={2}>
                                <Grid size={{ xs: 6 }}>
                                  <TextField
                                    label='Precio'
                                    size='small'
                                    type='number'
                                    value={ss.precio}
                                    onChange={e => handleSucursalChange(sucursal.id, 'precio', e.target.value)}
                                    fullWidth
                                    InputProps={{ startAdornment: <InputAdornment position='start'>$</InputAdornment> }}
                                  />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                  <TextField
                                    label='Costo'
                                    size='small'
                                    type='number'
                                    value={ss.costo}
                                    onChange={e => handleSucursalChange(sucursal.id, 'costo', e.target.value)}
                                    fullWidth
                                    InputProps={{ startAdornment: <InputAdornment position='start'>$</InputAdornment> }}
                                  />
                                </Grid>
                              </Grid>
                              <Box display='flex' justifyContent='space-between' alignItems='center'>
                                <Typography variant='caption' color='textSecondary'>
                                  Permitir reservas en esta sucursal
                                </Typography>
                                <Switch
                                  size='small'
                                  checked={ss.activo}
                                  onChange={e => handleSucursalChange(sucursal.id, 'activo', e.target.checked)}
                                />
                              </Box>
                            </Box>
                          )}
                        </Box>
                      )
                    })}
                  </Box>
                </Box>
              </StyledPaper>
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
            {editingId ? 'Guardar Cambios' : 'Crear Servicio'}
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
