'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Chip from '@mui/material/Chip'

interface Cliente {
  id: string
  nombre: string
  apellido: string
  telefono: string | null
  email: string | null
  fechaNacimiento: string | null
  direccion: string | null
  notas: string | null
  createdAt: string
}

interface ClienteNegocio {
  id: string
  clienteId: string
  totalGastado: number
  ultimaVisita: string | null
  notas: string | null
  registradoEn: string
  totalCitas: number
  cliente: Cliente
}

export default function EmpresaClientesPage() {
  const { isAuthenticated, hasRole, isLoading, token } = useAuth()

  const [clientes, setClientes] = useState<ClienteNegocio[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const [detalle, setDetalle] = useState<ClienteNegocio | null>(null)

  const fetchClientes = async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams()
      params.append('page', String(page + 1))
      params.append('limit', String(rowsPerPage))
      if (search) params.append('search', search)

      const res = await fetch(`/api/empresa/clientes?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: 'no-store'
      })
      const data = await res.json()

      if (data.success) {
        setClientes(data.data.clientes)
        setTotal(data.data.pagination.total)
      } else {
        setError(data.error?.message || 'Error al cargar los clientes')
      }
    } catch (err) {
      setError('Error al cargar los clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && hasRole('admin') && token) {
      fetchClientes()
    }
  }, [isAuthenticated, hasRole, token, page, rowsPerPage, search])

  // Debounce simple del buscador
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(0)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const formatFecha = (iso: string | null) => {
    if (!iso) return '-'
    return new Date(iso).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    })
  }

  const formatDateTime = (iso: string | null) => {
    if (!iso) return '-'
    return new Date(iso).toLocaleString('es-DO', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  const formatMoneda = (n: number | null | undefined) => {
    const v = typeof n === 'number' ? n : 0
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(v)
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
      <Box display='flex' justifyContent='space-between' alignItems='center' mb={2} flexWrap='wrap' gap={2}>
        <Typography variant='h4'>Clientes de la Empresa</Typography>
        <Button
          variant='outlined'
          size='small'
          onClick={fetchClientes}
          disabled={loading}
          startIcon={<i className='tabler-refresh' />}
        >
          Actualizar
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            label='Buscar cliente'
            placeholder='Nombre, apellido, email o teléfono'
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <i className='tabler-search' />
                </InputAdornment>
              )
            }}
          />
        </CardContent>
      </Card>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {loading ? (
            <Box display='flex' justifyContent='center' py={4}>
              <CircularProgress />
            </Box>
          ) : clientes.length === 0 ? (
            <Box py={4} textAlign='center'>
              <i className='tabler-users-off' style={{ fontSize: 48, color: '#bdbdbd' }} />
              <Typography color='text.secondary' mt={2}>
                {search
                  ? 'No se encontraron clientes con esos criterios'
                  : 'Aún no hay clientes registrados. Aparecerán automáticamente cuando reserven una cita.'}
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Contacto</TableCell>
                      <TableCell>Citas</TableCell>
                      <TableCell>Total Gastado</TableCell>
                      <TableCell>Última Visita</TableCell>
                      <TableCell>Cliente desde</TableCell>
                      <TableCell align='center'>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clientes.map(cn => (
                      <TableRow key={cn.id} hover>
                        <TableCell>
                          <Typography variant='body2' fontWeight={600}>
                            {cn.cliente.nombre} {cn.cliente.apellido}
                          </Typography>
                          {cn.cliente.direccion && (
                            <Typography variant='caption' color='text.secondary'>
                              {cn.cliente.direccion}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>{cn.cliente.email || '-'}</Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {cn.cliente.telefono || 'Sin teléfono'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={cn.totalCitas}
                            size='small'
                            color={cn.totalCitas > 0 ? 'primary' : 'default'}
                            variant='outlined'
                          />
                        </TableCell>
                        <TableCell>{formatMoneda(cn.totalGastado)}</TableCell>
                        <TableCell>{formatDateTime(cn.ultimaVisita)}</TableCell>
                        <TableCell>{formatFecha(cn.registradoEn)}</TableCell>
                        <TableCell align='center'>
                          <Button size='small' onClick={() => setDetalle(cn)}>
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
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage='Filas por página'
              />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(detalle)} onClose={() => setDetalle(null)} maxWidth='sm' fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Detalle del Cliente
          <IconButton onClick={() => setDetalle(null)} size='small'>
            <i className='tabler-x' />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detalle && (
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <i className='tabler-user' />
                </ListItemIcon>
                <ListItemText
                  primary='Nombre completo'
                  secondary={`${detalle.cliente.nombre} ${detalle.cliente.apellido}`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <i className='tabler-mail' />
                </ListItemIcon>
                <ListItemText primary='Email' secondary={detalle.cliente.email || '-'} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <i className='tabler-phone' />
                </ListItemIcon>
                <ListItemText primary='Teléfono' secondary={detalle.cliente.telefono || '-'} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <i className='tabler-cake' />
                </ListItemIcon>
                <ListItemText primary='Fecha de nacimiento' secondary={formatFecha(detalle.cliente.fechaNacimiento)} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <i className='tabler-map-pin' />
                </ListItemIcon>
                <ListItemText primary='Dirección' secondary={detalle.cliente.direccion || '-'} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <i className='tabler-calendar' />
                </ListItemIcon>
                <ListItemText primary='Cliente desde' secondary={formatFecha(detalle.registradoEn)} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <i className='tabler-clock' />
                </ListItemIcon>
                <ListItemText primary='Última visita' secondary={formatDateTime(detalle.ultimaVisita)} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <i className='tabler-list-check' />
                </ListItemIcon>
                <ListItemText primary='Total de citas' secondary={detalle.totalCitas} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <i className='tabler-cash' />
                </ListItemIcon>
                <ListItemText primary='Total gastado' secondary={formatMoneda(detalle.totalGastado)} />
              </ListItem>
              {detalle.notas && (
                <ListItem>
                  <ListItemIcon>
                    <i className='tabler-note' />
                  </ListItemIcon>
                  <ListItemText primary='Notas' secondary={detalle.notas} />
                </ListItem>
              )}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDetalle(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
