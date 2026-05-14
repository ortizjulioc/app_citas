'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material'

export default function ClientePerfilPage() {
  const { isAuthenticated, hasRole, user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || !hasRole('cliente')) {
      router.push('/login')
      return
    }
    setLoading(false)
  }, [isAuthenticated, hasRole, router])

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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' gutterBottom>
        Mi Perfil
      </Typography>
      <Card sx={{ maxWidth: 600 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Información Personal
          </Typography>
          <Typography variant='body1'>
            <strong>Nombre:</strong> {user?.nombre} {user?.apellido}
          </Typography>
          <Typography variant='body1'>
            <strong>Email:</strong> {user?.email}
          </Typography>
          <Typography variant='body1'>
            <strong>Teléfono:</strong> {user?.telefono || 'No registrado'}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
