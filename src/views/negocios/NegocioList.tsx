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
  Pagination,
  Chip
} from '@mui/material'
import { IconPencil, IconTrash, IconPlus } from '@tabler/icons-react'

interface Negocio {
  id: string
  nombre: string
  descripcion: string | null
  RNC: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  createdAt: string
}

interface PaginationInfo {
  total: number
  page: number
  totalPages: number
}

export default function NegocioList() {
  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({ total: 0, page: 1, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editNegocio, setEditNegocio] = useState<Negocio | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    RNC: '',
    telefono: '',
    email: '',
    direccion: ''
  })

  const fetchNegocios = async (page = 1, searchTerm = '') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm })
      })
      const res = await fetch(`/api/negocios?${params}`)
      const data = await res.json()
      if (data.success) {
        setNegocios(data.data.negocios)
        setPagination(data.data.pagination)
      }
    } catch (error) {
      console.error('Error fetching negocios:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNegocios(1, search)
  }, [])

  const handleSearch = () => {
    fetchNegocios(1, search)
  }

  const handlePageChange = (_: any, page: number) => {
    fetchNegocios(page, search)
  }

  const handleOpenDialog = (negocio?: Negocio) => {
    if (negocio) {
      setEditNegocio(negocio)
      setFormData({
        nombre: negocio.nombre || '',
        descripcion: negocio.descripcion || '',
        RNC: negocio.RNC || '',
        telefono: negocio.telefono || '',
        email: negocio.email || '',
        direccion: negocio.direccion || ''
      })
    } else {
      setEditNegocio(null)
      setFormData({ nombre: '', descripcion: '', RNC: '', telefono: '', email: '', direccion: '' })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditNegocio(null)
  }

  const handleSave = async () => {
    try {
      const url = editNegocio ? `/api/negocios/${editNegocio.id}` : '/api/negocios'
      const method = editNegocio ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        handleCloseDialog()
        fetchNegocios(pagination.page, search)
      }
    } catch (error) {
      console.error('Error saving negocio:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este negocio?')) return
    try {
      const res = await fetch(`/api/negocios/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        fetchNegocios(pagination.page, search)
      }
    } catch (error) {
      console.error('Error deleting negocio:', error)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant='h4'>Negocios</Typography>
        <Button variant='contained' startIcon={<IconPlus />} onClick={() => handleOpenDialog()}>
          Nuevo Negocio
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
              <TableCell>Descripcion</TableCell>
              <TableCell>RNC</TableCell>
              <TableCell>Telefono</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align='right'>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align='center'>
                  Cargando...
                </TableCell>
              </TableRow>
            ) : negocios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align='center'>
                  No hay negocios
                </TableCell>
              </TableRow>
            ) : (
              negocios.map(negocio => (
                <TableRow key={negocio.id}>
                  <TableCell>{negocio.nombre}</TableCell>
                  <TableCell>{negocio.descripcion || '-'}</TableCell>
                  <TableCell>{negocio.RNC || '-'}</TableCell>
                  <TableCell>{negocio.telefono || '-'}</TableCell>
                  <TableCell>{negocio.email || '-'}</TableCell>
                  <TableCell align='right'>
                    <IconButton color='primary' onClick={() => handleOpenDialog(negocio)}>
                      <IconPencil />
                    </IconButton>
                    <IconButton color='error' onClick={() => handleDelete(negocio.id)}>
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
        <DialogTitle>{editNegocio ? 'Editar Negocio' : 'Nuevo Negocio'}</DialogTitle>
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
              label='Descripcion'
              value={formData.descripcion}
              onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label='RNC'
              value={formData.RNC}
              onChange={e => setFormData({ ...formData, RNC: e.target.value })}
              fullWidth
            />
            <TextField
              label='Telefono'
              value={formData.telefono}
              onChange={e => setFormData({ ...formData, telefono: e.target.value })}
              fullWidth
            />
            <TextField
              label='Email'
              type='email'
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              fullWidth
            />
            <TextField
              label='Direccion'
              value={formData.direccion}
              onChange={e => setFormData({ ...formData, direccion: e.target.value })}
              fullWidth
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
