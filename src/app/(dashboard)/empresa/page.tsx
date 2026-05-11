'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

export default function EmpresaPage() {
  // Extraemos isLoading del contexto
  const { isAuthenticated, hasRole, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // 1. Solo evaluamos la redirección si el Contexto terminó de cargar (isLoading === false)
    if (!isLoading) {
      if (!isAuthenticated || !hasRole('admin')) {
        console.log('Acceso denegado o no autenticado. Redirigiendo...')
        router.push('/login')
      }
    }
  }, [isAuthenticated, hasRole, router, isLoading])

  // 2. Mientras isLoading sea true, o si no estamos autenticados aún, mostramos el loader
  // Esto evita el "flicker" donde se ve la página un segundo antes de ser expulsado
  if (isLoading || !isAuthenticated || !hasRole('admin')) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='100vh' // Cambiado a 100vh para centrarlo en toda la pantalla
      >
        <CircularProgress />
      </Box>
    )
  }

  // 3. Si llegamos aquí, es porque isLoading es false, isAuthenticated es true y el rol es admin
  return (
    <div className='flex items-center justify-center bs-full'>
      <div className='flex flex-col items-center gap-4'>
        <Typography variant='h3'>¡Hola Empresa! 👋</Typography>
        <Typography>Bienvenido al panel de administración de tu negocio.</Typography>
      </div>
    </div>
  )
}
