'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

export default function DashboardPage() {
  const { isAuthenticated, hasRole } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || !hasRole('admin')) {
      router.push('/login')
      return
    }
    setLoading(false)
  }, [isAuthenticated, hasRole, router])

  if (loading || !isAuthenticated || !hasRole('admin')) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='50vh'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <div className='flex items-center justify-center bs-full'>
      <div className='flex flex-col items-center gap-4'>
        <Typography variant='h3'>¡Bienvenido! 👋</Typography>
        <Typography>Esta es la página principal del dashboard.</Typography>
      </div>
    </div>
  )
}