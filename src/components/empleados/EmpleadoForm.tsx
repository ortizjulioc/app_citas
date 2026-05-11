'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Grid,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider,
  InputAdornment,
  Switch,
  FormControlLabel,
  Tooltip,
  Chip
} from '@mui/material'

import { useAuth } from '@/contexts/AuthContext'

interface Servicio {
  id: string
  nombre: string
  precio: number | null
}

interface HorarioDia {
  diaSemana: string
  activo: boolean
  horaInicio: string
  horaFin: string
}

interface Bloqueo {
  id: string
  inicio: string
  fin: string
  motivo: string
}

interface ServicioConPorcentaje {
  servicioId: string
  nombre: string
  porcentaje: number
}

interface Props {
  initialData?: any
  isEditing: boolean
  sucursalId: string
  onSave: (data: any) => Promise<void>
  onCancel: () => void
}

const diasSemana = [
  { value: 'LUNES', label: 'Lunes', icon: 'tabler:calendar-event' },
  { value: 'MARTES', label: 'Martes', icon: 'tabler:calendar-event' },
  { value: 'MIERCOLES', label: 'Miércoles', icon: 'tabler:calendar-event' },
  { value: 'JUEVES', label: 'Jueves', icon: 'tabler:calendar-event' },
  { value: 'VIERNES', label: 'Viernes', icon: 'tabler:calendar-event' },
  { value: 'SABADO', label: 'Sábado', icon: 'tabler:calendar-event' },
  { value: 'DOMINGO', label: 'Domingo', icon: 'tabler:calendar-event' }
]

const tipoSalarioOptions = [
  { value: 'FIJO', label: 'Fijo', icon: 'tabler:cash' },
  { value: 'POR_HORA', label: 'Por Hora', icon: 'tabler:clock' },
  { value: 'POR_COMISION', label: 'Por Comisión', icon: 'tabler:percentage' }
]

