'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { getProfile, updateProfile, type Driver } from '@/lib/api'
import PageHeader from '@/components/PageHeader'

export default function ProfilePage() {
  const router = useRouter()
  const { token, driver, isLoading, logout, updateDriver } = useAuth()
  const [profile, setProfile] = useState<Driver | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isLoading && !token) router.replace('/login')
  }, [token, isLoading, router])

  const fetchProfile = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = await getProfile(token)
      setProfile(data.driver)
      setName(data.driver.first_name || data.driver.name || '')
      setPhone(data.driver.phone || '')
    } catch (err) {
      console.error('Failed to fetch profile:', err)
      // Use local driver data as fallback
      if (driver) {
        setProfile(driver)
        setName(driver.first_name || driver.name || '')
        setPhone(driver.phone || '')
      }
    } finally {
      setLoading(false)
    }
  }, [token, driver])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleSave = async () => {
    if (!token) return
    setSaving(true)
    try {
      await updateProfile(token, { name, phone })
      if (profile) {
        const updated = { ...profile, name, phone }
        setProfile(updated)
        updateDriver(updated)
      }
      setEditing(false)
    } catch (err) {
      alert('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout()
      router.replace('/login')
    }
  }

  if (isLoading || !token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const displayName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name || ''}`.trim()
    : profile?.name || driver?.name || 'Driver'

  return (
    <div className="bg-gray-50 min-h-screen">
      <PageHeader title="My Profile" />
      <div className="bg-primary-900 text-white px-5 pb-8 text-center">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
          {profile?.selfie_url ? (
            <img src={profile.selfie_url} alt="" className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <span className="text-3xl">{displayName.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <h1 className="text-xl font-bold">{displayName}</h1>
        <p className="text-primary-200 text-sm">{profile?.email || driver?.email}</p>
        <span className={`inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full ${
          profile?.driver_status === 'approved' || profile?.is_active
            ? 'bg-green-500/20 text-green-300'
            : 'bg-yellow-500/20 text-yellow-300'
        }`}>
          {profile?.driver_status || profile?.status || 'Active'}
        </span>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Profile Info */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Profile Info</h3>
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-sm text-primary-600 font-semibold">
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 bg-primary-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <InfoRow label="Name" value={displayName} />
              <InfoRow label="Email" value={profile?.email || driver?.email || ''} />
              <InfoRow label="Phone" value={profile?.phone || driver?.phone || 'Not set'} />
              {profile?.vehicle_type && <InfoRow label="Vehicle" value={profile.vehicle_type} />}
              {profile?.vehicle_capacity && <InfoRow label="Capacity" value={profile.vehicle_capacity} />}
              {profile?.license_plate && <InfoRow label="License Plate" value={profile.license_plate} />}
            </div>
          )}
        </div>

        {/* App Info */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">App Info</h3>
          <InfoRow label="App Version" value="1.0.0 (PWA)" />
          <InfoRow label="Platform" value="iOS Web App" />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-4 bg-red-50 text-red-600 rounded-xl font-bold text-center border border-red-200 active:bg-red-100 transition"
        >
          Log Out
        </button>

        {/* Install as App hint */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-sm font-semibold text-blue-800 mb-1">Install as App</p>
          <p className="text-xs text-blue-600">
            Tap the share icon in Safari, then &quot;Add to Home Screen&quot; to install HaulKind Drive as a full-screen app on your iPhone.
          </p>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  )
}
