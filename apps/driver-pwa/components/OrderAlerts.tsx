'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import {
  ALERT_SETTINGS_EVENT, alertSettings, audioReady, enableOrderAlerts, playAlertSound,
  pushRequest, subscribeForAlerts, unlockAlertAudio, workerMessage,
} from '@/lib/notifications'

export default function OrderAlerts() {
  const { token, driver } = useAuth()
  const [status, setStatus] = useState('')
  const [revision, setRevision] = useState(0)
  const driverId = driver ? String(driver.id) : null
  const online = driver?.is_online === true

  useEffect(() => {
    const changed = () => setRevision(value => value + 1)
    const received = (event: MessageEvent) => {
      if (event.data?.type === 'PLAY_ALERT' && document.visibilityState === 'visible') playAlertSound()
    }
    window.addEventListener(ALERT_SETTINGS_EVENT, changed)
    window.addEventListener('storage', changed)
    window.addEventListener('pointerdown', unlockAlertAudio)
    window.addEventListener('keydown', unlockAlertAudio)
    navigator.serviceWorker?.addEventListener('message', received)
    return () => {
      window.removeEventListener(ALERT_SETTINGS_EVENT, changed)
      window.removeEventListener('storage', changed)
      window.removeEventListener('pointerdown', unlockAlertAudio)
      window.removeEventListener('keydown', unlockAlertAudio)
      navigator.serviceWorker?.removeEventListener('message', received)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let busy = false
    let subscribedAt = 0
    let pushAvailable = false
    const activeToken = () => !cancelled && localStorage.getItem('driver_token') === token
    const sync = async () => {
      if (busy || document.visibilityState !== 'visible') return
      busy = true
      try {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
          if (token) setStatus('Use Chrome and install Haulkind Drive to enable order notifications.')
          return
        }
        if (!activeToken()) return
        const settings = alertSettings()
        await workerMessage({
          type: 'CONFIG',
          config: { driverId, online, ...settings, audioReady: audioReady() },
        })
        if (!activeToken() || !token || !driverId) return
        let registrationError = ''
        if ('PushManager' in window && Date.now() - subscribedAt > 300000) {
          try {
            pushAvailable = await subscribeForAlerts(token)
            if (!activeToken()) return
            subscribedAt = Date.now()
          } catch (error) {
            pushAvailable = false
            registrationError = error instanceof Error ? error.message : 'Background notifications are unavailable.'
          }
        }
        if (!pushAvailable && online && settings.notifications && Notification.permission === 'granted') {
          const history = await workerMessage({ type: 'SEEN' })
          const inbox = await pushRequest<{ alert: object | null }>(token, 'inbox', { seen: history.seen || [] })
          if (!activeToken()) return
          if (inbox.alert) await workerMessage({ type: 'ORDER_ALERT', alert: inbox.alert })
        }
        if (Notification.permission === 'denied') {
          setStatus('Notifications are blocked. Enable them in Chrome site settings and Android notification settings.')
        } else if (settings.notifications && Notification.permission !== 'granted') {
          setStatus('Enable order notifications and sound.')
        } else if (settings.notifications && settings.sound && !audioReady()) {
          setStatus('Tap Enable to activate order sounds for this session.')
        } else if (settings.notifications && !pushAvailable) {
          setStatus(registrationError || 'Alerts work while this page is open. Use Chrome to enable background notifications.')
        } else {
          setStatus('')
        }
      } catch (error) {
        if (activeToken()) setStatus(error instanceof Error ? error.message : 'Could not activate order alerts.')
      } finally {
        busy = false
      }
    }
    void sync()
    const interval = setInterval(sync, 15000)
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('online', sync)
    return () => {
      cancelled = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('online', sync)
    }
  }, [token, driverId, online, revision])

  if (!token || !status) return null
  return (
    <div role="status" className="flex items-center justify-between gap-3 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <span>{status}</span>
      <button type="button" className="rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white" onClick={() => {
        void enableOrderAlerts().catch(() => setStatus('Allow notifications in your browser settings, then try again.'))
      }}>Enable</button>
    </div>
  )
}
