'use client'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
export const ALERT_SETTINGS_EVENT = 'driver-alert-settings'
let audio: AudioContext | null = null
let worker: Promise<ServiceWorkerRegistration> | null = null

export interface AlertSettings {
  notifications: boolean
  sound: boolean
  vibration: boolean
}

export function alertSettings(): AlertSettings {
  try {
    const saved = JSON.parse(localStorage.getItem('driver_settings') || '{}')
    return { notifications: saved.notifications !== false, sound: saved.sound !== false, vibration: saved.vibration !== false }
  } catch {
    return { notifications: true, sound: true, vibration: true }
  }
}

export function audioReady() {
  return audio?.state === 'running'
}

export function unlockAlertAudio() {
  try {
    if (!audio) {
      audio = new AudioContext()
      audio.onstatechange = () => window.dispatchEvent(new Event(ALERT_SETTINGS_EVENT))
    }
    void audio.resume().catch(() => {})
  } catch {
    // System notifications remain available when Web Audio is unsupported.
  }
}

export async function enableOrderAlerts() {
  unlockAlertAudio()
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    await Notification.requestPermission()
  }
  window.dispatchEvent(new Event(ALERT_SETTINGS_EVENT))
}

export function playAlertSound() {
  const settings = alertSettings()
  if (!settings.notifications) return
  if (settings.sound && audio?.state === 'running') {
    const now = audio.currentTime
    for (const [offset, frequency] of [[0, 880], [0.22, 1100], [0.44, 1320]]) {
      const oscillator = audio.createOscillator()
      const gain = audio.createGain()
      oscillator.connect(gain)
      gain.connect(audio.destination)
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.4, now + offset)
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.2)
      oscillator.start(now + offset)
      oscillator.stop(now + offset + 0.21)
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
    }
  }
  if (settings.vibration && navigator.vibrate) navigator.vibrate([200, 100, 200])
}

export async function alertWorker() {
  if (!('serviceWorker' in navigator)) throw new Error('This browser does not support order alerts.')
  if (!worker) {
    worker = (async () => {
      await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      return await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_resolve, reject) => setTimeout(() => reject(new Error('Notification service is not ready. Try again.')), 10000)),
      ])
    })().catch(error => { worker = null; throw error })
  }
  return worker
}

export async function workerMessage(message: object) {
  const registration = await alertWorker()
  const active = registration.active
  if (!active) throw new Error('Notification service is not active.')
  return new Promise<{ seen?: string[] }>((resolve, reject) => {
    const channel = new MessageChannel()
    const timeout = setTimeout(() => { channel.port1.close(); reject(new Error('Notification service did not respond.')) }, 10000)
    channel.port1.onmessage = event => {
      clearTimeout(timeout)
      channel.port1.close()
      if (event.data?.error) reject(new Error(event.data.error))
      else resolve(event.data)
    }
    active.postMessage(message, [channel.port2])
  })
}

export async function pushRequest<T>(token: string, path: string, body?: object): Promise<T> {
  const response = await fetch(`${API_BASE}/driver/push/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) throw new Error('Order notifications could not connect. Retrying automatically.')
  return response.json()
}

export async function subscribeForAlerts(token: string) {
  const registration = await alertWorker()
  const settings = alertSettings()
  const existing = await registration.pushManager.getSubscription()
  if (!settings.notifications || Notification.permission !== 'granted') {
    if (existing) {
      await existing.unsubscribe()
      await pushRequest(token, 'unsubscribe', { platform: 'web', endpoint: existing.endpoint })
    }
    return false
  }
  const config = await pushRequest<{ vapidPublicKey: string }>(token, 'config')
  const key = Uint8Array.from(atob(config.vapidPublicKey.replace(/-/g, '+').replace(/_/g, '/')), value => value.charCodeAt(0))
  let subscription = existing
  if (subscription?.options.applicationServerKey) {
    const previous = new Uint8Array(subscription.options.applicationServerKey)
    if (previous.length !== key.length || previous.some((value, i) => value !== key[i])) {
      await subscription.unsubscribe()
      subscription = null
    }
  }
  subscription ||= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key.buffer })
  await pushRequest(token, 'subscribe', {
    platform: 'web', endpoint: subscription.endpoint, keys: subscription.toJSON().keys,
    sound: settings.sound, vibration: settings.vibration,
    seen: (await workerMessage({ type: 'SEEN' })).seen || [],
  })
  return true
}

export async function stopOrderAlerts(token: string | null) {
  if (!('serviceWorker' in navigator)) return
  await workerMessage({ type: 'CONFIG', config: { driverId: null, notifications: false } })
  const subscription = await (await alertWorker()).pushManager.getSubscription()
  if (subscription) {
    await subscription.unsubscribe()
    if (token) await pushRequest(token, 'unsubscribe', { platform: 'web', endpoint: subscription.endpoint })
  }
}