export default function EmpleadoForm({ initialData, isEditing, sucursalId, onSave, onCancel }: Props) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio | null>(null)
  const [porcentaje, setPorcentaje] = useState<string>('')

  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '',
    apellido: initialData?.apellido || '',
    telefono: initialData?.telefono || '',
    email: initialData?.email || '',
    password: '',
    tipoSalario: initialData?.tipoSalario || 'FIJO',
    salarioBase: initialData?.salarioBase?.toString() || '',
    fechaContratacion: initialData?.fechaContratacion?.split('T')[0] || new Date().toISOString().split('T')[0],
    negocioId: initialData?.negocioId || user?.negocioId || ''
  })

  const [horario, setHorario] = useState<HorarioDia[]>(
    initialData?.horario?.map((h: any) => ({
      diaSemana: h.diaSemana,
      activo: true,
      horaInicio: h.horaInicio?.substring(0, 5) || '09:00',
      horaFin: h.horaFin?.substring(0, 5) || '18:00'
    })) || diasSemana.map(d => ({
      diaSemana: d.value,
      activo: false,
      horaInicio: '09:00',
      horaFin: '18:00'
    }))
  )

  const [bloqueos, setBloqueos] = useState<Bloqueo[]>(initialData?.bloqueos || [])
  const [serviciosAgregados, setServiciosAgregados] = useState<ServicioConPorcentaje[]>(
    initialData?.servicios || []
  )

  useEffect(() => {
    const fetchServicios = async () => {
      try {
        const res = await fetch(`/api/servicios?sucursalId=${sucursalId}&limit=100`)
        const json = await res.json()
        if (res.ok) {
          setServicios(json.data?.servicios || [])
        }
      } catch (err) {
        console.error('Error fetching servicios', err)
      }
    }
    fetchServicios()
  }, [sucursalId])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleHorarioChange = (dia: string, field: 'activo' | 'horaInicio' | 'horaFin', value: boolean | string) => {
    setHorario(prev => prev.map(h =>
      h.diaSemana === dia ? { ...h, [field]: value } : h
    ))
  }

  const agregarBloqueo = () => {
    setBloqueos(prev => [...prev, { id: Date.now().toString(), inicio: '', fin: '', motivo: '' }])
  }

  const eliminarBloqueo = (id: string) => {
    setBloqueos(prev => prev.filter(b => b.id !== id))
  }

  const actualizarBloqueo = (id: string, field: keyof Bloqueo, value: string) => {
    setBloqueos(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b))
  }

  const agregarServicio = () => {
    if (!servicioSeleccionado || !porcentaje) return

    const pct = parseFloat(porcentaje)
    if (pct < 0 || pct > 100) return

    if (serviciosAgregados.find(s => s.servicioId === servicioSeleccionado.id)) return

    setServiciosAgregados(prev => [...prev, {
      servicioId: servicioSeleccionado.id,
      nombre: servicioSeleccionado.nombre,
      porcentaje: pct
    }])

    setServicioSeleccionado(null)
    setPorcentaje('')
  }

  const eliminarServicio = (servicioId: string) => {
    setServiciosAgregados(prev => prev.filter(s => s.servicioId !== servicioId))
  }

  const handleSubmit = async () => {
    setError(null)

    // Validaciones básicas
    if (!formData.nombre.trim()) return setError('El nombre es requerido')
    if (!formData.apellido.trim()) return setError('El apellido es requerido')
    if (!formData.telefono.trim()) return setError('El teléfono es requerido')
    if (!formData.tipoSalario) return setError('El tipo de salario es requerido')
    if (!formData.negocioId) return setError('El ID del negocio es requerido')

    if (!isEditing) {
      if (!formData.email.trim()) return setError('El email es requerido')
      if (!formData.password.trim()) return setError('La contraseña es requerida')
      if (formData.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres')
    }

    setLoading(true)

    try {
      const horarioData = horario
        .filter(h => h.activo && h.horaInicio && h.horaFin)
        .map(h => ({
          diaSemana: h.diaSemana,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin
        }))

      const bloqueosData = bloqueos
        .filter(b => b.inicio && b.fin)
        .map(b => ({
          inicio: new Date(b.inicio).toISOString(),
          fin: new Date(b.fin).toISOString(),
          motivo: b.motivo || null
        }))

      const serviciosData = serviciosAgregados.map(s => ({
        servicioId: s.servicioId,
        porcentaje: s.porcentaje
      }))

      const payload: any = {
        ...formData,
        salarioBase: formData.salarioBase ? parseFloat(formData.salarioBase) : null,
        fechaContratacion: formData.fechaContratacion ? new Date(formData.fechaContratacion).toISOString() : null,
        sucursalId,
        horario: horarioData,
        bloqueos: bloqueosData,
        servicios: serviciosData
      }

      if (isEditing) {
        delete payload.email
        delete payload.password
      }

      await onSave(payload)
    } catch (err: any) {
      setError(err.message || 'Error al guardar el empleado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box className='flex flex-col gap-6 p-1'>
      {error && (
        <Alert severity='error' variant='filled' onClose={() => setError(null)} className='mb-2'>
          {error}
        </Alert>
      )}

      <Box className='border-b border-divider'>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant='scrollable'
          scrollButtons='auto'
          aria-label='tabs empleado'
          sx={{ '& .MuiTab-root': { minHeight: 64 } }}
        >
          <Tab icon={<i className='tabler-user text-xl' />} iconPosition='start' label='Información' />
          <Tab icon={<i className='tabler-briefcase text-xl' />} iconPosition='start' label='Laboral' />
          <Tab icon={<i className='tabler-clock text-xl' />} iconPosition='start' label='Horario' />
          <Tab icon={<i className='tabler-calendar-off text-xl' />} iconPosition='start' label='Restricciones' />
          <Tab icon={<i className='tabler-star text-xl' />} iconPosition='start' label='Especialidades' />
        </Tabs>
      </Box>

      <Box className='min-h-[400px]'>
        {/* TAB 0: INFORMACIÓN */}
        {activeTab === 0 && (
          <Grid container spacing={5}>
            {!isEditing && (
              <Grid item xs={12}>
                <Typography variant='h6' className='mb-4 flex items-center gap-2'>
                  <i className='tabler-lock text-primary' /> Cuenta de Acceso
                </Typography>
                <Grid container spacing={4}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label='Correo Electrónico'
                      type='email'
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder='ejemplo@correo.com'
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position='start'>
                            <i className='tabler-mail' />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label='Contraseña'
                      type='password'
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      placeholder='••••••'
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position='start'>
                            <i className='tabler-key' />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                </Grid>
                <Divider className='my-6' />
              </Grid>
            )}

            <Grid item xs={12}>
              <Typography variant='h6' className='mb-4 flex items-center gap-2'>
                <i className='tabler-user-circle text-primary' /> Datos Personales
              </Typography>
              <Grid container spacing={4}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Nombre(s)'
                    value={formData.nombre}
                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder='Escribe el nombre'
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Apellido(s)'
                    value={formData.apellido}
                    onChange={e => setFormData({ ...formData, apellido: e.target.value })}
                    placeholder='Escribe el apellido'
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label='Teléfono de Contacto'
                    value={formData.telefono}
                    onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder='809-000-0000'
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <i className='tabler-phone' />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        )}

        {/* TAB 1: LABORAL */}
        {activeTab === 1 && (
          <Grid container spacing={5}>
            <Grid item xs={12}>
              <Typography variant='h6' className='mb-4 flex items-center gap-2'>
                <i className='tabler-building-store text-primary' /> Asignación
              </Typography>
              <Grid container spacing={4}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    disabled
                    label='Negocio'
                    value={formData.negocioId}
                    helperText='El empleado se vinculará a este negocio'
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    disabled
                    label='Sucursal Actual'
                    value={sucursalId}
                    helperText='Sede de trabajo principal'
                  />
                </Grid>
              </Grid>
              <Divider className='my-6' />
            </Grid>

            <Grid item xs={12}>
              <Typography variant='h6' className='mb-4 flex items-center gap-2'>
                <i className='tabler-wallet text-primary' /> Condiciones Salariales
              </Typography>
              <Grid container spacing={4}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Esquema de Pago</InputLabel>
                    <Select
                      value={formData.tipoSalario}
                      label='Esquema de Pago'
                      onChange={e => setFormData({ ...formData, tipoSalario: e.target.value })}
                    >
                      {tipoSalarioOptions.map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>
                          <Box className='flex items-center gap-2'>
                            <i className={`${opt.icon} text-lg`} />
                            {opt.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Salario Base'
                    type='number'
                    value={formData.salarioBase}
                    onChange={e => setFormData({ ...formData, salarioBase: e.target.value })}
                    placeholder='0.00'
                    InputProps={{
                      startAdornment: <InputAdornment position='start'>$</InputAdornment>
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Fecha de Contratación'
                    type='date'
                    value={formData.fechaContratacion}
                    onChange={e => setFormData({ ...formData, fechaContratacion: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <i className='tabler-calendar' />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        )}

        {/* TAB 2: HORARIO */}
        {activeTab === 2 && (
          <Box className='flex flex-col gap-4'>
            <Typography variant='h6' className='mb-2 flex items-center gap-2'>
              <i className='tabler-clock-play text-primary' /> Horario de Disponibilidad
            </Typography>
            <Typography variant='body2' color='text.secondary' className='mb-4'>
              Define los días y horas en los que el empleado estará disponible para recibir citas.
            </Typography>

            <Paper variant='outlined' className='overflow-hidden'>
              <TableContainer>
                <Table size='medium'>
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell width={200}>Día de la Semana</TableCell>
                      <TableCell width={150}>Estado</TableCell>
                      <TableCell>Horario de Trabajo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {horario.map(dia => (
                      <TableRow key={dia.diaSemana} hover>
                        <TableCell>
                          <Box className='flex items-center gap-3'>
                            <i className='tabler:calendar text-xl text-primary' />
                            <Typography variant='subtitle2'>
                              {diasSemana.find(d => d.value === dia.diaSemana)?.label}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={dia.activo}
                                onChange={e => handleHorarioChange(dia.diaSemana, 'activo', e.target.checked)}
                                color='primary'
                              />
                            }
                            label={dia.activo ? 'Activo' : 'Inactivo'}
                          />
                        </TableCell>
                        <TableCell>
                          {dia.activo ? (
                            <Box className='flex items-center gap-4'>
                              <TextField
                                label='Inicio'
                                type='time'
                                size='small'
                                value={dia.horaInicio}
                                onChange={e => handleHorarioChange(dia.diaSemana, 'horaInicio', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 130 }}
                              />
                              <Typography color='text.secondary'>a</Typography>
                              <TextField
                                label='Fin'
                                type='time'
                                size='small'
                                value={dia.horaFin}
                                onChange={e => handleHorarioChange(dia.diaSemana, 'horaFin', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 130 }}
                              />
                            </Box>
                          ) : (
                            <Typography variant='body2' color='text.disabled' fontStyle='italic'>
                              No laborable
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        )}

        {/* TAB 3: RESTRICCIONES */}
        {activeTab === 3 && (
          <Box className='flex flex-col gap-4'>
            <Box className='flex justify-between items-center mb-2'>
              <Box>
                <Typography variant='h6' className='flex items-center gap-2'>
                  <i className='tabler-calendar-cancel text-primary' /> Bloqueos de Horario
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Gestiona ausencias, vacaciones o permisos especiales.
                </Typography>
              </Box>
              <Button
                variant='tonal'
                color='primary'
                startIcon={<i className='tabler-plus' />}
                onClick={agregarBloqueo}
              >
                Nuevo Bloqueo
              </Button>
            </Box>

            {bloqueos.length === 0 ? (
              <Box className='flex flex-col items-center justify-center py-12 border-2 border-dashed border-divider rounded-lg'>
                <i className='tabler-calendar-question text-5xl text-textDisabled mb-2' />
                <Typography color='text.secondary'>No hay bloqueos registrados</Typography>
              </Box>
            ) : (
              <Grid container spacing={4}>
                {bloqueos.map(bloqueo => (
                  <Grid item xs={12} key={bloqueo.id}>
                    <Card variant='outlined' className='relative overflow-visible'>
                      <IconButton
                        color='error'
                        size='small'
                        onClick={() => eliminarBloqueo(bloqueo.id)}
                        className='absolute -top-3 -right-3 bg-background border border-divider shadow-sm hover:bg-error-light'
                      >
                        <i className='tabler-x text-xs' />
                      </IconButton>
                      <CardContent>
                        <Grid container spacing={4} alignItems='center'>
                          <Grid item xs={12} sm={3}>
                            <TextField
                              fullWidth
                              label='Desde'
                              type='date'
                              size='small'
                              value={bloqueo.inicio}
                              onChange={e => actualizarBloqueo(bloqueo.id, 'inicio', e.target.value)}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <TextField
                              fullWidth
                              label='Hasta'
                              type='date'
                              size='small'
                              value={bloqueo.fin}
                              onChange={e => actualizarBloqueo(bloqueo.id, 'fin', e.target.value)}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label='Motivo / Descripción'
                              size='small'
                              value={bloqueo.motivo}
                              onChange={e => actualizarBloqueo(bloqueo.id, 'motivo', e.target.value)}
                              placeholder='Ej: Vacaciones anuales'
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* TAB 4: ESPECIALIDADES */}
        {activeTab === 4 && (
          <Box className='flex flex-col gap-6'>
            <Box>
              <Typography variant='h6' className='flex items-center gap-2'>
                <i className='tabler-certificate text-primary' /> Servicios y Comisiones
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Asigna los servicios que este empleado puede realizar y su comisión correspondiente.
              </Typography>
            </Box>

            <Paper variant='outlined' className='p-4 bg-action-hover'>
              <Grid container spacing={4} alignItems='center'>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={servicios}
                    getOptionLabel={option => option.nombre}
                    value={servicioSeleccionado}
                    onChange={(_, newValue) => setServicioSeleccionado(newValue)}
                    renderInput={params => (
                      <TextField {...params} label='Buscar Servicio' placeholder='Escribe el nombre...' />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label='% de Comisión'
                    type='number'
                    value={porcentaje}
                    onChange={e => setPorcentaje(e.target.value)}
                    placeholder='0-100'
                    InputProps={{
                      endAdornment: <InputAdornment position='end'>%</InputAdornment>
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Button
                    fullWidth
                    variant='contained'
                    size='large'
                    onClick={agregarServicio}
                    startIcon={<i className='tabler-plus' />}
                    disabled={!servicioSeleccionado || !porcentaje}
                  >
                    Vincular
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {serviciosAgregados.length > 0 ? (
              <TableContainer component={Paper} variant='outlined'>
                <Table size='medium'>
                  <TableHead sx={{ bgcolor: 'action.selected' }}>
                    <TableRow>
                      <TableCell>Servicio</TableCell>
                      <TableCell align='center'>Comisión</TableCell>
                      <TableCell align='center'>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {serviciosAgregados.map(s => (
                      <TableRow key={s.servicioId} hover>
                        <TableCell>
                          <Typography variant='subtitle2'>{s.nombre}</Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Chip
                            label={`${s.porcentaje}%`}
                            color='primary'
                            variant='tonal'
                            size='small'
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Tooltip title='Eliminar vínculo'>
                            <IconButton color='error' size='small' onClick={() => eliminarServicio(s.servicioId)}>
                              <i className='tabler-trash' />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box className='flex flex-col items-center justify-center py-8 opacity-60'>
                <i className='tabler-settings-automation text-4xl mb-2' />
                <Typography variant='body2'>No hay servicios vinculados a este empleado</Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>

      <Divider />

      <Box className='flex justify-end items-center gap-3 mt-4'>
        <Button color='secondary' variant='tonal' onClick={onCancel} disabled={loading}>
          Descartar
        </Button>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? null : <i className='tabler-device-floppy' />}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Procesando...' : isEditing ? 'Actualizar' : 'Guardar Empleado'}
        </Button>
      </Box>
    </Box>
  )
}