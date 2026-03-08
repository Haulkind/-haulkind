'use client'

import { useEffect, useRef, useState } from 'react'

interface MapViewProps {
  lat: number | null
  lng: number | null
}

export default function MapView({ lat, lng }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return

    // Dynamically import leaflet
    const initMap = async () => {
      const L = (await import('leaflet')).default

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

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
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
      }
    }
  }, [])

  // Update marker position when GPS changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current || !lat || !lng) return
    const L = require('leaflet')
    const pos = L.latLng(lat, lng)
    markerRef.current.setLatLng(pos)
    mapInstanceRef.current.setView(pos, mapInstanceRef.current.getZoom())
  }, [lat, lng])

  return (
    <div ref={mapRef} className="absolute inset-0 z-0" style={{ background: '#e8e8e8' }}>
      {!loaded && (
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
