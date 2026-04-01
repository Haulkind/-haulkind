'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../lib/api';

type DriverLocation = {
  id: string;
  name: string;
  display_name: string;
  phone: string;
  email: string;
  status: string;
  driver_status: string;
  is_online: boolean;
  vehicle_type: string;
  lat: number | null;
  lng: number | null;
  heading: number | null;
  speed: number | null;
  location_updated_at: string | null;
};

declare global {
  interface Window {
    L: any;
  }
}

export default function MapPage() {
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const initialFitDone = useRef(false);

  // Load Leaflet CSS + JS dynamically
  useEffect(() => {
    if (typeof window !== 'undefined' && window.L) {
      setLeafletReady(true);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);

  const fetchDrivers = useCallback(async () => {
    try {
      const data = await api.getDriverLocations();
      setDrivers(data.drivers);
      setLastRefresh(new Date());
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load driver locations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling every 10 seconds
  useEffect(() => {
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 10000);
    return () => clearInterval(interval);
  }, [fetchDrivers]);

  // Initialize map once Leaflet is ready
  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current || mapRef.current) return;

    const L = window.L;
    const map = L.map(mapContainerRef.current).setView([39.95, -75.17], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 200);
  }, [leafletReady]);

  // Update markers whenever drivers change
  useEffect(() => {
    if (!mapRef.current || !leafletReady) return;
    const L = window.L;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const driversWithLocation = drivers.filter(d => d.lat != null && d.lng != null);

    driversWithLocation.forEach(driver => {
      const isOnline = driver.is_online;
      const locationAge = driver.location_updated_at
        ? Math.floor((Date.now() - new Date(driver.location_updated_at).getTime()) / 60000)
        : null;
      const isRecent = locationAge !== null && locationAge < 30;

      const color = isOnline && isRecent ? '#22c55e' : isOnline ? '#eab308' : '#9ca3af';
      const borderColor = isOnline && isRecent ? '#16a34a' : isOnline ? '#ca8a04' : '#6b7280';

      const icon = L.divIcon({
        html: `<div style="
          width: 32px; height: 32px; border-radius: 50%;
          background: ${color}; border: 3px solid ${borderColor};
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: bold; font-size: 14px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        ">${(driver.display_name || driver.name || '?').charAt(0).toUpperCase()}</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const locationAgeText = locationAge !== null
        ? locationAge < 1 ? 'Just now' : locationAge < 60 ? `${locationAge}m ago` : `${Math.floor(locationAge / 60)}h ago`
        : 'No location data';

      const speedText = driver.speed != null ? `${(driver.speed * 2.237).toFixed(0)} mph` : '';

      const popup = `
        <div style="min-width: 180px; font-family: sans-serif;">
          <strong style="font-size: 14px;">${driver.display_name || driver.name || 'Unknown'}</strong>
          <div style="font-size: 12px; color: #666; margin-top: 4px;">
            ${driver.phone ? `<div>Phone: ${driver.phone}</div>` : ''}
            ${driver.email ? `<div>Email: ${driver.email}</div>` : ''}
            ${driver.vehicle_type ? `<div>Vehicle: ${driver.vehicle_type}</div>` : ''}
            <div style="margin-top: 4px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${isOnline ? '#22c55e' : '#9ca3af'}; margin-right: 4px;"></span>
              ${isOnline ? 'Online' : 'Offline'}
            </div>
            <div>Location: ${locationAgeText}</div>
            ${speedText ? `<div>Speed: ${speedText}</div>` : ''}
          </div>
        </div>
      `;

      const marker = L.marker([driver.lat!, driver.lng!], { icon }).addTo(mapRef.current).bindPopup(popup);
      markersRef.current.push(marker);
    });

    if (driversWithLocation.length > 0 && !initialFitDone.current) {
      const bounds = L.latLngBounds(driversWithLocation.map((d: DriverLocation) => [d.lat!, d.lng!]));
      mapRef.current.fitBounds(bounds.pad(0.2));
      initialFitDone.current = true;
    }
  }, [drivers, leafletReady]);

  const onlineCount = drivers.filter(d => d.is_online).length;
  const withLocationCount = drivers.filter(d => d.lat != null && d.lng != null).length;

  return (
    <div className="p-4 sm:p-8 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Driver Map</h1>
          <p className="text-sm text-gray-500 mt-1">
            {drivers.length} drivers total | {onlineCount} online | {withLocationCount} with GPS
            {lastRefresh && <span className="ml-2">(updated {lastRefresh.toLocaleTimeString()})</span>}
          </p>
        </div>
        <button
          onClick={fetchDrivers}
          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>
      )}

      {loading && !leafletReady ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading map...</div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-4">
          {/* Map */}
          <div className="flex-1 min-h-[400px] lg:min-h-0 rounded-lg overflow-hidden border border-gray-200">
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: '400px' }} />
          </div>

          {/* Driver list sidebar */}
          <div className="w-full lg:w-80 bg-white rounded-lg border border-gray-200 overflow-y-auto max-h-[400px] lg:max-h-full">
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-sm text-gray-700">All Drivers ({drivers.length})</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {drivers.map(driver => {
                const locationAge = driver.location_updated_at
                  ? Math.floor((Date.now() - new Date(driver.location_updated_at).getTime()) / 60000)
                  : null;
                const isRecent = locationAge !== null && locationAge < 30;

                return (
                  <div
                    key={driver.id}
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                    onClick={() => {
                      if (driver.lat != null && driver.lng != null && mapRef.current) {
                        mapRef.current.setView([driver.lat, driver.lng], 15);
                        const marker = markersRef.current.find((m: any) => {
                          const ll = m.getLatLng();
                          return Math.abs(ll.lat - driver.lat!) < 0.0001 && Math.abs(ll.lng - driver.lng!) < 0.0001;
                        });
                        if (marker) marker.openPopup();
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        driver.is_online && isRecent ? 'bg-green-500' : driver.is_online ? 'bg-yellow-500' : 'bg-gray-400'
                      }`} />
                      <span className="font-medium text-gray-900 truncate">
                        {driver.display_name || driver.name || 'Unknown'}
                      </span>
                    </div>
                    <div className="ml-5 text-xs text-gray-500 mt-0.5">
                      {driver.phone || driver.email || 'No contact'}
                      {driver.lat != null ? (
                        <span className="ml-1">
                          | {locationAge !== null
                            ? locationAge < 1 ? 'just now' : locationAge < 60 ? `${locationAge}m ago` : `${Math.floor(locationAge / 60)}h ago`
                            : 'no GPS'}
                        </span>
                      ) : (
                        <span className="ml-1 text-red-400">| No GPS</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {drivers.length === 0 && (
                <div className="px-3 py-8 text-center text-sm text-gray-400">No approved drivers found</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
