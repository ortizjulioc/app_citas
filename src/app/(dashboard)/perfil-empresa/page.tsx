'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'

const CATEGORIAS = [
  'SALUD',
  'BELLEZA',
  'AUTOMOTRIZ',
  'PROFESIONAL',
  'EDUCACION',
  'HOGAR',
  'TECNOLOGIA',
  'FITNESS',
  'OTROS'
]

export default function PerfilEmpresa() {
  const { user, hasRole, token, isLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    RNC: '',
    telefono: '',
    email: '',
    direccion: '',
    categoriaServicio: 'OTROS'
  })

  useEffect(() => {
    if (!isLoading && !hasRole('admin') && !user?.negocioId) {
      router.push('/home')
      return
    }

    const fetchNegocio = async () => {
      if (!user?.negocioId) return
      try {
        const res = await fetch(`/api/negocios/${user.negocioId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const json = await res.json()
        if (res.ok && json.success) {
          setFormData({
            nombre: json.data.nombre || '',
            descripcion: json.data.descripcion || '',
            RNC: json.data.RNC || '',
            telefono: json.data.telefono || '',
            email: json.data.email || '',
            direccion: json.data.direccion || '',
            categoriaServicio: json.data.categoriaServicio || 'OTROS'
          })
        }
      } catch (err) {
        console.error('Error fetching negocio:', err)
      } finally {
        setFetching(false)
      }
    }

    if (user?.negocioId) {
      fetchNegocio()
    } else {
      setFetching(false)
    }
  }, [user, isLoading, hasRole, router, token])

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/negocios/${user?.negocioId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Error al actualizar la empresa')
      }

      setSuccess('Perfil de empresa actualizado exitosamente')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetching || isLoading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='50vh'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box p={4}>
      <Typography variant='h4' gutterBottom fontWeight='700' sx={{ mb: 4 }}>
        Perfil de la Empresa
      </Typography>

      <Card sx={{ maxWidth: 800, boxShadow: 3, borderRadius: 2 }}>
        <CardHeader
          title='Información del Negocio'
          subheader='Actualiza los datos públicos y de contacto de tu empresa'
          sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}
        />
        <CardContent sx={{ pt: 4 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Nombre del Negocio'
                  value={formData.nombre}
                  onChange={e => handleChange('nombre', e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <i className='tabler-building-store' />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label='Categoría de Servicio'
                  value={formData.categoriaServicio}
                  onChange={e => handleChange('categoriaServicio', e.target.value)}
                  required
                >
                  {CATEGORIAS.map(cat => (
                    <MenuItem key={cat} value={cat}>
                      {cat.charAt(0) + cat.slice(1).toLowerCase()}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label='Descripción'
                  value={formData.descripcion}
                  onChange={e => handleChange('descripcion', e.target.value)}
                  placeholder='Describe brevemente a qué se dedica tu empresa...'
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='RNC / NIT / Identificación Fiscal'
                  value={formData.RNC}
                  onChange={e => handleChange('RNC', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <i className='tabler-id' />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Teléfono Principal'
                  value={formData.telefono}
                  onChange={e => handleChange('telefono', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <i className='tabler-phone' />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Correo Electrónico'
                  type='email'
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <i className='tabler-mail' />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Dirección'
                  value={formData.direccion}
                  onChange={e => handleChange('direccion', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <i className='tabler-map-pin' />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} display='flex' justifyContent='flex-end' mt={2}>
                <Button
                  type='submit'
                  variant='contained'
                  size='large'
                  disabled={loading}
                  startIcon={
                    loading ? <CircularProgress size={20} color='inherit' /> : <i className='tabler-device-floppy' />
                  }
                  sx={{ borderRadius: 2 }}
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity='success' variant='filled' onClose={() => setSuccess('')} sx={{ borderRadius: 2 }}>
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity='error' variant='filled' onClose={() => setError('')} sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  )
}
