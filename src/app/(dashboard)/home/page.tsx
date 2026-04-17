'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const { isAuthenticated, hasRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (hasRole('admin')) {
      router.push('/empresa')
    } else if (hasRole('cliente')) {
      router.push('/home/empresas')
    } else {
      router.push('/login')
    }
  }, [isAuthenticated, hasRole, router])

  return null
}