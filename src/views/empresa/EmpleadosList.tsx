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
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

import { useConfirmDialog } from '@/components/shared/confirm-dialog'
import EmpleadoForm from '@/components/empleados/EmpleadoForm'

interface Empleado {
  id: string
  nombre: string
  apellido: string
  telefono: string
  email: string
  tipoSalario: string
  salarioBase: number | null
  fechaContratacion: string | null
  sucursalId: string
  createdAt: string
}

interface Sucursal {
  id: string
  nombre: string
}

export default function EmpleadosList() {
  const { confirm } = useConfirmDialog()
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [sucursalId, setSucursalId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [initialData, setInitialData] = useState<any>(null)

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const fetchSucursales = async () => {
    try {
      const res = await fetch('/api/sucursales?limit=100')
      const json = await res.json()
      if (res.ok) {
        const sucursalesData = json.data?.sucursales || []
        setSucursales(sucursalesData)
        if (sucursalesData.length > 0 && !sucursalId) {
          setSucursalId(sucursalesData[0].id)
        }
      }
    } catch (err) {
      console.error('Error fetching sucursales', err)
    }
  }

  const fetchEmpleados = async () => {
    try {
      setLoading(true)
      const url = sucursalId ? `/api/empleados?sucursalId=${sucursalId}` : '/api/empleados'
      const res = await fetch(url)
      const json = await res.json()
      if (res.ok) {
        setEmpleados(json.data?.empleados || [])
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
  }, [])

  useEffect(() => {
    if (sucursalId) {
      fetchEmpleados()
    }
  }, [sucursalId])

  const handleOpen = async (empleado?: Empleado) => {
    if (empleado) {
      try {
        const res = await fetch(`/api/empleados/${empleado.id}`)
        const json = await res.json()
        if (res.ok) {
          const data = json.data
          setInitialData({
            nombre: data.nombre,
            apellido: data.apellido,
            telefono: data.telefono,
            email: data.email,
            tipoSalario: data.tipoSalario,
            salarioBase: data.salarioBase,
            fechaContratacion: data.fechaContratacion,
            sucursalId: data.sucursalId,
            horario: data.horarioEmpleados?.map((h: any) => ({
              diaSemana: h.diaSemana,
              horaInicio: h.horaInicio?.substring(0, 5) || '',
              horaFin: h.horaFin?.substring(0, 5) || ''
            })) || [],
            bloqueos: data.bloqueoHorarios?.map((b: any) => ({
              id: b.id,
              inicio: b.inicio?.split('T')[0] || '',
              fin: b.fin?.split('T')[0] || '',
              motivo: b.motivo || ''
            })) || [],
            servicios: data.comisionEmpleados?.map((c: any) => ({
              servicioId: c.servicioId,
              nombre: c.servicio?.nombre || '',
              porcentaje: c.porcentaje
            })) || []
          })
        }
      } catch (err) {
        console.error('Error fetching empleado details', err)
      }
      setEditingId(empleado.id)
    } else {
      setEditingId(null)
      setInitialData(undefined)
    }
    setOpenDialog(true)
  }

  const handleClose = () => {
    setOpenDialog(false)
    setEditingId(null)
    setInitialData(null)
  }

  const handleSave = async (data: any) => {
    const url = editingId ? `/api/empleados/${editingId}` : '/api/empleados'
    const method = editingId ? 'PUT' : 'POST'

    const body = { ...data }
    if (editingId) {
      delete body.email
      delete body.password
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message || 'Error saving data')

    setSuccessMsg(`Empleado ${editingId ? 'actualizado' : 'creado'} con éxito`)
    handleClose()
    fetchEmpleados()
  }

  const handleDelete = async (id: string, nombre: string) => {
    const isConfirmed = await confirm({
      title: 'Eliminar Empleado',
      message: `¿Estás seguro de que deseas eliminar al empleado <b>${nombre}</b>? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar'
    })

    if (!isConfirmed) return

    try {
      const res = await fetch(`/api/empleados/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'Error deleting empleado')

      setSuccessMsg('Empleado eliminado')
      fetchEmpleados()
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  const getSucursalName = (sid: string) => {
    const sucursal = sucursales.find(s => s.id === sid)
    return sucursal?.nombre || '-'
  }

  return (
    <Box className='w-full'>
      <Card>
        <CardHeader
          title='Gestión de Empleados'
          action={
            <Button variant='contained' onClick={() => handleOpen()} startIcon={<i className='tabler-plus' />}>
              Nuevo Empleado
            </Button>
          }
        />
        <TableContainer>
          {loading ? (
            <Box p={4} display='flex' justifyContent='center'>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Tipo Salario</TableCell>
                  <TableCell>Sucursal</TableCell>
                  <TableCell align='center'>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {empleados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
                      No hay empleados registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  empleados.map(e => (
                    <TableRow key={e.id} hover>
                      <TableCell>
                        {e.nombre} {e.apellido}
                      </TableCell>
                      <TableCell>{e.telefono}</TableCell>
                      <TableCell>{e.email}</TableCell>
                      <TableCell>{e.tipoSalario}</TableCell>
                      <TableCell>{getSucursalName(e.sucursalId)}</TableCell>
                      <TableCell align='center'>
                        <IconButton color='primary' onClick={() => handleOpen(e)}>
                          <i className='tabler-edit' />
                        </IconButton>
                        <IconButton color='error' onClick={() => handleDelete(e.id, `${e.nombre} ${e.apellido}`)}>
                          <i className='tabler-trash' />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Card>

      <Dialog open={openDialog} onClose={handleClose} fullWidth maxWidth='md'>
        <DialogTitle>{editingId ? 'Editar Empleado' : 'Nuevo Empleado'}</DialogTitle>
        <DialogContent dividers>
          {sucursalId && (
            <EmpleadoForm
              initialData={initialData}
              isEditing={!!editingId}
              sucursalId={sucursalId}
              onSave={handleSave}
              onCancel={handleClose}
            />
          )}
        </DialogContent>
      </Dialog>

      <Snackbar open={!!errorMsg} autoHideDuration={6000} onClose={() => setErrorMsg(null)}>
        <Alert severity='error' onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      </Snackbar>
      <Snackbar open={!!successMsg} autoHideDuration={6000} onClose={() => setSuccessMsg(null)}>
        <Alert severity='success' onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      </Snackbar>
    </Box>
  )
}