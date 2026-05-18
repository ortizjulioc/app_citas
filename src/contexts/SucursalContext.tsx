'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface Sucursal {
  id: string
  nombre: string
  // Agrega más campos si es necesario
}

interface SucursalContextType {
  sucursales: Sucursal[]
  sucursalSeleccionada: Sucursal | null
  setSucursalSeleccionada: (sucursal: Sucursal) => void
  isLoading: boolean
}

const SucursalContext = createContext<SucursalContextType | undefined>(undefined)

const STORAGE_KEY = 'sucursal_seleccionada'

export function SucursalProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth()
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [sucursalSeleccionada, setSucursalSeleccionadaState] = useState<Sucursal | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchSucursales()
    } else {
      setSucursales([])
      setSucursalSeleccionadaState(null)
      setIsLoading(false)
    }
  }, [isAuthenticated, token])

  const fetchSucursales = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/sucursales?limit=100', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const result = await response.json()
      if (result.success) {
        const data = result.data.sucursales || []
        setSucursales(data)
        
        // Tratar de recuperar la sucursal guardada
        const storedId = localStorage.getItem(STORAGE_KEY)
        if (storedId) {
          const found = data.find((s: Sucursal) => s.id === storedId)
          if (found) {
            setSucursalSeleccionadaState(found)
          } else if (data.length > 0) {
            setSucursalSeleccionadaState(data[0])
          }
        } else if (data.length > 0) {
          setSucursalSeleccionadaState(data[0])
        }
      }
    } catch (error) {
      console.error('Error al cargar sucursales:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const setSucursalSeleccionada = (sucursal: Sucursal) => {
    setSucursalSeleccionadaState(sucursal)
    localStorage.setItem(STORAGE_KEY, sucursal.id)
  }

  return (
    <SucursalContext.Provider
      value={{
        sucursales,
        sucursalSeleccionada,
        setSucursalSeleccionada,
        isLoading
      }}
    >
      {children}
    </SucursalContext.Provider>
  )
}

export function useSucursal() {
  const context = useContext(SucursalContext)
  if (context === undefined) {
    throw new Error('useSucursal must be used within a SucursalProvider')
  }
  return context
}
