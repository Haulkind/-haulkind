'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Circle, CircleMarker, Map as LeafletMap, Marker } from 'leaflet'
import type { Order } from '@/lib/api'
import MenuIcon from './MenuIcon'
import { formatPayout } from '@/lib/driverPayout'

interface MapViewProps {
  lat: number | null
  lng: number | null
  accuracy?: number | null
  orders?: Order[]
}

export default function MapView({ lat, lng, accuracy, orders = [] }: MapViewProps) {
  const router = useRouter()
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<CircleMarker | null>(null)
  const accuracyRef = useRef<Circle | null>(null)
  const orderMarkers = useRef<Marker[]>([])
  const leaflet = useRef<typeof import('leaflet') | null>(null)
  const following = useRef(true)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    let observer: ResizeObserver | null = null
    setLoaded(false)
    setError(false)

    async function initialize() {
      const L = await import('leaflet')
      if (cancelled || !container.current) return
      leaflet.current = L
      const map = L.map(container.current, { zoomControl: false, zoomAnimation: false }).setView([39.9526, -75.1652], 10)
      mapRef.current = map
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      })
        .on('tileerror', () => { if (!cancelled) setError(true) })
        .addTo(map)
      map.on('dragstart', () => { following.current = false })
      observer = new ResizeObserver(() => map.invalidateSize())
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
      orderMarkers.current = []
      leaflet.current = null
    }
  }, [attempt])

  useEffect(() => {
    const L = leaflet.current
    const map = mapRef.current
    if (!loaded || !L || !map || lat === null || lng === null) return
    if (!markerRef.current) {
      markerRef.current = L.circleMarker([lat, lng], {
        radius: 8, color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1,
      }).addTo(map)
      accuracyRef.current = L.circle([lat, lng], { color: '#3b82f6', weight: 1, fillOpacity: 0.12 }).addTo(map)
      map.setView([lat, lng], 15)
    } else {
      markerRef.current.setLatLng([lat, lng])
      accuracyRef.current?.setLatLng([lat, lng])
      if (following.current) map.panTo([lat, lng], { animate: false })
    }
    accuracyRef.current?.setRadius(Math.max(0, accuracy || 0))
  }, [lat, lng, accuracy, loaded])

  useEffect(() => {
    const L = leaflet.current
    const map = mapRef.current
    if (!loaded || !L || !map) return
    orderMarkers.current.forEach(marker => marker.remove())
    orderMarkers.current = []
    for (const order of orders) {
      if (order.pickup_lat == null || order.pickup_lng == null) continue
      const latitude = Number(order.pickup_lat)
      const longitude = Number(order.pickup_lng)
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue
      const isNew = !order.created_at || Date.now() - new Date(order.created_at).getTime() < 86400000
      const label = document.createElement('div')
      label.className = `rounded-lg border-2 border-white px-2 py-1 text-xs font-bold text-white shadow-md whitespace-nowrap ${isNew ? 'bg-red-500' : 'bg-blue-700'}`
      const distance = lat !== null && lng !== null
        ? ` ${(map.distance([lat, lng], [latitude, longitude]) / 1609.34).toFixed(1)}mi`
        : ''
      label.textContent = `$${formatPayout(order, 0)}${distance}`
      const marker = L.marker([latitude, longitude], {
        icon: L.divIcon({ className: 'order-pin', html: label, iconSize: [64, 30], iconAnchor: [32, 30] }),
      }).addTo(map).on('click', () => router.push(`/orders/${order.id}`))
      orderMarkers.current.push(marker)
    }
  }, [orders, loaded, router, lat, lng])

  return (
    <div className="absolute inset-0">
      <div ref={container} className="absolute inset-0 z-0 bg-gray-200" />
      {!loaded && !error && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-sm text-gray-600">Loading map…</span></div>}
      {error && (
        <button onClick={() => setAttempt(value => value + 1)} className="absolute left-3 bottom-7 z-10 bg-white rounded-lg px-3 py-2 text-sm text-red-700 shadow">
          Map unavailable · Retry
        </button>
      )}
      <button
        aria-label="Center map on my location"
        disabled={!loaded || lat === null || lng === null}
        onClick={() => {
          if (lat === null || lng === null) return
          following.current = true
          mapRef.current?.setView([lat, lng], Math.max(mapRef.current.getZoom(), 15))
        }}
        className="absolute right-3 bottom-7 z-10 bg-white p-3 rounded-xl text-blue-600 shadow disabled:opacity-50"
      >
        <MenuIcon name="location" className="w-6 h-6" />
      </button>
    </div>
  )
}
