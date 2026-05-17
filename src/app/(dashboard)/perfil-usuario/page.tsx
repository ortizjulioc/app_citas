'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import InputAdornment from '@mui/material/InputAdornment'

export default function PerfilUsuario() {
  const { user, login, token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    password: ''
  })

  useEffect(() => {
    const fetchUser = async () => {
      if (!user?.id) return
      try {
        const res = await fetch(`/api/usuarios/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const json = await res.json()
        if (res.ok && json.success) {
          setFormData({
            nombre: json.data.nombre || '',
            apellido: json.data.apellido || '',
            telefono: json.data.telefono || '',
            email: json.data.email || '',
            password: ''
          })
        }
      } catch (err) {
        console.error('Error fetching user:', err)
      } finally {
        setFetching(false)
      }
    }
    fetchUser()
  }, [user?.id, token])

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const dataToUpdate: any = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono
      }

      if (formData.password) {
        dataToUpdate.password = formData.password
      }

      const res = await fetch(`/api/usuarios/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(dataToUpdate)
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Error al actualizar el perfil')
      }

      setSuccess('Perfil actualizado exitosamente')

      // Actualizar el contexto de autenticación para reflejar el nuevo nombre
      if (user && token) {
        login(token, {
          ...user,
          nombre: formData.nombre,
          apellido: formData.apellido,
          telefono: formData.telefono
        })
      }

      setFormData(prev => ({ ...prev, password: '' }))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='50vh'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box p={4}>
      <Typography variant='h4' gutterBottom fontWeight='700' sx={{ mb: 4 }}>
        Perfil de Usuario
      </Typography>

      <Card sx={{ maxWidth: 800, boxShadow: 3, borderRadius: 2 }}>
        <CardHeader
          title='Información Personal'
          subheader='Actualiza tus datos básicos y contraseña'
          sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}
        />
        <CardContent sx={{ pt: 4 }}>
          <form onSubmit={handleSubmit}>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='col-span-1'>
                <TextField
                  fullWidth
                  label='Nombre'
                  value={formData.nombre}
                  onChange={e => handleChange('nombre', e.target.value)}
                  required
                />
              </div>
              <div className='col-span-1'>
                <TextField
                  fullWidth
                  label='Apellido'
                  value={formData.apellido}
                  onChange={e => handleChange('apellido', e.target.value)}
                  required
                />
              </div>
              <div className='col-span-1'>
                <TextField
                  fullWidth
                  label='Teléfono'
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
              </div>
              <div className='col-span-1'>
                <TextField
                  fullWidth
                  label='Correo Electrónico'
                  value={formData.email}
                  disabled
                  helperText='El correo electrónico no se puede cambiar'
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <i className='tabler-mail' />
                      </InputAdornment>
                    )
                  }}
                />
              </div>
              <div className='col-span-1 md:col-span-2'>
                <TextField
                  fullWidth
                  label='Nueva Contraseña'
                  type='password'
                  value={formData.password}
                  onChange={e => handleChange('password', e.target.value)}
                  placeholder='Deja en blanco para no cambiarla'
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <i className='tabler-lock' />
                      </InputAdornment>
                    )
                  }}
                />
              </div>

              <div className='col-span-1 md:col-span-2 flex justify-end mt-2'>
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
              </div>
            </div>
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
