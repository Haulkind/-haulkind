'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getMe, updateProfile } from '@/lib/api'
import { getToken, isLoggedIn, setCustomer, logout } from '@/lib/auth'

export default function ProfilePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/auth'); return }
    loadProfile()
  }, [router])

  const loadProfile = async () => {
    const token = getToken()
    if (!token) return
    try {
      const data = await getMe(token)
      if (data.customer) {
        setName(data.customer.name || '')
        setEmail(data.customer.email || '')
        setPhone(data.customer.phone || '')
      }
    } catch (e) {
      console.error('Failed to load profile:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    const token = getToken()
    if (!token) return
    try {
      const data = await updateProfile(token, { name, phone })
      if (data.error) {
        setMessage(data.error)
      } else {
        setCustomer(data.customer)
        setMessage('Profile updated successfully!')
      }
    } catch {
      setMessage('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
      </div>

      <div className="px-4 py-6">
        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-3xl">
            {name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm ${
            message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
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
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Logout */}
        <div className="mt-8 pt-6 border-t">
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition"
          >
            Sign Out
          </button>
        </div>

        {/* App Info */}
        <div className="mt-8 text-center text-xs text-gray-400">
          <p>Haulkind Customer App v1.0.0</p>
          <p className="mt-1">
            <a href="https://www.haulkind.com" target="_blank" rel="noopener noreferrer" className="underline">
              haulkind.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
