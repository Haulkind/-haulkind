import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_BASE_URL = 'https://haulkind-production-285b.up.railway.app'

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
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
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

  const login = async (email: string, password: string) => {
    const url = `${API_BASE_URL}/customer/auth/login`
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      
      const text = await response.text()
      
      if (!response.ok) {
        throw new Error(`Login failed: ${response.status} - ${text}`)
      }
      
      const data = JSON.parse(text)
      await AsyncStorage.setItem('customer_token', data.token)
      await AsyncStorage.setItem('customer_data', JSON.stringify(data.customer))
      setToken(data.token)
      setCustomer(data.customer)
      
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const signup = async (name: string, email: string, password: string) => {
    const url = `${API_BASE_URL}/customer/auth/signup`
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone: '' }),
      })
      
      const text = await response.text()
      
      if (!response.ok) {
        throw new Error(`Signup failed: ${response.status} - ${text}`)
      }
      
      const data = JSON.parse(text)
      await AsyncStorage.setItem('customer_token', data.token)
      await AsyncStorage.setItem('customer_data', JSON.stringify(data.customer))
      setToken(data.token)
      setCustomer(data.customer)
      
    } catch (error) {
      console.error('Signup error:', error)
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
    <AuthContext.Provider value={{ token, customer, isLoading, login, signup, logout }}>
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
