'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Typography,
  Pagination
} from '@mui/material'
import { IconPencil, IconTrash, IconPlus } from '@tabler/icons-react'

interface Sucursal {
  id: string
  nombre: string
  negocioId: string | null
  createdAt: string
}

interface PaginationInfo {
  total: number
  page: number
  totalPages: number
}

export default function SucursalList() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({ total: 0, page: 1, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editSucursal, setEditSucursal] = useState<Sucursal | null>(null)
  const [formData, setFormData] = useState({ nombre: '', negocioId: '' })

  const fetchSucursales = async (page = 1, searchTerm = '') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm })
      })
      const res = await fetch(`/api/sucursales?${params}`)
      const data = await res.json()
      if (data.success) {
        setSucursales(data.data.sucursales)
        setPagination(data.data.pagination)
      }
    } catch (error) {
      console.error('Error fetching sucursales:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSucursales(1, search)
  }, [])

  const handleSearch = () => {
    fetchSucursales(1, search)
  }

  const handlePageChange = (_: any, page: number) => {
    fetchSucursales(page, search)
  }

  const handleOpenDialog = (sucursal?: Sucursal) => {
    if (sucursal) {
      setEditSucursal(sucursal)
      setFormData({ nombre: sucursal.nombre || '', negocioId: sucursal.negocioId || '' })
    } else {
      setEditSucursal(null)
      setFormData({ nombre: '', negocioId: '' })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditSucursal(null)
  }

  const handleSave = async () => {
    try {
      const url = editSucursal ? `/api/sucursales/${editSucursal.id}` : '/api/sucursales'
      const method = editSucursal ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        handleCloseDialog()
        fetchSucursales(pagination.page, search)
      }
    } catch (error) {
      console.error('Error saving sucursal:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta sucursal?')) return
    try {
      const res = await fetch(`/api/sucursales/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        fetchSucursales(pagination.page, search)
      }
    } catch (error) {
      console.error('Error deleting sucursal:', error)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant='h4'>Sucursales</Typography>
        <Button variant='contained' startIcon={<IconPlus />} onClick={() => handleOpenDialog()}>
          Nueva Sucursal
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label='Buscar'
          variant='outlined'
          size='small'
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <Button variant='outlined' onClick={handleSearch}>
          Buscar
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>ID Negocio</TableCell>
              <TableCell>Fecha Creacion</TableCell>
              <TableCell align='right'>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align='center'>
                  Cargando...
                </TableCell>
              </TableRow>
            ) : sucursales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align='center'>
                  No hay sucursales
                </TableCell>
              </TableRow>
            ) : (
              sucursales.map(sucursal => (
                <TableRow key={sucursal.id}>
                  <TableCell>{sucursal.nombre}</TableCell>
                  <TableCell>{sucursal.negocioId || '-'}</TableCell>
                  <TableCell>{new Date(sucursal.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align='right'>
                    <IconButton color='primary' onClick={() => handleOpenDialog(sucursal)}>
                      <IconPencil />
                    </IconButton>
                    <IconButton color='error' onClick={() => handleDelete(sucursal.id)}>
                      <IconTrash />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination count={pagination.totalPages} page={pagination.page} onChange={handlePageChange} color='primary' />
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
        <DialogTitle>{editSucursal ? 'Editar Sucursal' : 'Nueva Sucursal'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label='Nombre'
              value={formData.nombre}
              onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label='ID Negocio (opcional)'
              value={formData.negocioId}
              onChange={e => setFormData({ ...formData, negocioId: e.target.value })}
              fullWidth
              helperText='Dejar vacío para usar el negocio del usuario logeado'
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button variant='contained' onClick={handleSave}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
