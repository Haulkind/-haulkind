'use client'

import { useEffect, useRef, useState } from 'react'

interface DriverLocation {
  lat: number
  lng: number
  heading?: number | null
  speed?: number | null
  updated_at: string
  distance_km?: number
  distance_miles?: number
  eta_minutes?: number
}

interface DriverTrackingMapProps {
  driverLocation: DriverLocation
  pickupLat: number
  pickupLng: number
  driverName?: string
}

function formatEta(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours}h`
  }
  return `${hours}h ${mins}min`
}

export default function DriverTrackingMap({
  driverLocation,
  pickupLat,
  pickupLng,
  driverName,
}: DriverTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const driverMarkerRef = useRef<any>(null)
  const routeLineRef = useRef<any>(null)
  const [mapReady, setMapReady] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    let cancelled = false

    async function initMap() {
      const L = (await import('leaflet')).default

      // Import leaflet CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      if (cancelled || !mapRef.current) return

      // Calculate center between driver and pickup
      const centerLat = (driverLocation.lat + pickupLat) / 2
      const centerLng = (driverLocation.lng + pickupLng) / 2

      const map = L.map(mapRef.current, {
        center: [centerLat, centerLng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      })

      // Use CartoDB tiles (reliable, no API key needed)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map)

      // Add zoom control to bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map)

      // Truck icon for driver
      const truckIcon = L.divIcon({
        html: `<div style="
          width: 40px; height: 40px; 
          background: #0d9488; 
          border-radius: 50%; 
          display: flex; align-items: center; justify-content: center;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          font-size: 20px;
        ">&#x1F69A;</div>`,
        className: 'driver-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      })

      // Customer location pin
      const customerIcon = L.divIcon({
        html: `<div style="
          width: 36px; height: 36px; 
          background: #dc2626; 
          border-radius: 50%; 
          display: flex; align-items: center; justify-content: center;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          font-size: 18px;
        ">&#x1F3E0;</div>`,
        className: 'customer-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      })

      // Add driver marker
      const driverMarker = L.marker([driverLocation.lat, driverLocation.lng], {
        icon: truckIcon,
      }).addTo(map)
      if (driverName) {
        driverMarker.bindTooltip(driverName, {
          permanent: false,
          direction: 'top',
          offset: [0, -20],
        })
      }

      // Add customer marker
      L.marker([pickupLat, pickupLng], {
        icon: customerIcon,
      })
        .addTo(map)
        .bindTooltip('Your Location', {
          permanent: false,
          direction: 'top',
          offset: [0, -18],
        })

      // Draw route line
      const routeLine = L.polyline(
        [
          [driverLocation.lat, driverLocation.lng],
          [pickupLat, pickupLng],
        ],
        {
          color: '#0d9488',
          weight: 4,
          opacity: 0.7,
          dashArray: '10, 10',
        }
      ).addTo(map)

      // Fit bounds to show both markers
      const bounds = L.latLngBounds(
        [driverLocation.lat, driverLocation.lng],
        [pickupLat, pickupLng]
      )
      map.fitBounds(bounds, { padding: [50, 50] })

      mapInstanceRef.current = map
      driverMarkerRef.current = driverMarker
      routeLineRef.current = routeLine
      setMapReady(true)
    }

    initMap()

    return () => {
      cancelled = true
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update driver marker position when location changes
  useEffect(() => {
    if (!mapReady || !driverMarkerRef.current || !routeLineRef.current) return

    const L = require('leaflet')

    // Animate marker to new position
    driverMarkerRef.current.setLatLng([driverLocation.lat, driverLocation.lng])

    // Update route line
    routeLineRef.current.setLatLngs([
      [driverLocation.lat, driverLocation.lng],
      [pickupLat, pickupLng],
    ])

    // Optionally re-fit bounds if driver moved significantly
    if (mapInstanceRef.current) {
      const bounds = L.latLngBounds(
        [driverLocation.lat, driverLocation.lng],
        [pickupLat, pickupLng]
      )
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], animate: true })
    }
  }, [driverLocation.lat, driverLocation.lng, pickupLat, pickupLng, mapReady])

  const distanceText = driverLocation.distance_miles != null
    ? `${driverLocation.distance_miles} mi`
    : driverLocation.distance_km != null
      ? `${driverLocation.distance_km} km`
      : null

  const etaText = driverLocation.eta_minutes != null
    ? formatEta(driverLocation.eta_minutes)
    : null

  const lastUpdated = new Date(driverLocation.updated_at).toLocaleTimeString()

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Map */}
      <div
        ref={mapRef}
        className="w-full h-56 sm:h-64 bg-gray-100"
        style={{ minHeight: '224px' }}
      />

      {/* Info Bar */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <span className="text-xl">&#x1F69A;</span>
            {driverName ? `${driverName} is on the way` : 'Driver is on the way'}
          </h2>
          <span className="text-xs text-gray-400">Updated {lastUpdated}</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Distance */}
          {distanceText && (
            <div className="bg-teal-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-teal-700">{distanceText}</div>
              <div className="text-xs text-teal-600 mt-1">Distance</div>
            </div>
          )}

          {/* ETA */}
          {etaText && (
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-700">{etaText}</div>
              <div className="text-xs text-blue-600 mt-1">ETA</div>
            </div>
          )}

          {/* Arrival Time */}
          {driverLocation.eta_minutes != null && (
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-700">
                {new Date(Date.now() + driverLocation.eta_minutes * 60000).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div className="text-xs text-purple-600 mt-1">Arrives at</div>
            </div>
          )}
        </div>

        {/* Google Maps fallback link */}
        <a
          href={`https://www.google.com/maps/dir/${driverLocation.lat},${driverLocation.lng}/${pickupLat},${pickupLng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-3 text-center text-sm text-teal-600 font-medium hover:text-teal-800"
        >
          Open in Google Maps &rarr;
        </a>
      </div>
    </div>
  )
}
