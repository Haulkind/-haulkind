import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface Driver {
  id: number
  name: string
  email: string
  phone: string
  status: string
}

interface AuthContextType {
  token: string | null
  driver: Driver | null
  isLoading: boolean
  login: (token: string, driver: Driver) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [driver, setDriver] = useState<Driver | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAuth()
  }, [])

  const loadAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('driver_token')
      const storedDriver = await AsyncStorage.getItem('driver_data')
      
      if (storedToken && storedDriver) {
        setToken(storedToken)
        setDriver(JSON.parse(storedDriver))
      }
    } catch (error) {
      console.error('Failed to load auth:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (newToken: string, newDriver: Driver) => {
    try {
      await AsyncStorage.setItem('driver_token', newToken)
      await AsyncStorage.setItem('driver_data', JSON.stringify(newDriver))
      setToken(newToken)
      setDriver(newDriver)
    } catch (error) {
      console.error('Failed to save auth:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('driver_token')
      await AsyncStorage.removeItem('driver_data')
      setToken(null)
      setDriver(null)
    } catch (error) {
      console.error('Failed to clear auth:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ token, driver, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
