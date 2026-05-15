'use client'

import { useState, useEffect, useCallback } from 'react'
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
import TablePagination from '@mui/material/TablePagination'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import InputAdornment from '@mui/material/InputAdornment'

import { useAuth } from '@/contexts/AuthContext'
import { useConfirmDialog } from '@/components/shared/confirm-dialog'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface DetalleNomina {
  id: string
  tipo: 'INGRESO' | 'DEDUCCION' | 'AJUSTE'
  descripcion: string
  cantidad: number
}

interface Nomina {
  id: string
  salarioBase: number
  comision: number
  bonos: number | null
  total: number
  empleado: {
    id: string
    nombre: string
    apellido: string
    tipoSalario: string
    salarioBase: number | null
    sucursal: { id: string; nombre: string }
  }
  detalleNominas: DetalleNomina[]
}

interface PeriodoNomina {
  id: string
  fechaInicio: string
  fechaFin: string
  estado: 'ABIERTO' | 'CERRADO' | 'PAGADO' | null
  totalNomina: number
  cantidadEmpleados: number
  nominas: Nomina[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (monto: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(monto)

const fmtFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })

const estadoColor: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
  ABIERTO: 'warning',
  CERRADO: 'default',
  PAGADO: 'success'
}

const estadoLabel: Record<string, string> = {
  ABIERTO: 'Abierto',
  CERRADO: 'Cerrado',
  PAGADO: 'Pagado'
}

const tipoSalarioLabel: Record<string, string> = {
  FIJO: 'Fijo',
  POR_HORA: 'Por Hora',
  POR_COMISION: 'Por Comisión'
}

