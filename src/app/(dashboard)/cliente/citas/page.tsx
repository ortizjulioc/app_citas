'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Box, Typography, CircularProgress } from '@mui/material'

export default function ClienteCitasPage() {
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
        Mis Citas
      </Typography>
      <Typography variant='body1'>
        Bienvenido, {user?.nombre}. Aquí podrás ver tus citas programadas.
      </Typography>
    </Box>
  )
}