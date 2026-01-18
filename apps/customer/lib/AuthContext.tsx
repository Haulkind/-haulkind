import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface Customer {
  id: number
  name: string
  email: string
  phone: string
}

interface AuthContextType {
  token: string | null
  customer: Customer | null
  isLoading: boolean
  login: (token: string, customer: Customer) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAuth()
  }, [])

  const loadAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('customer_token')
      const storedCustomer = await AsyncStorage.getItem('customer_data')
      
      if (storedToken && storedCustomer) {
        setToken(storedToken)
        setCustomer(JSON.parse(storedCustomer))
      }
    } catch (error) {
      console.error('Failed to load auth:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (newToken: string, newCustomer: Customer) => {
    try {
      await AsyncStorage.setItem('customer_token', newToken)
      await AsyncStorage.setItem('customer_data', JSON.stringify(newCustomer))
      setToken(newToken)
      setCustomer(newCustomer)
    } catch (error) {
      console.error('Failed to save auth:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('customer_token')
      await AsyncStorage.removeItem('customer_data')
      setToken(null)
      setCustomer(null)
    } catch (error) {
      console.error('Failed to clear auth:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ token, customer, isLoading, login, logout }}>
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
