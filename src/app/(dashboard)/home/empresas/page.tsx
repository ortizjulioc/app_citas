'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Box, Typography, Card, CardContent, Grid, Button, CircularProgress } from '@mui/material'

interface Negocio {
  id: string
  nombre: string
  descripcion: string
  telefono: string
  email: string
  direccion: string
  categoriaServicio: string
}

export default function EmpresasPage() {
  const { isAuthenticated, hasRole } = useAuth()
  const router = useRouter()
  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !hasRole('cliente')) {
      router.push('/login')
      return
    }

    fetchNegocios()
  }, [isAuthenticated, hasRole, router])

  const fetchNegocios = async () => {
    try {
      const response = await fetch('/api/negocios')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Error al obtener empresas')
      }
      
      if (data.data?.negocios) {
        setNegocios(data.data.negocios)
      }
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching negocios:', err)
    } finally {
      setLoading(false)
    }
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
          {negocios.map((negocio) => (
            <Grid item xs={12} sm={6} md={4} key={negocio.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant='h5' component='div' gutterBottom>
                    {negocio.nombre}
                  </Typography>
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
                  <Button variant='contained' fullWidth>
                    Agendar Cita
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}