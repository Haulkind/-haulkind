import { useEffect, type Dispatch, type SetStateAction } from 'react'

interface ContactOrder {
  status: string
  driver?: { phone?: string }
  can_contact_driver?: boolean
  contact_expires_at?: string
  server_time?: string
  contactExpiresAt?: number
}

export function withoutDriverContact<T extends ContactOrder>(order: T): T {
  const copy = { ...order, can_contact_driver: false, contactExpiresAt: 0 }
  if (copy.driver) {
    copy.driver = { ...copy.driver }
    delete copy.driver.phone
  }
  return copy
}

export function hasDriverContact(order: ContactOrder): boolean {
  return order.can_contact_driver === true && (order.contactExpiresAt || 0) > Date.now() &&
    ['accepted', 'assigned', 'en_route', 'arrived', 'started', 'in_progress', 'photo_taken', 'signed'].includes(order.status)
}

export function prepareOrderContact<T extends ContactOrder>(order: T, requestedAt: number): T {
  const ttl = Date.parse(order.contact_expires_at || '') - Date.parse(order.server_time || '')
  const copy = { ...order, contactExpiresAt: requestedAt + Math.max(0, Math.min(30000, ttl || 0)) }
  return hasDriverContact(copy) ? copy : withoutDriverContact(copy)
}

export function useContactExpiry<T extends ContactOrder>(order: T | null, setOrder: Dispatch<SetStateAction<T | null>>) {
  useEffect(() => {
    const clear = () => setOrder(current => current ? withoutDriverContact(current) : null)
    const visibility = () => { if (document.hidden) clear() }
    const timer = order?.driver?.phone ? window.setTimeout(clear, Math.max(0, (order.contactExpiresAt || 0) - Date.now())) : undefined
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('offline', clear)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('offline', clear)
    }
  }, [order, setOrder])
}
