'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import TextField from '@mui/material/TextField'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Alert from '@mui/material/Alert'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemIcon from '@mui/material/ListItemIcon'

interface Negocio {
  id: string
  nombre: string
  descripcion: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  categoriaServicio: string
  sucursals: { id: string; nombre: string }[]
}

interface ServicioSucursal {
  sucursalId: string
  precio: number | null
  costo: number | null
  activo: boolean
}

interface Servicio {
  id: string
  nombre: string
  descripcion: string | null
  duracionMinutos: number
  precio?: number | null
  servicioSucursals?: ServicioSucursal[]
}

interface HorarioSlot {
  empleado: { id: string; nombre: string; apellido: string }
  disponible: boolean
  mensaje: string
  horarios: { inicio: string; fin: string }[]
}

interface Disponibilidad {
  disponibles: boolean
  mensaje?: string
  fecha: string
  diaSemana: string
  duracion: number
  empleados: HorarioSlot[]
  empleadosDisponibles: number
}

const steps = ['Sucursal', 'Servicio', 'Fecha y Hora', 'Confirmar']

const categoriaColores: Record<string, string> = {
  SALUD: '#4caf50',
  BELLEZA: '#e91e63',
  AUTOMOTRIZ: '#2196f3',
  PROFESIONAL: '#9c27b0',
  EDUCACION: '#ff9800',
  HOGAR: '#795548',
  TECNOLOGIA: '#00bcd4',
  FITNESS: '#f44336',
  OTROS: '#607d8b'
}

