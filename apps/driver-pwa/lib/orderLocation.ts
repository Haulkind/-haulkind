import type { Order } from './api'

export function getOrderCoordinates(order: Order): [number, number] | null {
  if (order.pickup_lat == null || order.pickup_lng == null ||
      String(order.pickup_lat).trim() === '' || String(order.pickup_lng).trim() === '') return null
  const lat = Number(order.pickup_lat)
  const lng = Number(order.pickup_lng)
  if (!Number.isFinite(lat) || Math.abs(lat) > 90 ||
      !Number.isFinite(lng) || Math.abs(lng) > 180) return null
  return [lat, lng]
}

export function getOrderDistance(order: Order, lat: number | null, lng: number | null): number | null {
  const coordinates = getOrderCoordinates(order)
  if (!coordinates || lat === null || lng === null) return null
  const [pickupLat, pickupLng] = coordinates
  const dLat = (pickupLat - lat) * Math.PI / 180
  const dLng = (pickupLng - lng) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat * Math.PI / 180) * Math.cos(pickupLat * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(distance: number | null): string {
  return distance === null ? '-- mi' : `${distance.toFixed(1)} mi`
}
