'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TablePagination from '@mui/material/TablePagination'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Snackbar from '@mui/material/Snackbar'

interface Cliente {
  id: string
  nombre: string
  apellido: string
  telefono: string | null
  email: string | null
}

interface Empleado {
  id: string
  nombre: string
  apellido: string
}

interface Sucursal {
  id: string
  nombre: string
}

interface Servicio {
  id: string
  nombre: string
}

interface Cita {
  id: string
  inicio: string
  fin: string
  estado: string
  cliente: Cliente
  empleado: Empleado
  sucursal: Sucursal
  servicioCitas: { servicio: Servicio }[]
}

const ESTADOS_VALIDOS = ['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'FINALIZADA'] as const

const estadoColores: Record<string, string> = {
  PENDIENTE: '#ff9800',
  CONFIRMADA: '#2196f3',
  FINALIZADA: '#4caf50',
  CANCELADA: '#f44336'
}

const estadoLabels: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada'
}

export default function EmpresaCitasPage() {
  const { isAuthenticated, hasRole, isLoading, user, token } = useAuth()

  const [citas, setCitas] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')

  const [sucursales, setSucursales] = useState<{ id: string; nombre: string }[]>([])
  const [sucursalFiltro, setSucursalFiltro] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [fechaFiltro, setFechaFiltro] = useState('')

  // Estado para cambio de estado
  const [citaEditando, setCitaEditando] = useState<Cita | null>(null)
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [guardandoEstado, setGuardandoEstado] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' })

  const fetchCitas = async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams()
      params.append('page', String(page + 1))
      params.append('limit', String(rowsPerPage))
      if (sucursalFiltro) params.append('sucursalId', sucursalFiltro)
      if (estadoFiltro) params.append('estado', estadoFiltro)
      if (fechaFiltro) params.append('fechaInicio', fechaFiltro)

      const res = await fetch(`/api/empresa/citas?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: 'no-store'
      })
      const data = await res.json()

      if (data.success) {
        setCitas(data.data.citas)
        setTotal(data.data.pagination.total)
      } else {
        setError('Error al cargar las citas')
      }
    } catch (err) {
      setError('Error al cargar las citas')
    } finally {
      setLoading(false)
    }
  }

  const fetchSucursales = async () => {
    try {
      const res = await fetch('/api/sucursales', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success && data.data?.sucursales) {
        setSucursales(data.data.sucursales)
      }
    } catch (err) {
      console.error('Error fetching sucursales', err)
    }
  }

  useEffect(() => {
    if (isAuthenticated && hasRole('admin')) {
      fetchSucursales()
    }
  }, [isAuthenticated, hasRole])

  useEffect(() => {
    if (isAuthenticated && hasRole('admin')) {
      fetchCitas()
    }
  }, [isAuthenticated, hasRole, page, rowsPerPage, sucursalFiltro, estadoFiltro, fechaFiltro])

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const formatDateTime = (iso: string) => {
    const isoLocal = iso.endsWith('Z') ? iso.slice(0, -1) : iso
    const date = new Date(isoLocal)
    return date.toLocaleString('es-DO', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  const getServiciosLabel = (servicioCitas: { servicio: Servicio }[]) => {
    if (!servicioCitas || servicioCitas.length === 0) return '-'
    return servicioCitas.map(sc => sc.servicio.nombre).join(', ')
  }

  const abrirEditarEstado = (cita: Cita) => {
    setCitaEditando(cita)
    setNuevoEstado(cita.estado)
    setUpdateError('')
  }

  const cerrarEditarEstado = () => {
    if (guardandoEstado) return
    setCitaEditando(null)
    setNuevoEstado('')
    setUpdateError('')
  }

  const guardarEstado = async () => {
    if (!citaEditando || !nuevoEstado) return
    if (nuevoEstado === citaEditando.estado) {
      cerrarEditarEstado()
      return
    }

    setGuardandoEstado(true)
    setUpdateError('')

    try {
      const res = await fetch(`/api/citas/${citaEditando.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ estado: nuevoEstado })
      })
      const data = await res.json()

      if (data.success) {
        // Actualizamos la fila localmente sin esperar al refetch
        setCitas(prev => prev.map(c => (c.id === citaEditando.id ? { ...c, estado: nuevoEstado } : c)))
        setSnackbar({ open: true, message: 'Estado actualizado correctamente' })
        setCitaEditando(null)
        setNuevoEstado('')
        // Refrescamos también desde el servidor por consistencia
        fetchCitas()
      } else {
        setUpdateError(data.error?.message || data.message || 'No se pudo actualizar el estado')
      }
    } catch (err) {
      setUpdateError('Error al actualizar el estado')
    } finally {
      setGuardandoEstado(false)
    }
  }

  if (isLoading || !isAuthenticated || !hasRole('admin')) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='100vh'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box p={4}>
      <Typography variant='h4' gutterBottom>
        Citas de la Empresa
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Filtros
          </Typography>
          <Box display='flex' gap={2} flexWrap='wrap'>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Sucursal</InputLabel>
              <Select
                value={sucursalFiltro}
                label='Sucursal'
                onChange={e => {
                  setSucursalFiltro(e.target.value)
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

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={estadoFiltro}
                label='Estado'
                onChange={e => {
                  setEstadoFiltro(e.target.value)
                  setPage(0)
                }}
              >
                <MenuItem value=''>Todos</MenuItem>
                {ESTADOS_VALIDOS.map(estado => (
                  <MenuItem key={estado} value={estado}>
                    {estadoLabels[estado]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              type='date'
              label='Fecha'
              value={fechaFiltro}
              onChange={e => {
                setFechaFiltro(e.target.value)
                setPage(0)
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </CardContent>
      </Card>

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
            <Typography align='center' color='text.secondary'>
              No hay citas registradas
            </Typography>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Empleado</TableCell>
                      <TableCell>Fecha y Hora</TableCell>
                      <TableCell>Sucursal</TableCell>
                      <TableCell>Servicios</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align='center'>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {citas.map(cita => (
                      <TableRow key={cita.id} hover>
                        <TableCell>
                          {cita.cliente.nombre} {cita.cliente.apellido}
                          <br />
                          <Typography variant='caption' color='text.secondary'>
                            {cita.cliente.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {cita.empleado.nombre} {cita.empleado.apellido}
                        </TableCell>
                        <TableCell>{formatDateTime(cita.inicio)}</TableCell>
                        <TableCell>{cita.sucursal.nombre}</TableCell>
                        <TableCell>{getServiciosLabel(cita.servicioCitas)}</TableCell>
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
                          <Button size='small' variant='outlined' onClick={() => abrirEditarEstado(cita)}>
                            Cambiar estado
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
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25]}
                labelRowsPerPage='Filas por página'
              />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(citaEditando)} onClose={cerrarEditarEstado} maxWidth='xs' fullWidth>
        <DialogTitle>Cambiar estado de la cita</DialogTitle>
        <DialogContent dividers>
          {citaEditando && (
            <Box display='flex' flexDirection='column' gap={2}>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Cliente
                </Typography>
                <Typography variant='body1'>
                  {citaEditando.cliente.nombre} {citaEditando.cliente.apellido}
                </Typography>
              </Box>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Fecha y hora
                </Typography>
                <Typography variant='body1'>{formatDateTime(citaEditando.inicio)}</Typography>
              </Box>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Estado actual
                </Typography>
                <Chip
                  label={estadoLabels[citaEditando.estado] || citaEditando.estado}
                  size='small'
                  sx={{
                    bgcolor: estadoColores[citaEditando.estado] || '#607d8b',
                    color: 'white',
                    mt: 0.5
                  }}
                />
              </Box>

              <FormControl fullWidth sx={{ mt: 1 }}>
                <InputLabel>Nuevo estado</InputLabel>
                <Select value={nuevoEstado} label='Nuevo estado' onChange={e => setNuevoEstado(e.target.value)}>
                  {ESTADOS_VALIDOS.map(estado => (
                    <MenuItem key={estado} value={estado}>
                      {estadoLabels[estado]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {updateError && (
                <Alert severity='error' onClose={() => setUpdateError('')}>
                  {updateError}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={cerrarEditarEstado} disabled={guardandoEstado}>
            Cancelar
          </Button>
          <Button
            variant='contained'
            onClick={guardarEstado}
            disabled={guardandoEstado || !nuevoEstado || (citaEditando ? nuevoEstado === citaEditando.estado : true)}
          >
            {guardandoEstado ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Box>
  )
}