const tipoDetalleColor: Record<string, string> = {
  INGRESO: '#2e7d32',
  DEDUCCION: '#c62828',
  AJUSTE: '#1565c0'
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function NominaView() {
  const { token } = useAuth()
  const { confirm } = useConfirmDialog()

  // Lista de períodos
  const [periodos, setPeriodos] = useState<PeriodoNomina[]>([])
  const [loadingPeriodos, setLoadingPeriodos] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage] = useState(10)
  const [totalPeriodos, setTotalPeriodos] = useState(0)

  // Dialog: crear período
  const [openCrear, setOpenCrear] = useState(false)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [creando, setCreando] = useState(false)

  // Dialog: detalle de período
  const [periodoDetalle, setPeriodoDetalle] = useState<PeriodoNomina | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [openDetalle, setOpenDetalle] = useState(false)

  // Dialog: ajuste de nómina individual
  const [nominaAjuste, setNominaAjuste] = useState<Nomina | null>(null)
  const [openAjuste, setOpenAjuste] = useState(false)
  const [nuevoTipo, setNuevoTipo] = useState<'INGRESO' | 'DEDUCCION' | 'AJUSTE'>('INGRESO')
  const [nuevoDescripcion, setNuevoDescripcion] = useState('')
  const [nuevoCantidad, setNuevoCantidad] = useState('')
  const [guardandoDetalle, setGuardandoDetalle] = useState(false)

  // Notificaciones
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // ─── Fetch períodos ────────────────────────────────────────────────────────

  const fetchPeriodos = useCallback(async () => {
    setLoadingPeriodos(true)
    try {
      const res = await fetch(`/api/nominas/periodos?page=${page + 1}&limit=${rowsPerPage}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (res.ok) {
        setPeriodos(json.data?.periodos || [])
        setTotalPeriodos(json.data?.pagination?.total || 0)
      } else {
        setErrorMsg(json.error?.message || 'Error al cargar los períodos')
      }
    } catch {
      setErrorMsg('Error de red al cargar los períodos')
    } finally {
      setLoadingPeriodos(false)
    }
  }, [token, page, rowsPerPage])

  useEffect(() => {
    if (token) fetchPeriodos()
  }, [fetchPeriodos, token])

  // ─── Crear período ─────────────────────────────────────────────────────────

  const handleCrearPeriodo = async () => {
    if (!fechaInicio || !fechaFin) {
      setErrorMsg('Debes ingresar fecha de inicio y fin')
      return
    }
    setCreando(true)
    try {
      const res = await fetch('/api/nominas/periodos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fechaInicio, fechaFin })
      })
      const json = await res.json()
      if (res.ok) {
        setSuccessMsg(`Período creado y ${json.data.nominasGeneradas} nóminas generadas exitosamente`)
        setOpenCrear(false)
        setFechaInicio('')
        setFechaFin('')
        fetchPeriodos()
      } else {
        setErrorMsg(json.error?.message || 'Error al crear el período')
      }
    } catch {
      setErrorMsg('Error de red al crear el período')
    } finally {
      setCreando(false)
    }
  }

  // ─── Ver detalle de período ────────────────────────────────────────────────

  const handleVerDetalle = async (periodo: PeriodoNomina) => {
    setLoadingDetalle(true)
    setOpenDetalle(true)
    try {
      const res = await fetch(`/api/nominas/periodos/${periodo.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (res.ok) {
        setPeriodoDetalle(json.data)
      } else {
        setErrorMsg(json.error?.message || 'Error al cargar el detalle')
        setOpenDetalle(false)
      }
    } catch {
      setErrorMsg('Error de red')
      setOpenDetalle(false)
    } finally {
      setLoadingDetalle(false)
    }
  }

  // ─── Cerrar período ────────────────────────────────────────────────────────

  const handleCerrarPeriodo = async (periodo: PeriodoNomina) => {
    const ok = await confirm({
      title: 'Marcar período como pagado',
      message: `¿Estás seguro de que deseas marcar el período ${fmtFecha(periodo.fechaInicio)} – ${fmtFecha(periodo.fechaFin)} como PAGADO? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, marcar como pagado',
      cancelText: 'Cancelar'
    })
    if (!ok) return

    try {
      const res = await fetch(`/api/nominas/periodos/${periodo.id}/cerrar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (res.ok) {
        setSuccessMsg('Período marcado como pagado')
        fetchPeriodos()
        if (periodoDetalle?.id === periodo.id) {
          setPeriodoDetalle(prev => prev ? { ...prev, estado: 'PAGADO' } : prev)
        }
      } else {
        setErrorMsg(json.error?.message || 'Error al cerrar el período')
      }
    } catch {
      setErrorMsg('Error de red')
    }
  }

  // ─── Ajuste de nómina ─────────────────────────────────────────────────────

  const handleAbrirAjuste = (nomina: Nomina) => {
    setNominaAjuste(nomina)
    setNuevoTipo('INGRESO')
    setNuevoDescripcion('')
    setNuevoCantidad('')
    setOpenAjuste(true)
  }

  const handleAgregarDetalle = async () => {
    if (!nominaAjuste || !nuevoDescripcion || !nuevoCantidad) {
      setErrorMsg('Completa todos los campos')
      return
    }
    setGuardandoDetalle(true)
    try {
      const res = await fetch(`/api/nominas/${nominaAjuste.id}/detalles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          tipo: nuevoTipo,
          descripcion: nuevoDescripcion,
          cantidad: parseFloat(nuevoCantidad)
        })
      })
      const json = await res.json()
      if (res.ok) {
        setSuccessMsg('Ajuste agregado correctamente')
        setNuevoDescripcion('')
        setNuevoCantidad('')
        // Recargar el detalle del período
        if (periodoDetalle) await handleVerDetalle(periodoDetalle)
        // Actualizar la nómina en el diálogo
        const nominaActualizada = await fetch(`/api/nominas/${nominaAjuste.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json())
        if (nominaActualizada.data) setNominaAjuste(nominaActualizada.data)
      } else {
        setErrorMsg(json.error?.message || 'Error al agregar ajuste')
      }
    } catch {
      setErrorMsg('Error de red')
    } finally {
      setGuardandoDetalle(false)
    }
  }

  const handleEliminarDetalle = async (detalleId: string) => {
    const ok = await confirm({
      title: 'Eliminar ajuste',
      message: '¿Estás seguro de que deseas eliminar este ajuste?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    })
    if (!ok) return

    try {
      const res = await fetch(`/api/nominas/detalles/${detalleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (res.ok) {
        setSuccessMsg('Ajuste eliminado')
        if (periodoDetalle) await handleVerDetalle(periodoDetalle)
        if (nominaAjuste) {
          const nominaActualizada = await fetch(`/api/nominas/${nominaAjuste.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(r => r.json())
          if (nominaActualizada.data) setNominaAjuste(nominaActualizada.data)
        }
      } else {
        setErrorMsg(json.error?.message || 'Error al eliminar el ajuste')
      }
    } catch {
      setErrorMsg('Error de red')
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: 2 }}>
      {/* Encabezado */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={
            <Typography variant='h5' fontWeight={600}>
              Nómina de Empleados
            </Typography>
          }
          subheader='Gestiona los períodos de pago y las nóminas de tu equipo'
          action={
            <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              onClick={() => setOpenCrear(true)}
            >
              Nuevo Período
            </Button>
          }
        />
      </Card>

      {/* Tabla de períodos */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loadingPeriodos ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : periodos.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <i className='tabler-report-money' style={{ fontSize: 56, opacity: 0.3 }} />
              <Typography variant='h6' color='text.secondary' mt={2}>
                No hay períodos de nómina todavía
              </Typography>
              <Typography variant='body2' color='text.secondary' mb={3}>
                Crea tu primer período para generar las nóminas del equipo
              </Typography>
              <Button variant='outlined' startIcon={<i className='tabler-plus' />} onClick={() => setOpenCrear(true)}>
                Crear primer período
              </Button>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Período</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align='center'>
                        Empleados
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align='right'>
                        Total Nómina
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align='center'>
                        Acciones
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {periodos.map(periodo => (
                      <TableRow key={periodo.id} hover>
                        <TableCell>
                          <Typography variant='body2' fontWeight={500}>
                            {fmtFecha(periodo.fechaInicio)} – {fmtFecha(periodo.fechaFin)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={estadoLabel[periodo.estado ?? 'ABIERTO'] ?? periodo.estado}
                            color={estadoColor[periodo.estado ?? 'ABIERTO'] ?? 'default'}
                            size='small'
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Typography variant='body2'>{periodo.cantidadEmpleados}</Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2' fontWeight={600} color='primary.main'>
                            {fmt(periodo.totalNomina)}
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Stack direction='row' spacing={0.5} justifyContent='center'>
                            <Tooltip title='Ver detalle'>
                              <IconButton size='small' color='primary' onClick={() => handleVerDetalle(periodo)}>
                                <i className='tabler-eye' />
                              </IconButton>
                            </Tooltip>
                            {periodo.estado !== 'PAGADO' && (
                              <Tooltip title='Marcar como pagado'>
                                <IconButton size='small' color='success' onClick={() => handleCerrarPeriodo(periodo)}>
                                  <i className='tabler-circle-check' />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component='div'
                count={totalPeriodos}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[10]}
                labelRowsPerPage='Por página'
                labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* ─── Dialog: Crear período ─────────────────────────────────────────── */}
      <Dialog open={openCrear} onClose={() => !creando && setOpenCrear(false)} maxWidth='xs' fullWidth>
        <DialogTitle>
          <Typography variant='h6' fontWeight={600}>
            Nuevo Período de Nómina
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Se calcularán automáticamente las nóminas de todos los empleados activos
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                label='Fecha de inicio'
                type='date'
                fullWidth
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label='Fecha de fin'
                type='date'
                fullWidth
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: fechaInicio }}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'info.lighter', borderRadius: 1 }}>
            <Typography variant='caption' color='info.dark'>
              <strong>Cálculo automático:</strong> empleados con salario fijo reciben su salario base; empleados por
              comisión reciben el % acordado de cada servicio realizado en el período.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenCrear(false)} disabled={creando}>
            Cancelar
          </Button>
          <Button variant='contained' onClick={handleCrearPeriodo} disabled={creando || !fechaInicio || !fechaFin}>
            {creando ? <CircularProgress size={20} /> : 'Generar nómina'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Dialog: Detalle de período ────────────────────────────────────── */}
      <Dialog
        open={openDetalle}
        onClose={() => setOpenDetalle(false)}
        maxWidth='lg'
        fullWidth
        PaperProps={{ sx: { minHeight: '60vh' } }}
      >
        <DialogTitle>
          {periodoDetalle ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant='h6' fontWeight={600}>
                  Nómina: {fmtFecha(periodoDetalle.fechaInicio)} – {fmtFecha(periodoDetalle.fechaFin)}
                </Typography>
                <Stack direction='row' spacing={1} alignItems='center' mt={0.5}>
                  <Chip
                    label={estadoLabel[periodoDetalle.estado ?? 'ABIERTO'] ?? periodoDetalle.estado}
                    color={estadoColor[periodoDetalle.estado ?? 'ABIERTO'] ?? 'default'}
                    size='small'
                  />
                  <Typography variant='body2' color='text.secondary'>
                    {periodoDetalle.nominas?.length ?? 0} empleados
                  </Typography>
                </Stack>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant='caption' color='text.secondary'>
                  Total a pagar
                </Typography>
                <Typography variant='h5' fontWeight={700} color='primary.main'>
                  {fmt(periodoDetalle.nominas?.reduce((a, n) => a + n.total, 0) ?? 0)}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Typography variant='h6'>Cargando...</Typography>
          )}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 0 }}>
          {loadingDetalle ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : !periodoDetalle || !periodoDetalle.nominas?.length ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color='text.secondary'>No hay nóminas en este período</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Empleado</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Tipo salario</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align='right'>
                      Salario Base
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align='right'>
                      Comisiones
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align='right'>
                      Bonos
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align='right'>
                      Deducciones
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align='right'>
                      Total
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align='center'>
                      Ajustar
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {periodoDetalle.nominas.map(nomina => {
                    const deducciones = nomina.detalleNominas
                      .filter(d => d.tipo === 'DEDUCCION')
                      .reduce((a, d) => a + d.cantidad, 0)
                    return (
                      <TableRow key={nomina.id} hover>
                        <TableCell>
                          <Typography variant='body2' fontWeight={500}>
                            {nomina.empleado.nombre} {nomina.empleado.apellido}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {nomina.empleado.sucursal?.nombre}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={tipoSalarioLabel[nomina.empleado.tipoSalario] ?? nomina.empleado.tipoSalario}
                            size='small'
                            variant='outlined'
                          />
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2'>{fmt(nomina.salarioBase)}</Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2' color={nomina.comision > 0 ? 'success.main' : 'text.secondary'}>
                            {fmt(nomina.comision)}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2' color={(nomina.bonos ?? 0) > 0 ? 'success.main' : 'text.secondary'}>
                            {fmt(nomina.bonos ?? 0)}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2' color={deducciones > 0 ? 'error.main' : 'text.secondary'}>
                            {deducciones > 0 ? `-${fmt(deducciones)}` : fmt(0)}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2' fontWeight={700} color='primary.main'>
                            {fmt(nomina.total)}
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Tooltip
                            title={
                              periodoDetalle.estado === 'PAGADO'
                                ? 'El período ya fue pagado'
                                : 'Agregar ajuste / deducción'
                            }
                          >
                            <span>
                              <IconButton
                                size='small'
                                color='primary'
                                onClick={() => handleAbrirAjuste(nomina)}
                                disabled={periodoDetalle.estado === 'PAGADO'}
                              >
                                <i className='tabler-adjustments-horizontal' />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          {periodoDetalle && periodoDetalle.estado !== 'PAGADO' && (
            <Button
              variant='contained'
              color='success'
              startIcon={<i className='tabler-circle-check' />}
              onClick={() => handleCerrarPeriodo(periodoDetalle)}
            >
              Marcar como pagado
            </Button>
          )}
          <Button onClick={() => setOpenDetalle(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Dialog: Ajuste de nómina individual ──────────────────────────── */}
      <Dialog open={openAjuste} onClose={() => setOpenAjuste(false)} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Typography variant='h6' fontWeight={600}>
            Ajustar nómina
          </Typography>
          {nominaAjuste && (
            <Typography variant='body2' color='text.secondary'>
              {nominaAjuste.empleado.nombre} {nominaAjuste.empleado.apellido} — Total actual:{' '}
              <strong>{fmt(nominaAjuste.total)}</strong>
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {/* Lista de detalles actuales */}
          {nominaAjuste && nominaAjuste.detalleNominas.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant='subtitle2' fontWeight={600} mb={1}>
                Detalles actuales
              </Typography>
              <Paper variant='outlined' sx={{ overflow: 'hidden' }}>
                {nominaAjuste.detalleNominas.map((d, idx) => (
                  <Box
                    key={d.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 2,
                      py: 1,
                      borderBottom:
                        idx < nominaAjuste.detalleNominas.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider'
                    }}
                  >
                    <Box>
                      <Chip
                        label={d.tipo}
                        size='small'
                        sx={{
                          bgcolor: tipoDetalleColor[d.tipo],
                          color: 'white',
                          fontSize: '0.65rem',
                          mr: 1,
                          height: 18
                        }}
                      />
                      <Typography variant='body2' component='span'>
                        {d.descripcion}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant='body2'
                        fontWeight={600}
                        color={
                          d.tipo === 'DEDUCCION'
                            ? 'error.main'
                            : d.tipo === 'INGRESO'
                              ? 'success.main'
                              : 'info.main'
                        }
                      >
                        {d.tipo === 'DEDUCCION' ? '-' : '+'}{fmt(d.cantidad)}
                      </Typography>
                      <Tooltip title='Eliminar'>
                        <IconButton size='small' color='error' onClick={() => handleEliminarDetalle(d.id)}>
                          <i className='tabler-trash' style={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </Paper>
            </Box>
          )}

          <Divider sx={{ mb: 2 }} />

          {/* Formulario para nuevo ajuste */}
          <Typography variant='subtitle2' fontWeight={600} mb={2}>
            Agregar nuevo ajuste
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={nuevoTipo}
                  label='Tipo'
                  onChange={e => setNuevoTipo(e.target.value as any)}
                >
                  <MenuItem value='INGRESO'>Ingreso / Bono</MenuItem>
                  <MenuItem value='DEDUCCION'>Deducción</MenuItem>
                  <MenuItem value='AJUSTE'>Ajuste</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                label='Descripción'
                fullWidth
                size='small'
                value={nuevoDescripcion}
                onChange={e => setNuevoDescripcion(e.target.value)}
                placeholder='Ej: Bono de productividad, AFP, SFS...'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label='Monto'
                fullWidth
                size='small'
                type='number'
                value={nuevoCantidad}
                onChange={e => setNuevoCantidad(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position='start'>RD$</InputAdornment> }}
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                variant='contained'
                fullWidth
                onClick={handleAgregarDetalle}
                disabled={guardandoDetalle || !nuevoDescripcion || !nuevoCantidad}
                startIcon={guardandoDetalle ? <CircularProgress size={16} /> : <i className='tabler-plus' />}
              >
                Agregar
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenAjuste(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Notificaciones ───────────────────────────────────────────────── */}
      <Snackbar
        open={!!successMsg}
        autoHideDuration={4000}
        onClose={() => setSuccessMsg(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity='success' onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!errorMsg}
        autoHideDuration={5000}
        onClose={() => setErrorMsg(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity='error' onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      </Snackbar>
    </Box>
  )
}
