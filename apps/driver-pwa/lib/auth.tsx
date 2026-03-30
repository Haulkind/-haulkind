'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Driver } from './api'

interface AuthContextType {
  token: string | null
  driver: Driver | null
  isLoading: boolean
  login: (token: string, driver: Driver) => void
  logout: () => void
  updateDriver: (driver: Driver) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [driver, setDriver] = useState<Driver | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const t = localStorage.getItem('driver_token')
      const d = localStorage.getItem('driver_data')
      if (t && d) {
        setToken(t)
        setDriver(JSON.parse(d))
      }
    } catch (e) {
      console.error('Failed to load auth:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback((newToken: string, newDriver: Driver) => {
    // Clear all old auth data first to prevent stale driver profile from persisting
    localStorage.removeItem('driver_token')
    localStorage.removeItem('driver_data')
    // Store new auth data
    localStorage.setItem('driver_token', newToken)
    localStorage.setItem('driver_data', JSON.stringify(newDriver))
    setToken(newToken)
    setDriver(newDriver)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('driver_token')
    localStorage.removeItem('driver_data')
    setToken(null)
    setDriver(null)
  }, [])

  const updateDriver = useCallback((newDriver: Driver) => {
    localStorage.setItem('driver_data', JSON.stringify(newDriver))
    setDriver(newDriver)
  }, [])

  return (
    <AuthContext.Provider value={{ token, driver, isLoading, login, logout, updateDriver }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
