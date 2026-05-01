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
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import TextField from '@mui/material/TextField'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
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
  horaApertura: string
  horaCierre: string
  diasLaborables: string[]
  sucursals: { id: string; nombre: string; direccion: string | null }[]
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

const steps = ['Sucursal', 'Fecha y Hora', 'Confirmar']

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

  const fetchDisponibilidad = async () => {
    if (!sucursalId || !fecha) return

    setLoadingDisponibilidad(true)
    setError('')
    setDisponibilidad(null)
    setHorarioSeleccionado(null)

    try {
      const res = await fetch(`/api/public/sucursales/${sucursalId}/disponibilidad?fecha=${fecha}&duracion=60`)
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

  const handleNext = () => {
    if (activeStep === 0) {
      if (!sucursalId) {
        setError('Selecciona una sucursal')
        return
      }
      setError('')
      setActiveStep(1)
    } else if (activeStep === 1) {
      if (!fecha || !horarioSeleccionado) {
        setError('Selecciona una fecha y hora')
        return
      }
      setError('')
      setActiveStep(2)
    }
  }

  const handleBack = () => {
    setActiveStep((prev) => prev - 1)
    setError('')
  }

  const handleSubmit = async () => {
    if (!negocio || !sucursalId || !horarioSeleccionado || !user) return

    setSubmitting(true)
    setError('')

    try {
      const empleadoId = selectedEmpleadoId === 'cualquiera' ? null : selectedEmpleadoId

      const res = await fetch('/api/public/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          negocioId: negocio.id,
          sucursalId,
          empleadoId,
          clienteEmail: user.email,
          clienteNombre: user.nombre,
          clienteApellido: user.apellido,
          clienteTelefono: user.telefono || null,
          inicio: horarioSeleccionado.inicio,
          fin: horarioSeleccionado.fin
        })
      })

      const data = await res.json()

      if (data.success) {
        setSuccess('Cita agendada exitosamente!')
        setTimeout(() => {
          router.push('/cliente/citas')
        }, 2000)
      } else {
        setError(data.message || 'Error al agendar la cita')
      }
    } catch (err) {
      setError('Error al agendar la cita')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    return `${hours}:${minutes}`
  }

  const formatDias = (dias: string[]) => {
    const diasMap: Record<string, string> = {
      LUNES: 'Lunes',
      MARTES: 'Martes',
      MIERCOLES: 'Miércoles',
      JUEVES: 'Jueves',
      VIERNES: 'Viernes',
      SABADO: 'Sábado',
      DOMINGO: 'Domingo'
    }
    return dias.map(d => diasMap[d]).join(', ')
  }

  const formatDateTime = (iso: string) => {
    const date = new Date(iso)
    return date.toLocaleString('es-DO', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

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

  return (
    <Box p={4}>
      <Button startIcon={<i className='tabler-arrow-left' />} onClick={() => router.push('/cliente/empresas')} sx={{ mb: 2 }}>
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

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant='body2'>
                <strong>Dirección:</strong> {negocio.direccion || 'No disponible'}
              </Typography>
              <Typography variant='body2'>
                <strong>Teléfono:</strong> {negocio.telefono || 'No disponible'}
              </Typography>
              <Typography variant='body2'>
                <strong>Email:</strong> {negocio.email || 'No disponible'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='body2'>
                <strong>Horario:</strong> {formatTime(negocio.horaApertura)} - {formatTime(negocio.horaCierre)}
              </Typography>
              <Typography variant='body2'>
                <strong>Días:</strong> {formatDias(negocio.diasLaborables)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant='h5' gutterBottom>
            Agendar Cita
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
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
                <Select
                  value={sucursalId}
                  label='Sucursal'
                  onChange={(e) => setSucursalId(e.target.value)}
                >
                  {negocio.sucursals.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.nombre} - {s.direccion || 'Sin dirección'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type='date'
                    label='Fecha'
                    value={fecha}
                    onChange={(e) => {
                      setFecha(e.target.value)
                      setHorarioSeleccionado(null)
                    }}
                    inputProps={{
                      min: getMinDate()
                    }}
                  />
                </Grid>

                {fecha && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Empleado (opcional)</InputLabel>
                      <Select
                        value={selectedEmpleadoId}
                        label='Empleado (opcional)'
                        onChange={(e) => {
                          setSelectedEmpleadoId(e.target.value)
                          setHorarioSeleccionado(null)
                        }}
                      >
                        <MenuItem value='cualquiera'>Cualquier empleado disponible</MenuItem>
                        {disponibilidad?.empleados
                          .filter((e) => e.disponible)
                          .map((e) => (
                            <MenuItem key={e.empleado.id} value={e.empleado.id}>
                              {e.empleado.nombre} {e.empleado.apellido}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {fecha && (
                  <Grid item xs={12}>
                    <Button
                      variant='contained'
                      onClick={fetchDisponibilidad}
                      disabled={loadingDisponibilidad}
                    >
                      {loadingDisponibilidad ? 'Cargando...' : 'Ver disponibilidad'}
                    </Button>
                  </Grid>
                )}

                {loadingDisponibilidad && (
                  <Grid item xs={12}>
                    <Box display='flex' justifyContent='center' py={4}>
                      <CircularProgress />
                    </Box>
                  </Grid>
                )}

                {disponibilidad && !loadingDisponibilidad && (
                  <Grid item xs={12}>
                    {!disponibilidad.disponibles ? (
                      <Alert severity='info'>{disponibilidad.mensaje || 'No hay disponibilidad'}</Alert>
                    ) : (
                      <>
                        <Typography variant='subtitle1' gutterBottom>
                          Selecciona un horario:
                        </Typography>
                        <FormControl component='fieldset'>
                          <RadioGroup
                            value={horarioSeleccionado ? `${horarioSeleccionado.inicio}|${horarioSeleccionado.fin}` : ''}
                            onChange={(e) => {
                              const [inicio, fin] = e.target.value.split('|')
                              setHorarioSeleccionado({ inicio, fin })
                            }}
                          >
                            {selectedEmpleadoId === 'cualquiera'
                              ? disponibilidad.empleados
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
                                  )
                              : disponibilidad.empleados
                                  .find((e) => e.empleado.id === selectedEmpleadoId)
                                  ?.horarios.slice(0, 5)
                                  .map((h) => (
                                    <FormControlLabel
                                      key={h.inicio}
                                      value={`${h.inicio}|${h.fin}`}
                                      control={<Radio />}
                                      label={formatDateTime(h.inicio)}
                                    />
                                  ))}
                          </RadioGroup>
                        </FormControl>
                      </>
                    )}
                  </Grid>
                )}
              </Grid>
            </Box>
          )}

          {activeStep === 2 && (
            <Box>
              <Typography variant='h6' gutterBottom>
                Confirmar cita
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <i className='tabler-building-store' />
                  </ListItemIcon>
                  <ListItemText primary='Sucursal' secondary={negocio.sucursals.find((s) => s.id === sucursalId)?.nombre} />
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
              <Button
                variant='contained'
                color='success'
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Agendando...' : 'Confirmar Cita'}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}