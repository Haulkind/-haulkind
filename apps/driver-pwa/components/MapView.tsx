'use client'

import { useEffect, useRef, useState } from 'react'
import type { Order } from '@/lib/api'

interface MapViewProps {
  lat: number | null
  lng: number | null
  orders?: Order[]
}

// Haversine distance in miles
function getDistanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getOrderPrice(order: Order): string {
  const ep = (order as any).estimated_price
  if (ep && Number(ep) > 0) return Number(ep).toFixed(0)
  if (order.driver_earnings && Number(order.driver_earnings) > 0) return Number(order.driver_earnings).toFixed(0)
  if (order.payout && Number(order.payout) > 0) return Number(order.payout).toFixed(0)
  if (order.driver_earnings_cents && order.driver_earnings_cents > 0) return (order.driver_earnings_cents / 100).toFixed(0)
  const price = order.price || order.total || 0
  if (Number(price) > 0) return Number(price).toFixed(0)
  return '0'
}

function isNewOrder(dateStr?: string): boolean {
  if (!dateStr) return true
  return (Date.now() - new Date(dateStr).getTime()) / 3600000 < 24
}

export default function MapView({ lat, lng, orders = [] }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const orderMarkersRef = useRef<any[]>([])
  const leafletRef = useRef<any>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return

    // Dynamically import leaflet
    const initMap = async () => {
      const L = (await import('leaflet')).default
      leafletRef.current = L

      // Add leaflet CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      if (mapInstanceRef.current) return // Already initialized

      const defaultLat = lat || 40.0583
      const defaultLng = lng || -74.4057

      const map = L.map(mapRef.current!, {
        zoomControl: false,
        attributionControl: false,
      }).setView([defaultLat, defaultLng], 11)

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      }).addTo(map)

      // Blue dot for driver location
      const driverIcon = L.divIcon({
        className: 'driver-marker',
        html: '<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })

      const marker = L.marker([defaultLat, defaultLng], { icon: driverIcon }).addTo(map)
      mapInstanceRef.current = map
      markerRef.current = marker
      setLoaded(true)

      // Invalidate size after mount
      setTimeout(() => map.invalidateSize(), 100)
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
        leafletRef.current = null
        orderMarkersRef.current = []
      }
    }
  }, [])

  // Update marker position when GPS changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current || !lat || !lng) return
    markerRef.current.setLatLng([lat, lng])
    mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom())
  }, [lat, lng])

  // Update order markers when orders change
  useEffect(() => {
    const L = leafletRef.current
    const map = mapInstanceRef.current
    if (!L || !map) return

    // Remove existing order markers
    orderMarkersRef.current.forEach(m => map.removeLayer(m))
    orderMarkersRef.current = []

    // Add markers for orders with coordinates
    const bounds: [number, number][] = []
    if (lat && lng) bounds.push([lat, lng])

    orders.forEach(order => {
      const oLat = order.pickup_lat ? Number(order.pickup_lat) : null
      const oLng = order.pickup_lng ? Number(order.pickup_lng) : null
      if (!oLat || !oLng) return

      const price = getOrderPrice(order)
      const dist = (lat && lng) ? getDistanceMiles(lat, lng, oLat, oLng).toFixed(1) + 'mi' : ''
      const isNew = isNewOrder(order.created_at)
      const bgColor = isNew ? '#ef4444' : '#1a56db'

      const icon = L.divIcon({
        className: 'order-pin',
        html: `<div style="background:${bgColor};color:#fff;padding:4px 8px;border-radius:8px;font-weight:bold;font-size:12px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid #fff;">$${price} <span style="font-size:10px;font-weight:normal;">${dist}</span></div>`,
        iconSize: [80, 30],
        iconAnchor: [40, 30],
      })

      const marker = L.marker([oLat, oLng], { icon }).addTo(map)
      orderMarkersRef.current.push(marker)
      bounds.push([oLat, oLng])
    })

    // Fit bounds if we have order markers
    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [orders, lat, lng, loaded])

  return (
    <div ref={mapRef} className="absolute inset-0 z-0" style={{ background: '#e8e8e8' }}>
      {!loaded && (
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <style jsx global>{`
        .order-pin { background: none !important; border: none !important; }
        .driver-marker { background: none !important; border: none !important; }
      `}</style>
    </div>
  )
}
