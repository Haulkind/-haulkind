'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginCustomer, registerCustomer } from '@/lib/api'
import { setToken, setCustomer } from '@/lib/auth'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register' | 'track'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Register
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')

  // Track
  const [trackCode, setTrackCode] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await loginCustomer({ email, password })
      if (data.error) { setError(data.error); return }
      setToken(data.token)
      setCustomer(data.customer)
      router.push('/dashboard')
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await registerCustomer({ name, email: regEmail, phone, password: regPassword })
      if (data.error) { setError(data.error); return }
      setToken(data.token)
      setCustomer(data.customer)
      router.push('/dashboard')
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackCode.trim()) return
    // Strip leading # (users copy "#uuid" from the site)
    const cleaned = trackCode.trim().replace(/^#/, '')
    // If it looks like a UUID, use orderId param; otherwise use token param
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(cleaned)
    if (isUuid) {
      router.push(`/track?orderId=${encodeURIComponent(cleaned)}`)
    } else {
      router.push(`/track?token=${encodeURIComponent(cleaned)}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-600 to-primary-800 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-3xl font-bold text-primary-600">H</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Haulkind</h1>
        <p className="text-primary-200 mt-1">Track your orders in real time</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        {/* Tabs */}
        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          {(['login', 'register', 'track'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setMode(tab); setError('') }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                mode === tab ? 'bg-white shadow text-primary-600' : 'text-gray-500'
              }`}
            >
              {tab === 'login' ? 'Sign In' : tab === 'register' ? 'Register' : 'Track Order'}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>
        )}

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="Your password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Register Form */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="Min. 6 characters"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Track Order Form */}
        {mode === 'track' && (
          <form onSubmit={handleTrack} className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter the tracking code or order ID you received by email after placing your order.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Code or Order ID</label>
              <input
                type="text"
                value={trackCode}
                onChange={e => setTrackCode(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none font-mono"
                placeholder="Enter tracking code..."
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition"
            >
              Track My Order
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <p className="text-primary-200 text-sm mt-6">
        <a href="https://www.haulkind.com" target="_blank" rel="noopener noreferrer" className="underline">
          Visit haulkind.com
        </a>
      </p>
    </div>
  )
}
