'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { login as apiLogin, signup as apiSignup } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter email and password')
      return
    }
    if (mode === 'signup' && !name) {
      setError('Please enter your name')
      return
    }

    setLoading(true)
    try {
      const res = mode === 'login'
        ? await apiLogin(email, password)
        : await apiSignup(email, password, name)
      login(res.token, res.driver)
      router.replace('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary-900 flex flex-col justify-center px-6">
      <div className="mb-10 text-center">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-3xl">🚛</span>
        </div>
        <h1 className="text-3xl font-bold text-white">HaulKind Drive</h1>
        <p className="text-primary-200 mt-2">
          {mode === 'login' ? 'Sign in to start earning' : 'Create your driver account'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-4 rounded-xl bg-white/10 text-white placeholder-primary-300 border border-primary-700 focus:border-white focus:outline-none text-lg"
            disabled={loading}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoCapitalize="none"
          className="w-full px-4 py-4 rounded-xl bg-white/10 text-white placeholder-primary-300 border border-primary-700 focus:border-white focus:outline-none text-lg"
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-4 rounded-xl bg-white/10 text-white placeholder-primary-300 border border-primary-700 focus:border-white focus:outline-none text-lg"
          disabled={loading}
        />

        {error && (
          <p className="text-red-300 text-sm text-center bg-red-900/30 rounded-lg py-2 px-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-white text-primary-900 rounded-xl text-lg font-bold hover:bg-gray-100 transition disabled:opacity-50"
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        <button
          type="button"
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
          className="w-full text-center text-primary-200 py-3"
        >
          {mode === 'login' ? (
            <>Don&apos;t have an account? <span className="text-white font-semibold">Sign Up</span></>
          ) : (
            <>Already have an account? <span className="text-white font-semibold">Sign In</span></>
          )}
        </button>
      </form>
    </div>
  )
}
