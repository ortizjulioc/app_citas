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
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

import { useConfirmDialog } from '@/components/shared/confirm-dialog'

interface Sucursal {
  id: string
  nombre: string
  negocioId: string
  createdAt: string
}

export default function SucursalesList() {
  const { confirm } = useConfirmDialog()
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ nombre: '' })
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const fetchSucursales = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/sucursales')
      const json = await res.json()
      if (res.ok) {
        setSucursales(json.data?.sucursales || [])
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

  const handleOpen = (sucursal?: Sucursal) => {
    if (sucursal) {
      setEditingId(sucursal.id)
      setFormData({ nombre: sucursal.nombre })
    } else {
      setEditingId(null)
      setFormData({ nombre: '' })
    }
    setOpenDialog(true)
  }

  const handleClose = () => {
    setOpenDialog(false)
    setFormData({ nombre: '' })
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) return setErrorMsg('El nombre es requerido')
    
    try {
      const url = editingId ? `/api/sucursales/${editingId}` : '/api/sucursales'
      const method = editingId ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'Error saving data')
        
      setSuccessMsg(`Sucursal ${editingId ? 'actualizada' : 'creada'} con éxito`)
      handleClose()
      fetchSucursales()
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  const handleDelete = async (id: string, nombre: string) => {
    const isConfirmed = await confirm({
      title: 'Eliminar Sucursal',
      message: `¿Estás seguro de que deseas eliminar la sucursal <b>${nombre}</b>? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar'
    })
    
    if (!isConfirmed) return
      
    try {
      const res = await fetch(`/api/sucursales/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'Error deleting sucursal')
      
      setSuccessMsg('Sucursal eliminada')
      fetchSucursales()
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  return (
    <Box className="w-full">
      <Card>
        <CardHeader 
          title="Gestión de Sucursales" 
          action={
            <Button variant="contained" onClick={() => handleOpen()} startIcon={<i className="tabler-plus" />}>
              Nueva Sucursal
            </Button>
          }
        />
        <TableContainer>
          {loading ? (
            <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Fecha Creación</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sucursales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">No hay sucursales registradas</TableCell>
                  </TableRow>
                ) : (
                  sucursales.map(s => (
                    <TableRow key={s.id} hover>
                      <TableCell>{s.nombre}</TableCell>
                      <TableCell>{new Date(s.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell align="center">
                        <IconButton color="primary" onClick={() => handleOpen(s)}>
                          <i className="tabler-edit" />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(s.id, s.nombre)}>
                          <i className="tabler-trash" />
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

      <Dialog open={openDialog} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? 'Editar Sucursal' : 'Nueva Sucursal'}</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            fullWidth
            label="Nombre de la Sucursal"
            value={formData.nombre}
            onChange={e => setFormData({ nombre: e.target.value })}
            margin="normal"
            placeholder="Ej: Sede Central"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar open={!!errorMsg} autoHideDuration={6000} onClose={() => setErrorMsg(null)}>
        <Alert severity="error" onClose={() => setErrorMsg(null)}>{errorMsg}</Alert>
      </Snackbar>
      <Snackbar open={!!successMsg} autoHideDuration={6000} onClose={() => setSuccessMsg(null)}>
        <Alert severity="success" onClose={() => setSuccessMsg(null)}>{successMsg}</Alert>
      </Snackbar>
    </Box>
  )
}
