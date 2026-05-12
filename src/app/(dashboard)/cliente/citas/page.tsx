'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TablePagination from '@mui/material/TablePagination'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemIcon from '@mui/material/ListItemIcon'

interface Cita {
  id: string
  inicio: string
  fin: string
  estado: string
  empleado: { id: string; nombre: string; apellido: string }
  sucursal: {
    id: string
    nombre: string
    negocio: { id: string; nombre: string; telefono: string | null; email: string | null }
  }
  servicioCitas: {
    servicio: { id: string; nombre: string; duracionMinutos: number }
  }[]
}

interface HorarioSlot {
  empleado: { id: string; nombre: string; apellido: string }
  disponible: boolean
  horarios: { inicio: string; fin: string }[]
}

interface Disponibilidad {
  disponibles: boolean
  empleados: HorarioSlot[]
}

const estadoColores: Record<string, string> = {
  PENDIENTE: '#ff9800',
  CONFIRMADA: '#2196f3',
  CANCELADA: '#f44336',
  FINALIZADA: '#4caf50'
}

const estadoLabels: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  FINALIZADA: 'Finalizada'
}

export default function ClienteCitasPage() {
  const { isAuthenticated, hasRole, isLoading, user, token } = useAuth()
  const router = useRouter()

  const [citas, setCitas] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')

  const [selectedCita, setSelectedCita] = useState<Cita | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  const [postponeOpen, setPostponeOpen] = useState(false)
  const [newFecha, setNewFecha] = useState('')
  const [newDisponibilidad, setNewDisponibilidad] = useState<Disponibilidad | null>(null)
  const [loadingDisponibilidad, setLoadingDisponibilidad] = useState(false)
  const [newHorario, setNewHorario] = useState<{ inicio: string; fin: string } | null>(null)
  const [submittingPostpone, setSubmittingPostpone] = useState(false)

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !hasRole('cliente'))) {
      router.push('/login')
    }
  }, [isAuthenticated, hasRole, isLoading, router])

  const fetchCitas = async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.append('page', String(page + 1))
      params.append('limit', String(rowsPerPage))
      const res = await fetch(`/api/cliente/citas?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      })
      const data = await res.json()
      if (data.success) {
        setCitas(data.data.citas)
        setTotal(data.data.pagination.total)
      } else {
        setError('Error al cargar las citas')
      }
    } catch {
      setError('Error al cargar las citas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && hasRole('cliente') && token) {
      fetchCitas()
    }
  }, [isAuthenticated, hasRole, token, page, rowsPerPage])

  const fetchNewDisponibilidad = async () => {
    if (!selectedCita || !newFecha) return
    setLoadingDisponibilidad(true)
    setNewDisponibilidad(null)
    setNewHorario(null)
    setActionError('')
    try {
      const duracion = selectedCita.servicioCitas[0]?.servicio.duracionMinutos || 60
      const res = await fetch(`/api/public/sucursales/${selectedCita.sucursal.id}/disponibilidad?fecha=${newFecha}&duracion=${duracion}`)
      const data = await res.json()
      if (data.success) {
        setNewDisponibilidad(data.data)
      } else {
        setActionError('Error al obtener disponibilidad')
      }
    } catch {
      setActionError('Error al obtener disponibilidad')
    } finally {
      setLoadingDisponibilidad(false)
    }
  }

  const handleCancelar = async () => {
    if (!selectedCita || !token) return
    setActionLoading(true)
    setActionError('')
    try {
      const res = await fetch(`/api/cliente/citas/${selectedCita.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accion: 'cancelar' })
      })
      const data = await res.json()
      if (data.success) {
        setDetailOpen(false)
        fetchCitas()
      } else {
        setActionError(data.error?.message || data.message || 'Error al cancelar la cita')
      }
    } catch {
      setActionError('Error al cancelar la cita')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePostponer = async () => {
    if (!selectedCita || !newHorario || !token) return
    setSubmittingPostpone(true)
    setActionError('')
    try {
      const res = await fetch(`/api/cliente/citas/${selectedCita.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          accion: 'posponer',
          inicio: newHorario.inicio,
          fin: newHorario.fin
        })
      })
      const data = await res.json()
      if (data.success) {
        setPostponeOpen(false)
        setDetailOpen(false)
        fetchCitas()
      } else {
        setActionError(data.error?.message || data.message || 'Error al reprogramar la cita')
      }
    } catch {
      setActionError('Error al reprogramar la cita')
    } finally {
      setSubmittingPostpone(false)
    }
  }

  const openDetail = (cita: Cita) => {
    setSelectedCita(cita)
    setActionError('')
    setDetailOpen(true)
  }

  const openPostpone = () => {
    setNewFecha('')
    setNewDisponibilidad(null)
    setNewHorario(null)
    setActionError('')
    setPostponeOpen(true)
  }

  const formatDateTime = (iso: string) => {
    const date = new Date(iso)
    return date.toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' })
  }

  const canCancel = (cita: Cita) => {
    const now = new Date()
    const citaTime = new Date(cita.inicio)
    return citaTime.getTime() - now.getTime() > 4 * 60 * 60 * 1000 &&
      (cita.estado === 'PENDIENTE' || cita.estado === 'CONFIRMADA')
  }

  const canPostpone = (cita: Cita) => {
    return cita.estado === 'PENDIENTE'
  }

  const getMinDate = () => new Date().toISOString().split('T')[0]

  if (isLoading || !isAuthenticated || !hasRole('cliente')) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='100vh'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box p={4}>
      <Box display='flex' justifyContent='space-between' alignItems='center' mb={2} flexWrap='wrap' gap={2}>
        <Typography variant='h4'>
          Mis Citas
        </Typography>
        <Button
          variant='outlined'
          size='small'
          onClick={fetchCitas}
          disabled={loading}
          startIcon={<i className='tabler-refresh' />}
        >
          Actualizar
        </Button>
      </Box>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {loading ? (
            <Box display='flex' justifyContent='center' py={4}>
              <CircularProgress />
            </Box>
          ) : citas.length === 0 ? (
            <Box py={4} textAlign='center'>
              <i className='tabler-calendar-off' style={{ fontSize: 48, color: '#bdbdbd' }} />
              <Typography color='text.secondary' mt={2}>
                No tienes citas programadas
              </Typography>
              <Button
                variant='contained'
                sx={{ mt: 2 }}
                onClick={() => router.push('/cliente/empresas')}
              >
                Explorar empresas
              </Button>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha y Hora</TableCell>
                      <TableCell>Empresa</TableCell>
                      <TableCell>Sucursal</TableCell>
                      <TableCell>Servicio</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align='center'>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {citas.map((cita) => (
                      <TableRow key={cita.id} hover>
                        <TableCell>{formatDateTime(cita.inicio)}</TableCell>
                        <TableCell>{cita.sucursal.negocio.nombre}</TableCell>
                        <TableCell>{cita.sucursal.nombre}</TableCell>
                        <TableCell>
                          {cita.servicioCitas.map((sc) => sc.servicio.nombre).join(', ') || '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={estadoLabels[cita.estado] || cita.estado}
                            size='small'
                            sx={{
                              bgcolor: estadoColores[cita.estado] || '#607d8b',
                              color: 'white'
                            }}
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Button size='small' onClick={() => openDetail(cita)}>
                            Ver detalles
                          </Button>
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
                rowsPerPageOptions={[5, 10, 25]}
                labelRowsPerPage='Filas por página'
              />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Detalles de la Cita
          <IconButton onClick={() => setDetailOpen(false)} size='small'>
            <i className='tabler-x' />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedCita && (
            <Box>
              <Chip
                label={estadoLabels[selectedCita.estado] || selectedCita.estado}
                size='small'
                sx={{
                  mb: 2,
                  bgcolor: estadoColores[selectedCita.estado] || '#607d8b',
                  color: 'white'
                }}
              />

              <List dense>
                <ListItem>
                  <ListItemIcon><i className='tabler-calendar' /></ListItemIcon>
                  <ListItemText primary='Fecha y Hora' secondary={formatDateTime(selectedCita.inicio)} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><i className='tabler-building' /></ListItemIcon>
                  <ListItemText primary='Empresa' secondary={selectedCita.sucursal.negocio.nombre} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><i className='tabler-building-store' /></ListItemIcon>
                  <ListItemText primary='Sucursal' secondary={selectedCita.sucursal.nombre} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><i className='tabler-user' /></ListItemIcon>
                  <ListItemText primary='Empleado' secondary={`${selectedCita.empleado.nombre} ${selectedCita.empleado.apellido}`} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><i className='tabler-scissors' /></ListItemIcon>
                  <ListItemText primary='Servicio' secondary={selectedCita.servicioCitas.map((sc) => sc.servicio.nombre).join(', ') || '-'} />
                </ListItem>
                {selectedCita.sucursal.negocio.telefono && (
                  <ListItem>
                    <ListItemIcon><i className='tabler-phone' /></ListItemIcon>
                    <ListItemText primary='Teléfono del negocio' secondary={selectedCita.sucursal.negocio.telefono} />
                  </ListItem>
                )}
              </List>

              {actionError && (
                <Alert severity='error' sx={{ mt: 2 }} onClose={() => setActionError('')}>
                  {actionError}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          {selectedCita && (
            <>
              {canCancel(selectedCita) && (
                <Button color='error' variant='outlined' onClick={handleCancelar} disabled={actionLoading}>
                  {actionLoading ? 'Cancelando...' : 'Cancelar Cita'}
                </Button>
              )}
              {canPostpone(selectedCita) && (
                <Button color='primary' variant='contained' onClick={openPostpone}>
                  Posponer
                </Button>
              )}
              <Box flexGrow={1} />
              <Button onClick={() => setDetailOpen(false)}>Cerrar</Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={postponeOpen} onClose={() => setPostponeOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Reprogramar Cita
          <IconButton onClick={() => setPostponeOpen(false)} size='small'>
            <i className='tabler-x' />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box display='flex' flexDirection='column' gap={3}>
            <TextField
              fullWidth
              type='date'
              label='Nueva Fecha'
              value={newFecha}
              onChange={(e) => {
                setNewFecha(e.target.value)
                setNewDisponibilidad(null)
                setNewHorario(null)
              }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: getMinDate() }}
            />

            {newFecha && (
              <Button variant='contained' onClick={fetchNewDisponibilidad} disabled={loadingDisponibilidad}>
                {loadingDisponibilidad ? 'Buscando...' : 'Ver horarios disponibles'}
              </Button>
            )}

            {loadingDisponibilidad && (
              <Box display='flex' justifyContent='center' py={2}>
                <CircularProgress size={24} />
              </Box>
            )}

            {newDisponibilidad && !loadingDisponibilidad && (
              !newDisponibilidad.disponibles ? (
                <Alert severity='info'>No hay horarios disponibles para esta fecha</Alert>
              ) : (
                <FormControl component='fieldset' fullWidth>
                  <Typography variant='subtitle2' gutterBottom>
                    Selecciona un nuevo horario:
                  </Typography>
                  <RadioGroup
                    value={newHorario ? `${newHorario.inicio}|${newHorario.fin}` : ''}
                    onChange={(e) => {
                      const [inicio, fin] = e.target.value.split('|')
                      setNewHorario({ inicio, fin })
                    }}
                  >
                    {newDisponibilidad.empleados
                      .filter((e) => e.disponible)
                      .flatMap((e) =>
                        e.horarios.slice(0, 5).map((h) => (
                          <FormControlLabel
                            key={h.inicio}
                            value={`${h.inicio}|${h.fin}`}
                            control={<Radio />}
                            label={`${formatDateTime(h.inicio)} - ${e.empleado.nombre} ${e.empleado.apellido}`}
                          />
                        ))
                      )}
                  </RadioGroup>
                </FormControl>
              )
            )}

            {actionError && (
              <Alert severity='error' onClose={() => setActionError('')}>
                {actionError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setPostponeOpen(false)}>Cancelar</Button>
          <Button
            variant='contained'
            color='primary'
            onClick={handlePostponer}
            disabled={!newHorario || submittingPostpone}
          >
            {submittingPostpone ? 'Guardando...' : 'Confirmar Reprogramación'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