export default function EmpresaDetallePage() {
  const params = useParams()
  const negocioId = params.id as string
  const { isAuthenticated, hasRole, isLoading, user } = useAuth()
  const router = useRouter()

  const [negocio, setNegocio] = useState<Negocio | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const [sucursalId, setSucursalId] = useState('')
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [loadingServicios, setLoadingServicios] = useState(false)
  const [selectedServicioId, setSelectedServicioId] = useState('')
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string | 'cualquiera'>('cualquiera')
  const [fecha, setFecha] = useState('')
  const [horarioSeleccionado, setHorarioSeleccionado] = useState<{ inicio: string; fin: string } | null>(null)
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad | null>(null)
  const [loadingDisponibilidad, setLoadingDisponibilidad] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchNegocio = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/public/negocios/${negocioId}`)
      const data = await res.json()

      if (data.success) {
        setNegocio(data.data)
      } else {
        setError('Empresa no encontrada')
      }
    } catch (err) {
      setError('Error al cargar la empresa')
    } finally {
      setLoading(false)
    }
  }, [negocioId])

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !hasRole('cliente'))) {
      router.push('/login')
    }
  }, [isAuthenticated, hasRole, isLoading, router])

  useEffect(() => {
    if (isAuthenticated && hasRole('cliente') && negocioId) {
      fetchNegocio()
    }
  }, [isAuthenticated, hasRole, negocioId, fetchNegocio])

  useEffect(() => {
    if (sucursalId) {
      fetchServicios()
      setSelectedServicioId('')
      setSelectedEmpleadoId('cualquiera')
      setFecha('')
      setDisponibilidad(null)
      setHorarioSeleccionado(null)
    }
  }, [sucursalId])

  const fetchServicios = async () => {
    setLoadingServicios(true)
    try {
      const res = await fetch(`/api/servicios?sucursalId=${sucursalId}&limit=100`)
      const data = await res.json()
      if (res.ok) {
        setServicios(data.data?.servicios || [])
      }
    } catch (err) {
      console.error('Error fetching servicios', err)
    } finally {
      setLoadingServicios(false)
    }
  }

  useEffect(() => {
    if (fecha && selectedServicioId && sucursalId) {
      const fetchDisponibilidad = async () => {
        setLoadingDisponibilidad(true)
        setError('')
        setDisponibilidad(null)
        setHorarioSeleccionado(null)
        setSelectedEmpleadoId('cualquiera')

        try {
          const selectedServicio = servicios.find(s => s.id === selectedServicioId)
          const duracion = selectedServicio?.duracionMinutos || 60

          const res = await fetch(
            `/api/public/sucursales/${sucursalId}/disponibilidad?fecha=${fecha}&duracion=${duracion}&servicioId=${selectedServicioId}`
          )
          const data = await res.json()

          if (data.success) {
            setDisponibilidad(data.data)
          } else {
            setError('Error al obtener disponibilidad')
          }
        } catch (err) {
          setError('Error al obtener disponibilidad')
        } finally {
          setLoadingDisponibilidad(false)
        }
      }

      fetchDisponibilidad()
    }
  }, [fecha, selectedServicioId, sucursalId, servicios])

  const handleNext = () => {
    if (activeStep === 0) {
      if (!sucursalId) {
        setError('Selecciona una sucursal')
        return
      }
      setError('')
      setActiveStep(1)
    } else if (activeStep === 1) {
      if (!selectedServicioId) {
        setError('Selecciona un servicio')
        return
      }
      setError('')
      setActiveStep(2)
    } else if (activeStep === 2) {
      if (!fecha || !horarioSeleccionado) {
        setError('Selecciona una fecha y hora')
        return
      }
      setError('')
      setActiveStep(3)
    }
  }

  const handleBack = () => {
    setActiveStep(prev => prev - 1)
    setError('')
  }

  const handleSubmit = async () => {
    if (!negocio || !sucursalId || !horarioSeleccionado || !user || !selectedServicioId) return

    setSubmitting(true)
    setError('')

    try {
      // Si eligió 'cualquiera', buscamos un empleado disponible en ese horario
      let finalEmpleadoId: string | null = selectedEmpleadoId === 'cualquiera' ? null : selectedEmpleadoId

      if (!finalEmpleadoId && disponibilidad) {
        const disponiblesEnHorario = disponibilidad.empleados.filter(
          e => e.disponible && e.horarios.some(h => h.inicio === horarioSeleccionado.inicio)
        )
        if (disponiblesEnHorario.length > 0) {
          finalEmpleadoId = disponiblesEnHorario[0].empleado.id
        }
      }

      const res = await fetch('/api/public/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          negocioId: negocio.id,
          sucursalId,
          empleadoId: finalEmpleadoId,
          clienteEmail: user.email,
          clienteNombre: user.nombre,
          clienteApellido: user.apellido,
          clienteTelefono: user.telefono || null,
          inicio: horarioSeleccionado.inicio,
          fin: horarioSeleccionado.fin,
          servicioIds: [selectedServicioId]
        })
      })

      const data = await res.json()

      if (data.success) {
        setSuccess('Cita agendada exitosamente!')
        setTimeout(() => {
          router.push('/cliente/citas')
        }, 2000)
      } else {
        setError(data.message || data.error?.message || 'Error al agendar la cita')
      }
    } catch (err) {
      setError('Error al agendar la cita')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDateTime = (iso: string) => {
    const isoLocal = iso.endsWith('Z') ? iso.slice(0, -1) : iso
    const date = new Date(isoLocal)
    return date.toLocaleString('es-DO', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const getPrecioServicio = (servicio: Servicio): number | null => {
    // El precio vive en la tabla intermedia ServicioSucursal (es por sucursal).
    // Buscamos el precio correspondiente a la sucursal seleccionada.
    const ss = servicio.servicioSucursals?.find(s => s.sucursalId === sucursalId)
    if (ss && ss.precio !== null && ss.precio !== undefined) {
      return Number(ss.precio)
    }
    // Fallback: primer precio disponible o precio plano del servicio (compat)
    const fallback = servicio.servicioSucursals?.find(s => s.precio !== null && s.precio !== undefined)
    if (fallback && fallback.precio !== null && fallback.precio !== undefined) {
      return Number(fallback.precio)
    }
    if (servicio.precio !== null && servicio.precio !== undefined) {
      return Number(servicio.precio)
    }
    return null
  }

  const formatPrecio = (precio: number | null) => {
    if (precio === null || precio === undefined || Number.isNaN(precio)) {
      return 'Precio no disponible'
    }
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(precio)
  }

  const formatHora = (iso: string) => {
    const isoLocal = iso.endsWith('Z') ? iso.slice(0, -1) : iso
    const date = new Date(isoLocal)
    return date.toLocaleTimeString('es-DO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const uniqueHorarios = (() => {
    if (!disponibilidad) return []
    const allHorarios = disponibilidad.empleados.filter(e => e.disponible).flatMap(e => e.horarios)

    const unique: { inicio: string; fin: string }[] = []
    const map = new Map<string, boolean>()
    for (const h of allHorarios) {
      if (!map.has(h.inicio)) {
        map.set(h.inicio, true)
        unique.push(h)
      }
    }
    return unique.sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())
  })()

  const availableEmployeesForSelectedTime = (() => {
    if (!disponibilidad || !horarioSeleccionado) return []
    return disponibilidad.empleados
      .filter(e => e.disponible && e.horarios.some(h => h.inicio === horarioSeleccionado.inicio))
      .map(e => e.empleado)
  })()

  if (isLoading || !isAuthenticated || !hasRole('cliente')) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='100vh'>
        <CircularProgress />
      </Box>
    )
  }

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='100vh'>
        <CircularProgress />
      </Box>
    )
  }

  if (!negocio) {
    return (
      <Box p={4}>
        <Alert severity='error'>Empresa no encontrada</Alert>
        <Button onClick={() => router.push('/cliente/empresas')} sx={{ mt: 2 }}>
          Volver a empresas
        </Button>
      </Box>
    )
  }

  const servicioSeleccionado = servicios.find(s => s.id === selectedServicioId) || null

  return (
    <Box p={4}>
      <Button
        startIcon={<i className='tabler-arrow-left' />}
        onClick={() => router.push('/cliente/empresas')}
        sx={{ mb: 2 }}
      >
        Volver
      </Button>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box display='flex' justifyContent='space-between' alignItems='start' mb={2}>
            <Typography variant='h4'>{negocio.nombre}</Typography>
            <Chip
              label={negocio.categoriaServicio}
              sx={{ bgcolor: categoriaColores[negocio.categoriaServicio] || '#607d8b', color: 'white' }}
            />
          </Box>

          {negocio.descripcion && (
            <Typography variant='body1' color='text.secondary' sx={{ mb: 2 }}>
              {negocio.descripcion}
            </Typography>
          )}

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Typography variant='body2'>
                <strong>Dirección:</strong> {negocio.direccion || 'No disponible'}
              </Typography>
              <Typography variant='body2'>
                <strong>Teléfono:</strong> {negocio.telefono || 'No disponible'}
              </Typography>
              <Typography variant='body2'>
                <strong>Email:</strong> {negocio.email || 'No disponible'}
              </Typography>
            </div>
            <div>
              <Typography variant='body2'>
                <strong>Teléfono:</strong> {negocio.telefono || 'No disponible'}
              </Typography>
              <Typography variant='body2'>
                <strong>Email:</strong> {negocio.email || 'No disponible'}
              </Typography>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant='h5' gutterBottom>
            Agendar Cita
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity='success' sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {activeStep === 0 && (
            <Box>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Sucursal</InputLabel>
                <Select value={sucursalId} label='Sucursal' onChange={e => setSucursalId(e.target.value)}>
                  {negocio.sucursals.map(s => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              {loadingServicios ? (
                <Box display='flex' justifyContent='center' py={4}>
                  <CircularProgress />
                </Box>
              ) : servicios.length === 0 ? (
                <Alert severity='info'>No hay servicios disponibles en esta sucursal</Alert>
              ) : (
                <FormControl component='fieldset' fullWidth>
                  <Typography variant='subtitle1' gutterBottom>
                    Selecciona un servicio:
                  </Typography>
                  <RadioGroup
                    value={selectedServicioId}
                    onChange={e => {
                      setSelectedServicioId(e.target.value)
                      setSelectedEmpleadoId('cualquiera')
                      setDisponibilidad(null)
                      setHorarioSeleccionado(null)
                    }}
                  >
                    {servicios.map(servicio => (
                      <Card
                        key={servicio.id}
                        variant='outlined'
                        sx={{
                          mb: 2,
                          borderColor: selectedServicioId === servicio.id ? 'primary.main' : 'divider',
                          borderWidth: selectedServicioId === servicio.id ? 2 : 1,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': { borderColor: 'primary.light' }
                        }}
                        onClick={() => {
                          setSelectedServicioId(servicio.id)
                          setSelectedEmpleadoId('cualquiera')
                          setDisponibilidad(null)
                          setHorarioSeleccionado(null)
                        }}
                      >
                        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                          <FormControlLabel
                            value={servicio.id}
                            control={<Radio />}
                            label={
                              <Box display='flex' justifyContent='space-between' alignItems='center' width='100%'>
                                <Box>
                                  <Typography variant='subtitle1' fontWeight={600}>
                                    {servicio.nombre}
                                  </Typography>
                                  {servicio.descripcion && (
                                    <Typography variant='body2' color='text.secondary'>
                                      {servicio.descripcion}
                                    </Typography>
                                  )}
                                  <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                                    Duración: {servicio.duracionMinutos} minutos
                                  </Typography>
                                </Box>
                                <Box textAlign='right'>
                                  <Typography variant='h6' color='primary'>
                                    {formatPrecio(getPrecioServicio(servicio))}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                            sx={{ width: '100%', mr: 0, alignItems: 'flex-start' }}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </RadioGroup>
                </FormControl>
              )}
            </Box>
          )}

          {activeStep === 2 && (
            <Box>
              <div className='flex flex-col gap-6'>
                <div>
                  <Typography variant='subtitle1' gutterBottom fontWeight='bold'>
                    1. Selecciona la fecha
                  </Typography>
                  <TextField
                    fullWidth
                    type='date'
                    value={fecha}
                    onChange={e => {
                      setFecha(e.target.value)
                      setHorarioSeleccionado(null)
                      setSelectedEmpleadoId('cualquiera')
                    }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      min: getMinDate()
                    }}
                    sx={{ maxWidth: 300 }}
                  />
                </div>

                {loadingDisponibilidad && (
                  <Box display='flex' justifyContent='center' py={4}>
                    <CircularProgress />
                  </Box>
                )}

                {disponibilidad && !loadingDisponibilidad && (
                  <div>
                    {!disponibilidad.disponibles || uniqueHorarios.length === 0 ? (
                      <Alert severity='info'>
                        {disponibilidad.mensaje || 'No hay horarios disponibles para esta fecha'}
                      </Alert>
                    ) : (
                      <>
                        <Typography variant='subtitle1' gutterBottom fontWeight='bold' sx={{ mt: 2 }}>
                          2. Selecciona la hora
                        </Typography>
                        <div className='flex flex-wrap gap-3'>
                          {uniqueHorarios.map(h => {
                            const isSelected = horarioSeleccionado?.inicio === h.inicio
                            return (
                              <Button
                                key={h.inicio}
                                variant={isSelected ? 'contained' : 'outlined'}
                                onClick={() => {
                                  setHorarioSeleccionado(h)
                                  setSelectedEmpleadoId('cualquiera')
                                }}
                                sx={{
                                  borderRadius: 2,
                                  px: 3,
                                  py: 1,
                                  textTransform: 'none',
                                  fontSize: '1rem',
                                  border: isSelected ? '1px solid transparent' : undefined
                                }}
                              >
                                {formatHora(h.inicio)}
                              </Button>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {horarioSeleccionado && availableEmployeesForSelectedTime.length > 0 && (
                  <div>
                    <Typography variant='subtitle1' gutterBottom fontWeight='bold' sx={{ mt: 2 }}>
                      3. Selecciona un especialista (Opcional)
                    </Typography>

                    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
                      <Card
                        variant='outlined'
                        sx={{
                          cursor: 'pointer',
                          borderColor: selectedEmpleadoId === 'cualquiera' ? 'primary.main' : 'divider',
                          borderWidth: 1,
                          boxShadow:
                            selectedEmpleadoId === 'cualquiera' ? '0 0 0 1px var(--mui-palette-primary-main)' : 'none',
                          transition: 'all 0.2s',
                          '&:hover': { borderColor: 'primary.light' }
                        }}
                        onClick={() => setSelectedEmpleadoId('cualquiera')}
                      >
                        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                          <Box display='flex' alignItems='center' gap={2}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <i className='tabler-users' />
                            </Box>
                            <Box>
                              <Typography variant='subtitle2' fontWeight='bold'>
                                Cualquiera
                              </Typography>
                              <Typography variant='body2' color='text.secondary'>
                                Primer especialista disponible
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>

                      {availableEmployeesForSelectedTime.map(emp => (
                        <Card
                          key={emp.id}
                          variant='outlined'
                          sx={{
                            cursor: 'pointer',
                            borderColor: selectedEmpleadoId === emp.id ? 'primary.main' : 'divider',
                            borderWidth: 1,
                            boxShadow:
                              selectedEmpleadoId === emp.id ? '0 0 0 1px var(--mui-palette-primary-main)' : 'none',
                            transition: 'all 0.2s',
                            '&:hover': { borderColor: 'primary.light' }
                          }}
                          onClick={() => setSelectedEmpleadoId(emp.id)}
                        >
                          <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                            <Box display='flex' alignItems='center' gap={2}>
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  bgcolor: 'secondary.main',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <Typography variant='button' fontWeight='bold' color='white'>
                                  {emp.nombre.charAt(0)}
                                  {emp.apellido.charAt(0)}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant='subtitle2' fontWeight='bold'>
                                  {emp.nombre} {emp.apellido}
                                </Typography>
                                <Typography variant='body2' color='text.secondary'>
                                  Especialista
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Box>
          )}

          {activeStep === 3 && (
            <Box>
              <Typography variant='h6' gutterBottom>
                Confirmar cita
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <i className='tabler-building-store' />
                  </ListItemIcon>
                  <ListItemText
                    primary='Sucursal'
                    secondary={negocio.sucursals.find(s => s.id === sucursalId)?.nombre}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <i className='tabler-scissors' />
                  </ListItemIcon>
                  <ListItemText
                    primary='Servicio'
                    secondary={servicios.find(s => s.id === selectedServicioId)?.nombre}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <i className='tabler-cash' />
                  </ListItemIcon>
                  <ListItemText
                    primary='Precio'
                    secondary={servicioSeleccionado ? formatPrecio(getPrecioServicio(servicioSeleccionado)) : '-'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <i className='tabler-calendar' />
                  </ListItemIcon>
                  <ListItemText
                    primary='Fecha y Hora'
                    secondary={horarioSeleccionado ? formatDateTime(horarioSeleccionado.inicio) : ''}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <i className='tabler-users' />
                  </ListItemIcon>
                  <ListItemText
                    primary='Especialista'
                    secondary={
                      selectedEmpleadoId === 'cualquiera'
                        ? 'Cualquiera'
                        : availableEmployeesForSelectedTime.find(e => e.id === selectedEmpleadoId)?.nombre +
                          ' ' +
                          availableEmployeesForSelectedTime.find(e => e.id === selectedEmpleadoId)?.apellido
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <i className='tabler-user' />
                  </ListItemIcon>
                  <ListItemText
                    primary='Cliente'
                    secondary={user ? `${user.nombre} ${user.apellido} (${user.email})` : ''}
                  />
                </ListItem>
              </List>
            </Box>
          )}

          <Box display='flex' justifyContent='space-between' mt={4}>
            <Button disabled={activeStep === 0} onClick={handleBack}>
              Atrás
            </Button>
            {activeStep < steps.length - 1 ? (
              <Button variant='contained' onClick={handleNext}>
                Siguiente
              </Button>
            ) : (
              <Button variant='contained' color='success' onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Agendando...' : 'Confirmar Cita'}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
