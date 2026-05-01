'use client'

import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Autocomplete from '@mui/material/Autocomplete'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'

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
  { value: 'LUNES', label: 'Lunes' },
  { value: 'MARTES', label: 'Martes' },
  { value: 'MIERCOLES', label: 'Miércoles' },
  { value: 'JUEVES', label: 'Jueves' },
  { value: 'VIERNES', label: 'Viernes' },
  { value: 'SABADO', label: 'Sábado' },
  { value: 'DOMINGO', label: 'Domingo' }
]

const tipoSalarioOptions = [
  { value: 'FIJO', label: 'Fijo' },
  { value: 'POR_HORA', label: 'Por Hora' },
  { value: 'POR_COMISION', label: 'Por Comisión' }
]

export default function EmpleadoForm({ initialData, isEditing, sucursalId, onSave, onCancel }: Props) {
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
    tipoSalario: initialData?.tipoSalario || '',
    salarioBase: initialData?.salarioBase?.toString() || '',
    fechaContratacion: initialData?.fechaContratacion?.split('T')[0] || ''
  })

  const [horario, setHorario] = useState<HorarioDia[]>(
    initialData?.horario?.map((h: any) => ({
      diaSemana: h.diaSemana,
      activo: true,
      horaInicio: h.horaInicio?.substring(0, 5) || '',
      horaFin: h.horaFin?.substring(0, 5) || ''
    })) || diasSemana.map(d => ({
      diaSemana: d.value,
      activo: false,
      horaInicio: '09:00',
      horaFin: '17:00'
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

    if (!formData.nombre.trim()) {
      setError('El nombre es requerido')
      return
    }
    if (!formData.apellido.trim()) {
      setError('El apellido es requerido')
      return
    }
    if (!formData.telefono.trim()) {
      setError('El teléfono es requerido')
      return
    }
    if (!formData.tipoSalario) {
      setError('El tipo de salario es requerido')
      return
    }
    if (!formData.fechaContratacion) {
      setError('La fecha de contratación es requerida')
      return
    }

    if (!isEditing) {
      if (!formData.email.trim()) {
        setError('El email es requerido')
        return
      }
      if (!formData.password.trim()) {
        setError('La contraseña es requerida')
        return
      }
      if (formData.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres')
        return
      }
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
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono || null,
        tipoSalario: formData.tipoSalario,
        salarioBase: formData.salarioBase ? parseFloat(formData.salarioBase) : null,
        fechaContratacion: formData.fechaContratacion ? new Date(formData.fechaContratacion).toISOString() : null,
        sucursalId
      }

      if (!isEditing) {
        payload.email = formData.email
        payload.password = formData.password
      }

      if (horarioData.length > 0) payload.horario = horarioData
      if (bloqueosData.length > 0) payload.bloqueos = bloqueosData
      if (serviciosData.length > 0) payload.servicios = serviciosData

      await onSave(payload)
    } catch (err: any) {
      setError(err.message || 'Error al guardar el empleado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box display='flex' flexDirection='column' gap={3}>
      {error && (
        <Alert severity='error' onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!isEditing && (
        <Paper variant='outlined' sx={{ p: 2 }}>
          <Typography variant='subtitle2' gutterBottom>
            Datos de Cuenta
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Email'
                type='email'
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder='juan@ejemplo.com'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Contraseña'
                type='password'
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder='Mínimo 6 caracteres'
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      <Paper variant='outlined' sx={{ p: 2 }}>
        <Typography variant='subtitle2' gutterBottom>
          Datos Personales
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label='Nombre'
              value={formData.nombre}
              onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              placeholder='Juan'
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label='Apellido'
              value={formData.apellido}
              onChange={e => setFormData({ ...formData, apellido: e.target.value })}
              placeholder='Pérez'
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label='Teléfono'
              value={formData.telefono}
              onChange={e => setFormData({ ...formData, telefono: e.target.value })}
              placeholder='8091234567'
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper variant='outlined' sx={{ p: 2 }}>
        <Typography variant='subtitle2' gutterBottom>
          Datos Laborales
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
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
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label='Salario Base'
              type='number'
              value={formData.salarioBase}
              onChange={e => setFormData({ ...formData, salarioBase: e.target.value })}
              placeholder='0.00'
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
            />
          </Grid>
        </Grid>
      </Paper>

      <Accordion>
        <AccordionSummary expandIcon={<i className='tabler-chevron-down' />}>
          <Typography>Horario de Trabajo</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {horario.map(dia => (
              <Grid item xs={12} key={dia.diaSemana}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={dia.activo}
                      onChange={e => handleHorarioChange(dia.diaSemana, 'activo', e.target.checked)}
                    />
                  }
                  label={diasSemana.find(d => d.value === dia.diaSemana)?.label}
                />
                {dia.activo && (
                  <Box display='flex' gap={2} ml={4}>
                    <TextField
                      label='Inicio'
                      type='time'
                      size='small'
                      value={dia.horaInicio}
                      onChange={e => handleHorarioChange(dia.diaSemana, 'horaInicio', e.target.value)}
                      placeholder='09:00'
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                      label='Fin'
                      type='time'
                      size='small'
                      value={dia.horaFin}
                      onChange={e => handleHorarioChange(dia.diaSemana, 'horaFin', e.target.value)}
                      placeholder='17:00'
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Box>
                )}
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<i className='tabler-chevron-down' />}>
          <Typography>Bloqueos de Horario</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box display='flex' flexDirection='column' gap={2}>
            {bloqueos.map(bloqueo => (
              <Box key={bloqueo.id} display='flex' gap={2} alignItems='center'>
                <TextField
                  label='Inicio'
                  type='date'
                  size='small'
                  value={bloqueo.inicio}
                  onChange={e => actualizarBloqueo(bloqueo.id, 'inicio', e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label='Fin'
                  type='date'
                  size='small'
                  value={bloqueo.fin}
                  onChange={e => actualizarBloqueo(bloqueo.id, 'fin', e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label='Motivo'
                  size='small'
                  value={bloqueo.motivo}
                  onChange={e => actualizarBloqueo(bloqueo.id, 'motivo', e.target.value)}
                  placeholder='Vacaciones, enfermedad, etc.'
                />
                <IconButton color='error' onClick={() => eliminarBloqueo(bloqueo.id)}>
                  <i className='tabler-trash' />
                </IconButton>
              </Box>
            ))}
            <Button variant='outlined' startIcon={<i className='tabler-plus' />} onClick={agregarBloqueo}>
              Agregar Bloqueo
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<i className='tabler-chevron-down' />}>
          <Typography>Servicios y Comisiones</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box display='flex' flexDirection='column' gap={2}>
            <Box display='flex' gap={2} alignItems='center'>
              <Autocomplete
                options={servicios}
                getOptionLabel={option => option.nombre}
                value={servicioSeleccionado}
                onChange={(_, newValue) => setServicioSeleccionado(newValue)}
                renderInput={params => <TextField {...params} label='Seleccionar Servicio' size='small' />}
                sx={{ minWidth: 250 }}
              />
              <TextField
                label='% Comisión'
                type='number'
                size='small'
                value={porcentaje}
                onChange={e => setPorcentaje(e.target.value)}
                placeholder='0-100'
                sx={{ width: 120 }}
                inputProps={{ min: 0, max: 100 }}
              />
              <Button variant='contained' onClick={agregarServicio} startIcon={<i className='tabler-plus' />}>
                Agregar
              </Button>
            </Box>

            {serviciosAgregados.length > 0 && (
              <TableContainer component={Paper} variant='outlined'>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Servicio</TableCell>
                      <TableCell align='center'>% Comisión</TableCell>
                      <TableCell align='center'>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {serviciosAgregados.map(s => (
                      <TableRow key={s.servicioId}>
                        <TableCell>{s.nombre}</TableCell>
                        <TableCell align='center'>{s.porcentaje}%</TableCell>
                        <TableCell align='center'>
                          <IconButton color='error' size='small' onClick={() => eliminarServicio(s.servicioId)}>
                            <i className='tabler-trash' />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Box display='flex' justifyContent='flex-end' gap={2}>
        <Button color='inherit' onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant='contained' onClick={handleSubmit} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      </Box>
    </Box>
  )
}