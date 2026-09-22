'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Circle, CircleMarker, Map as LeafletMap, Marker } from 'leaflet'
import type { Order } from '@/lib/api'
import MenuIcon from './MenuIcon'
import { formatPayout } from '@/lib/driverPayout'
import { formatDistance, getOrderCoordinates, getOrderDistance } from '@/lib/orderLocation'
import type { LocationStatus } from '@/lib/driverLocation'

interface MapViewProps {
  lat: number | null
  lng: number | null
  accuracy?: number | null
  orders?: Order[]
  locationStatus: LocationStatus
  onRetryLocation: () => void
}

export default function MapView({ lat, lng, accuracy, orders = [], locationStatus, onRetryLocation }: MapViewProps) {
  const router = useRouter()
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<CircleMarker | null>(null)
  const accuracyRef = useRef<Circle | null>(null)
  const radiusRef = useRef<Circle | null>(null)
  const orderMarkers = useRef(new Map<string, { marker: Marker; label: HTMLDivElement }>())
  const leaflet = useRef<typeof import('leaflet') | null>(null)
  const following = useRef(true)
  const overview = useRef(true)
  const orderSignature = useRef('')
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const needsLocation = lat === null || lng === null || ['denied', 'unavailable', 'stale'].includes(locationStatus)

  const showOrders = useCallback(() => {
    const L = leaflet.current
    const map = mapRef.current
    if (!L || !map) return
    const points = Array.from(orderMarkers.current.values(), ({ marker }) => marker.getLatLng())
    if (markerRef.current) points.push(markerRef.current.getLatLng())
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [65, 55], maxZoom: 15, animate: false })
    following.current = true
    overview.current = true
  }, [])

  useEffect(() => {
    let cancelled = false
    let observer: ResizeObserver | null = null
    const markers = orderMarkers.current
    setLoaded(false)
    setError(false)

    async function initialize() {
      const L = await import('leaflet')
      if (cancelled || !container.current) return
      leaflet.current = L
      const map = L.map(container.current, {
        zoomControl: true,
        touchZoom: true,
        dragging: true,
        zoomAnimation: false,
      }).setView([39.9526, -75.1652], 10)
      mapRef.current = map
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      })
        .on('tileerror', () => { if (!cancelled) setError(true) })
        .addTo(map)
      map.on('dragstart zoomstart', () => { following.current = false })
      observer = new ResizeObserver(() => map.invalidateSize({ pan: false }))
      observer.observe(container.current)
      setLoaded(true)
    }
    initialize().catch(() => { if (!cancelled) setError(true) })

    return () => {
      cancelled = true
      observer?.disconnect()
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
      accuracyRef.current = null
      radiusRef.current = null
      markers.clear()
      leaflet.current = null
      following.current = true
      overview.current = true
      orderSignature.current = ''
    }
  }, [attempt])

  useEffect(() => {
    const L = leaflet.current
    const map = mapRef.current
    if (!loaded || !L || !map) return
    const firstLocation = lat !== null && lng !== null && !markerRef.current
    if (lat !== null && lng !== null) {
      if (!markerRef.current) {
        markerRef.current = L.circleMarker([lat, lng], {
          radius: 8, color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1,
        }).addTo(map)
        accuracyRef.current = L.circle([lat, lng], { color: '#3b82f6', weight: 1, fillOpacity: 0.12 }).addTo(map)
        radiusRef.current = L.circle([lat, lng], { radius: 80 * 1609.34, color: '#1a56db', fillOpacity: 0.03, weight: 1, dashArray: '5,5' }).addTo(map)
      } else {
        markerRef.current.setLatLng([lat, lng])
        accuracyRef.current?.setLatLng([lat, lng])
        radiusRef.current?.setLatLng([lat, lng])
      }
      accuracyRef.current?.setRadius(Math.max(0, accuracy || 0))
    }
    const signature: string[] = []
    const visibleIds = new Set<string>()
    for (const order of orders) {
      const coordinates = getOrderCoordinates(order)
      if (!coordinates) continue
      const id = String(order.id)
      visibleIds.add(id)
      signature.push(JSON.stringify([order.id, ...coordinates]))
      const isNew = !order.created_at || Date.now() - new Date(order.created_at).getTime() < 86400000
      let entry = orderMarkers.current.get(id)
      if (!entry) {
        const label = document.createElement('div')
        const marker = L.marker(coordinates, {
          icon: L.divIcon({ className: 'order-pin', html: label, iconSize: [96, 44], iconAnchor: [48, 44] }),
        }).addTo(map).on('click', () => router.push(`/orders/${id}`))
        entry = { marker, label }
        orderMarkers.current.set(id, entry)
      }
      if (!entry.marker.getLatLng().equals(coordinates)) entry.marker.setLatLng(coordinates)
      const className = `rounded-lg border-2 border-white px-2 py-1 text-xs text-center font-bold text-white shadow-md whitespace-pre ${isNew ? 'bg-red-500' : 'bg-blue-700'}`
      const text = `$${formatPayout(order)}\n${formatDistance(getOrderDistance(order, lat, lng))}`
      if (entry.label.className !== className) entry.label.className = className
      if (entry.label.textContent !== text) entry.label.textContent = text
    }
    orderMarkers.current.forEach(({ marker }, id) => {
      if (visibleIds.has(id)) return
      marker.remove()
      orderMarkers.current.delete(id)
    })
    const nextSignature = JSON.stringify(signature.sort())
    if (following.current) {
      if (overview.current && (firstLocation || nextSignature !== orderSignature.current ||
          (markerRef.current && !map.getBounds().contains(markerRef.current.getLatLng())))) {
        showOrders()
      } else if (!overview.current && markerRef.current) {
        map.panTo(markerRef.current.getLatLng(), { animate: false })
      }
    }
    orderSignature.current = nextSignature
  }, [orders, loaded, router, lat, lng, accuracy, showOrders])

  return (
    <div className="absolute inset-0 isolate">
      <div ref={container} className="driver-map absolute inset-0 z-0 bg-gray-200" />
      {!loaded && !error && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-sm text-gray-600">Loading map…</span></div>}
      {error && (
        <button onClick={() => setAttempt(value => value + 1)} className="absolute left-3 bottom-7 z-10 bg-white rounded-lg px-3 py-2 text-sm text-red-700 shadow">
          Map unavailable · Retry
        </button>
      )}
      <button
        aria-label="Show orders on map"
        disabled={!loaded}
        onClick={showOrders}
        className="absolute right-3 bottom-[86px] z-10 bg-white p-3 rounded-xl text-blue-600 shadow disabled:opacity-50"
      >
        <MenuIcon name="orders" className="w-6 h-6" />
      </button>
      <button
        aria-label={needsLocation ? 'Retry location' : 'Center map on my location'}
        disabled={!loaded}
        onClick={() => {
          if (needsLocation) {
            onRetryLocation()
            return
          }
          if (lat === null || lng === null) return
          mapRef.current?.setView([lat, lng], Math.max(mapRef.current.getZoom(), 15), { animate: false })
          following.current = true
          overview.current = false
        }}
        className={`absolute right-3 bottom-7 z-10 bg-white p-3 rounded-xl shadow disabled:opacity-50 ${needsLocation ? 'text-amber-700' : 'text-blue-600'}`}
      >
        <MenuIcon name="location" className="w-6 h-6" />
      </button>
    </div>
  )
}
