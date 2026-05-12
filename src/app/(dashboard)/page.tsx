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
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (hasRole('admin')) {
      router.push('/empresa')
    } else if (hasRole('empleado')) {
      router.push('/empleado/citas')
    } else if (hasRole('cliente')) {
      router.push('/cliente')
    } else {
      router.push('/login')
    }
  }, [isAuthenticated, hasRole, router])

  return (
    <Box display='flex' justifyContent='center' alignItems='center' minHeight='50vh'>
      <CircularProgress />
    </Box>
  )


}