'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import PageHeader from '@/components/PageHeader'

export default function SettingsPage() {
  const router = useRouter()
  const { token, isLoading, logout } = useAuth()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [vibrationEnabled, setVibrationEnabled] = useState(true)
  const [autoAccept, setAutoAccept] = useState(false)
  const [radius, setRadius] = useState('80')

  useEffect(() => {
    if (!isLoading && !token) router.replace('/login')
  }, [token, isLoading, router])

  // Load settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('driver_settings')
      if (saved) {
        const settings = JSON.parse(saved)
        setNotificationsEnabled(settings.notifications ?? true)
        setSoundEnabled(settings.sound ?? true)
        setVibrationEnabled(settings.vibration ?? true)
        setAutoAccept(settings.autoAccept ?? false)
        setRadius(settings.radius ?? '80')
      }
    } catch (e) {
      // ignore
    }
  }, [])

  const saveSettings = (key: string, value: boolean | string) => {
    try {
      const saved = localStorage.getItem('driver_settings')
      const settings = saved ? JSON.parse(saved) : {}
      settings[key] = value
      localStorage.setItem('driver_settings', JSON.stringify(settings))
    } catch (e) {
      // ignore
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

  return (
    <div className="bg-gray-50 min-h-screen">
      <PageHeader title="Settings" />

      <div className="px-5 py-4 space-y-4">
        {/* Notifications */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Notifications</h3>
          <ToggleRow
            label="Push Notifications"
            description="Receive alerts for new orders"
            enabled={notificationsEnabled}
            onChange={(v) => { setNotificationsEnabled(v); saveSettings('notifications', v) }}
          />
          <ToggleRow
            label="Sound"
            description="Play sound for new orders"
            enabled={soundEnabled}
            onChange={(v) => { setSoundEnabled(v); saveSettings('sound', v) }}
          />
          <ToggleRow
            label="Vibration"
            description="Vibrate on new orders"
            enabled={vibrationEnabled}
            onChange={(v) => { setVibrationEnabled(v); saveSettings('vibration', v) }}
          />
        </div>

        {/* Order Preferences */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Order Preferences</h3>
          <div className="flex items-center justify-between py-3 border-b border-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-900">Search Radius</p>
              <p className="text-xs text-gray-400">How far to look for orders</p>
            </div>
            <select
              value={radius}
              onChange={(e) => { setRadius(e.target.value); saveSettings('radius', e.target.value) }}
              className="bg-gray-100 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 border-0"
            >
              <option value="20">20 miles</option>
              <option value="40">40 miles</option>
              <option value="60">60 miles</option>
              <option value="80">80 miles</option>
              <option value="100">100 miles</option>
            </select>
          </div>
          <ToggleRow
            label="Auto-Accept Orders"
            description="Automatically accept nearby orders"
            enabled={autoAccept}
            onChange={(v) => { setAutoAccept(v); saveSettings('autoAccept', v) }}
          />
        </div>

        {/* App Info */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">App Info</h3>
          <InfoRow label="App Version" value="1.0.0 (PWA)" />
          <InfoRow label="Platform" value={typeof navigator !== 'undefined' && /iPhone|iPad/.test(navigator.userAgent) ? 'iOS Web App' : 'Web App'} />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-4 bg-red-50 text-red-600 rounded-xl font-bold text-center border border-red-200 active:bg-red-100 transition"
        >
          Sign Out
        </button>

        {/* Install hint */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-sm font-semibold text-blue-800 mb-1">Install as App</p>
          <p className="text-xs text-blue-600">
            Tap the share icon in Safari, then &quot;Add to Home Screen&quot; to install HaulKind Drive as a full-screen app.
          </p>
        </div>
      </div>
    </div>
  )
}

function ToggleRow({ label, description, enabled, onChange }: {
  label: string
  description: string
  enabled: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
          enabled ? 'bg-green-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
            enabled ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
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
