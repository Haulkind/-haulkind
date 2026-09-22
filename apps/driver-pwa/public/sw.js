/* global self, indexedDB */
const database = new Promise((resolve, reject) => {
  const request = indexedDB.open('haulkind-driver-alerts', 1)
  request.onupgradeneeded = () => request.result.createObjectStore('state')
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error)
})
let queue = Promise.resolve()

async function state(key, value) {
  const db = await database
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('state', value === undefined ? 'readonly' : 'readwrite')
    const store = transaction.objectStore('state')
    const request = value === undefined ? store.get(key) : store.put(value, key)
    transaction.oncomplete = () => resolve(request.result)
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

function serialize(operation) {
  queue = queue.catch(() => {}).then(operation)
  return queue
}

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()))
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))

async function showAlert(alert) {
  const config = await state('config')
  if (!config?.notifications || !config.online || String(config.driverId) !== String(alert?.driverId)) return
  if (!Array.isArray(alert.eventIds) || !alert.eventIds.length) return
  const seen = (await state(`seen:${config.driverId}`)) || []
  if (alert.eventIds.every(id => seen.includes(id))) return
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  const visible = clients.find(client => client.visibilityState === 'visible' && client.focused)
  const localAudio = visible && config.audioReady && config.sound
  const silent = !config.sound || !!localAudio
  const options = {
    body: alert.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/notification-badge.png',
    tag: 'haulkind-new-orders',
    renotify: true,
    requireInteraction: true,
    silent,
    data: { url: alert.url, driverId: config.driverId },
  }
  if (!silent && config.vibration) options.vibrate = [200, 100, 200]
  await self.registration.showNotification(alert.title, options)
  await state(`seen:${config.driverId}`, [...new Set([...seen, ...alert.eventIds])].slice(-1000))
  if (localAudio) visible.postMessage({ type: 'PLAY_ALERT' })
}

self.addEventListener('push', event => {
  event.waitUntil(serialize(async () => {
    if (event.data) await showAlert(event.data.json())
  }))
})

self.addEventListener('message', event => {
  event.waitUntil(serialize(async () => {
    try {
      if (event.data?.type === 'CONFIG') {
        await state('config', event.data.config)
        if (!event.data.config.driverId || !event.data.config.notifications || !event.data.config.online) {
          const notifications = await self.registration.getNotifications()
          notifications.forEach(notification => notification.close())
        }
      } else if (event.data?.type === 'ORDER_ALERT') {
        await showAlert(event.data.alert)
      } else if (event.data?.type === 'SEEN') {
        const config = await state('config')
        event.ports[0]?.postMessage({ seen: config?.driverId ? (await state(`seen:${config.driverId}`)) || [] : [] })
        return
      }
      event.ports[0]?.postMessage({ success: true })
    } catch {
      event.ports[0]?.postMessage({ error: 'Order alerts could not be displayed. Check notification permissions.' })
    }
  }))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil((async () => {
    const config = await state('config')
    const requested = event.notification.data
    const path = config?.driverId === requested?.driverId && /^\/orders\/[^/]+$/.test(requested?.url)
      ? requested.url : '/dashboard'
    const target = new URL(path, self.location.origin).href
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const existing = clients.find(client => new URL(client.url).origin === self.location.origin)
    if (existing) {
      await existing.navigate(target)
      await existing.focus()
    } else {
      await self.clients.openWindow(target)
    }
  })())
})
