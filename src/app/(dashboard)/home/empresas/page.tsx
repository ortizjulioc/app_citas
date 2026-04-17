'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Box, Typography, Card, CardContent, Grid, Button, CircularProgress, Snackbar, Alert } from '@mui/material'

interface Negocio {
  id: string
  nombre: string
  descripcion: string
  telefono: string | null
  email: string | null
  direccion: string | null
  categoriaServicio: string
}

export default function EmpresasPage() {
  const { isAuthenticated, hasRole, user } = useAuth()
  const router = useRouter()
  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [misNegociosIds, setMisNegociosIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    if (!isAuthenticated || !hasRole('cliente')) {
      router.push('/login')
      return
    }

    fetchData()
  }, [isAuthenticated, hasRole, router, user?.email])

  const fetchData = async () => {
    try {
      const [negociosRes, clienteNegociosRes] = await Promise.all([
        fetch('/api/negocios'),
        user?.email ? fetch(`/api/cliente-negocios?email=${encodeURIComponent(user.email)}`) : Promise.resolve(null)
      ])

      const negociosData = await negociosRes.json()
      if (!negociosRes.ok) {
        throw new Error(negociosData.error?.message || 'Error al obtener empresas')
      }

      if (negociosData.data?.negocios) {
        setNegocios(negociosData.data.negocios)
      }

      if (clienteNegociosRes) {
        const clienteData = await clienteNegociosRes.json()
        if (clienteData.data?.negocios) {
          const ids = new Set<string>(clienteData.data.negocios.map((n: Negocio) => n.id))
          setMisNegociosIds(ids)
        }
      }
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAgendar = (negocioId: string, negocioNombre: string) => {
    router.push(`/home/empresas/${negocioId}/cita?nombre=${encodeURIComponent(negocioNombre)}`)
  }

  if (!isAuthenticated || !hasRole('cliente')) {
    return null
  }

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='50vh'>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color='error'>{error}</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' gutterBottom>
        Empresas Disponibles
      </Typography>
      <Typography variant='body1' sx={{ mb: 4 }}>
        Selecciona una empresa para agendar tu cita
      </Typography>

      {negocios.length === 0 ? (
        <Typography>No hay empresas disponibles</Typography>
      ) : (
        <Grid container spacing={3}>
          {negocios.map((negocio) => {
            const esMiEmpresa = misNegociosIds.has(negocio.id)

            return (
              <Grid item xs={12} sm={6} md={4} key={negocio.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display='flex' justifyContent='space-between' alignItems='start' mb={2}>
                      <Typography variant='h5' component='div'>
                        {negocio.nombre}
                      </Typography>
                      {esMiEmpresa && (
                        <Button variant='outlined' color='success' size='small'>
                          Mi empresa
                        </Button>
                      )}
                    </Box>
                    <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                      {negocio.descripcion || 'Sin descripción'}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      <strong>Categoría:</strong> {negocio.categoriaServicio}
                    </Typography>
                    {negocio.direccion && (
                      <Typography variant='body2' color='text.secondary'>
                        <strong>Dirección:</strong> {negocio.direccion}
                      </Typography>
                    )}
                    {negocio.telefono && (
                      <Typography variant='body2' color='text.secondary'>
                        <strong>Teléfono:</strong> {negocio.telefono}
                      </Typography>
                    )}
                    {negocio.email && (
                      <Typography variant='body2' color='text.secondary'>
                        <strong>Email:</strong> {negocio.email}
                      </Typography>
                    )}
                  </CardContent>
                  <Box sx={{ p: 2 }}>
                    <Button
                      variant='contained'
                      fullWidth
                      onClick={() => handleAgendar(negocio.id, negocio.nombre)}
                    >
                      Agendar Cita
                    </Button>
                  </Box>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}