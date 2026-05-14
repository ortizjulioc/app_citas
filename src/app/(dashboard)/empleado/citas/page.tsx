'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Menu from '@mui/material/Menu'
import Grid from '@mui/material/Grid'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Pagination from '@mui/material/Pagination'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'

interface Cita {
  id: string
  inicio: string
  fin: string
  estado: string
  cliente: {
    id: string
    nombre: string
    apellido: string
    telefono: string | null
    email: string | null
  }
  sucursal: {
    id: string
    nombre: string
  }
  servicioCitas: {
    servicio: {
      id: string
      nombre: string
      duracionMinutos: number
    }
  }[]
}

const estadoColores: Record<string, string> = {
  PENDIENTE: '#ff9800',
  CONFIRMADA: '#4caf50',
  CANCELADA: '#f44336',
  FINALIZADA: '#2196f3'
}

export default function EmpleadoCitasPage() {
  const { user, isAuthenticated, hasRole, isLoading } = useAuth()
  const router = useRouter()

  const [citas, setCitas] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [estado, setEstado] = useState('')

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedCitaId, setSelectedCitaId] = useState<string | null>(null)

  const fetchCitas = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      if (estado) params.set('estado', estado)

      const res = await fetch(`/api/empleados/citas?${params}`)
      const data = await res.json()

      if (data.success) {
        setCitas(data.data.citas)
        setTotalPages(data.data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching citas:', error)
    } finally {
      setLoading(false)
    }
  }, [page, estado])

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !hasRole('empleado'))) {
      router.push('/login')
    }
  }, [isAuthenticated, hasRole, isLoading, router])

  useEffect(() => {
    if (isAuthenticated && hasRole('empleado')) {
      fetchCitas()
    }
  }, [isAuthenticated, hasRole, fetchCitas])

  if (isLoading || !isAuthenticated || !hasRole('empleado')) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='100vh'>
        <CircularProgress />
      </Box>
    )
  }

  const formatDateTime = (iso: string) => {
    const isoLocal = iso.endsWith('Z') ? iso.slice(0, -1) : iso
    const date = new Date(isoLocal)
    return date.toLocaleString('es-DO', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  const handleStatusClick = (event: React.MouseEvent<HTMLElement>, citaId: string) => {
    setAnchorEl(event.currentTarget)
    setSelectedCitaId(citaId)
  }

  const handleStatusClose = () => {
    setAnchorEl(null)
    setSelectedCitaId(null)
  }

  const handleStatusChangeSubmit = async (newEstado: string) => {
    if (!selectedCitaId) return
    try {
      const res = await fetch(`/api/citas/${selectedCitaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newEstado })
      })
      if (res.ok) {
        fetchCitas()
      }
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      handleStatusClose()
    }
  }

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      CONFIRMADA: 'Confirmada',
      CANCELADA: 'Cancelada',
      FINALIZADA: 'Finalizada'
    }
    return labels[estado] || estado
  }

  const upcomingCitas = citas.filter(
    c => new Date(c.inicio) >= new Date() && c.estado !== 'CANCELADA' && c.estado !== 'FINALIZADA'
  )
  const pastCitas = citas.filter(
    c => new Date(c.inicio) < new Date() || c.estado === 'CANCELADA' || c.estado === 'FINALIZADA'
  )

  return (
    <Box p={4}>
      <Typography variant='h4' gutterBottom>
        Mis Citas
      </Typography>
      {user && (
        <Typography variant='h6' color='primary' sx={{ mb: 1, fontWeight: 'bold' }}>
          Agenda de:{' '}
          <Chip
            variant='outlined'
            color='primary'
            label={`${user.nombre} ${user.apellido}`}
            onClick={() => router.push('/perfil-usuario')}
            sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
          />
        </Typography>
      )}
      <Typography variant='body1' color='text.secondary' sx={{ mb: 4 }}>
        Aquí puedes ver todas tus citas programadas
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Filtrar por estado</InputLabel>
            <Select
              value={estado}
              label='Filtrar por estado'
              onChange={e => {
                setEstado(e.target.value)
                setPage(1)
              }}
            >
              <MenuItem value=''>Todos</MenuItem>
              <MenuItem value='PENDIENTE'>Pendiente</MenuItem>
              <MenuItem value='CONFIRMADA'>Confirmada</MenuItem>
              <MenuItem value='CANCELADA'>Cancelada</MenuItem>
              <MenuItem value='FINALIZADA'>Finalizada</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {loading ? (
        <Box display='flex' justifyContent='center' py={8}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography variant='h5' sx={{ mb: 2 }}>
            Próximas Citas ({upcomingCitas.length})
          </Typography>

          {upcomingCitas.length === 0 ? (
            <Alert severity='info' sx={{ mb: 4 }}>
              No tienes citas próximas
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ mb: 4 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha y Hora</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Sucursal</TableCell>
                    <TableCell>Servicios</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {upcomingCitas.map(cita => (
                    <TableRow key={cita.id}>
                      <TableCell>{formatDateTime(cita.inicio)}</TableCell>
                      <TableCell>
                        {cita.cliente.nombre} {cita.cliente.apellido}
                        <br />
                        <Typography variant='caption' color='text.secondary'>
                          {cita.cliente.telefono || cita.cliente.email}
                        </Typography>
                      </TableCell>
                      <TableCell>{cita.sucursal.nombre}</TableCell>
                      <TableCell>
                        {cita.servicioCitas.map(sc => sc.servicio.nombre).join(', ') || 'Sin servicios'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getEstadoLabel(cita.estado)}
                          size='small'
                          onClick={e => handleStatusClick(e, cita.id)}
                          sx={{
                            bgcolor: estadoColores[cita.estado] || '#607d8b',
                            color: 'white',
                            cursor: 'pointer',
                            '&:hover': { opacity: 0.8 }
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Typography variant='h5' sx={{ mb: 2 }}>
            Citas Pasadas ({pastCitas.length})
          </Typography>

          {pastCitas.length === 0 ? (
            <Alert severity='info'>No tienes citas pasadas</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha y Hora</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Sucursal</TableCell>
                    <TableCell>Servicios</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pastCitas.map(cita => (
                    <TableRow key={cita.id}>
                      <TableCell>{formatDateTime(cita.inicio)}</TableCell>
                      <TableCell>
                        {cita.cliente.nombre} {cita.cliente.apellido}
                        <br />
                        <Typography variant='caption' color='text.secondary'>
                          {cita.cliente.telefono || cita.cliente.email}
                        </Typography>
                      </TableCell>
                      <TableCell>{cita.sucursal.nombre}</TableCell>
                      <TableCell>
                        {cita.servicioCitas.map(sc => sc.servicio.nombre).join(', ') || 'Sin servicios'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getEstadoLabel(cita.estado)}
                          size='small'
                          onClick={e => handleStatusClick(e, cita.id)}
                          sx={{
                            bgcolor: estadoColores[cita.estado] || '#607d8b',
                            color: 'white',
                            cursor: 'pointer',
                            '&:hover': { opacity: 0.8 }
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {totalPages > 1 && (
            <Box display='flex' justifyContent='center' mt={4}>
              <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} color='primary' />
            </Box>
          )}

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleStatusClose}>
            <MenuItem onClick={() => handleStatusChangeSubmit('PENDIENTE')}>Pendiente</MenuItem>
            <MenuItem onClick={() => handleStatusChangeSubmit('CONFIRMADA')}>Confirmada</MenuItem>
            <MenuItem onClick={() => handleStatusChangeSubmit('CANCELADA')}>Cancelada</MenuItem>
            <MenuItem onClick={() => handleStatusChangeSubmit('FINALIZADA')}>Finalizada</MenuItem>
          </Menu>
        </>
      )}
    </Box>
  )
}

import Alert from '@mui/material/Alert'
