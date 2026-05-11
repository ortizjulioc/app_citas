'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

export default function ClientePage() {
  const { isAuthenticated, hasRole, isLoading } = useAuth() // Agregar isLoading
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      // Solo evaluar cuando ya sabemos si hay sesión o no
      if (!isAuthenticated || !hasRole('cliente')) {
        router.push('/login')
      }
    }
  }, [isAuthenticated, hasRole, router, isLoading])

  // Si está cargando el contexto O validando, mostrar loader
  if (isLoading || !isAuthenticated || !hasRole('cliente')) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='100vh'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <div className='flex items-center justify-center bs-full'>
      <div className='flex flex-col items-center gap-4'>
        <Typography variant='h3'>¡Hola Cliente! 👋</Typography>
        <Typography>Bienvenido a tu panel de gestión de citas.</Typography>
      </div>
    </div>
  )
}
