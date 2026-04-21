'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  nombre: string
  apellido: string
  telefono?: string
  negocioId?: string
  roles: string[]
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string, user: User) => void
  logout: () => void
  hasRole: (role: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'auth_data'

interface StoredAuthData {
  token: string
  user: User
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Nuevo estado

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const data: StoredAuthData = JSON.parse(stored)
        setToken(data.token)
        setUser(data.user)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setIsLoading(false) // Termina la carga
  }, [])

  const login = (newToken: string, newUser: User) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: newToken, user: newUser }))
  }

  const logout = async () => {
    try {
      // 1. Llamamos a la API para borrar la cookie HttpOnly
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Error al cerrar sesión en servidor:', error)
    } finally {
      // 2. Limpiamos el estado del cliente pase lo que pase
      setToken(null)
      setUser(null)
      localStorage.removeItem(STORAGE_KEY)

      // 3. Redirigimos al login
      // Usamos window.location para asegurar un refresh limpio de los estados
      window.location.href = '/login'
    }
  }

  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) ?? false
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
