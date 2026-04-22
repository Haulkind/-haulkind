'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import {
  getOrderDetail, startTrip, markArrived, startWork, completeOrder,
  cancelOrder, acceptOrder, rejectOrder, uploadOrderPhoto, submitSignature,
  streamLocation, type Order,
} from '@/lib/api'
import SignaturePad from '@/components/SignaturePad'

// Parse a photo field that may come back as string[] (JSON), |||-separated string, or array
function parsePhotoField(field: unknown): string[] {
  if (!field) return []
  if (Array.isArray(field)) return field.filter(Boolean)
  if (typeof field !== 'string') return []
  const trimmed = field.trim()
  if (!trimmed) return []
  try {
    const parsed = JSON.parse(trimmed)
    if (Array.isArray(parsed)) return parsed.filter(Boolean)
  } catch {}
  return trimmed.split('|||').map(s => s.trim()).filter(Boolean)
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

const STATUS_FLOW = ['accepted', 'assigned', 'en_route', 'arrived', 'started', 'completed']

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { token, isLoading } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [beforePhotos, setBeforePhotos] = useState<string[]>([])
  const [afterPhotos, setAfterPhotos] = useState<string[]>([])
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [showSignaturePad, setShowSignaturePad] = useState(false)
  const locationRef = useRef<number | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [photoType, setPhotoType] = useState<'before' | 'after'>('before')
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null)
  const [driverLat, setDriverLat] = useState<number | null>(null)
  const [driverLng, setDriverLng] = useState<number | null>(null)
  const detailMapRef = useRef<HTMLDivElement>(null)
  const detailMapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!isLoading && !token) router.replace('/login')
  }, [token, isLoading, router])

  // Get driver's current position for distance calculation
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDriverLat(pos.coords.latitude)
        setDriverLng(pos.coords.longitude)
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  // Initialize mini-map on order detail page showing pickup location
  useEffect(() => {
    if (!order || !detailMapRef.current || detailMapInstanceRef.current) return
    const oLat = order.pickup_lat ? Number(order.pickup_lat) : null
    const oLng = order.pickup_lng ? Number(order.pickup_lng) : null
    // Use pickup coords, or driver coords, or default NJ
    const centerLat = oLat || driverLat || 40.0583
    const centerLng = oLng || driverLng || -74.4057

    const initDetailMap = async () => {
      const L = (await import('leaflet')).default
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }
      if (detailMapInstanceRef.current) return

      const map = L.map(detailMapRef.current!, {
        zoomControl: false,
        attributionControl: false,
      }).setView([centerLat, centerLng], 13)

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map)

      // Pickup location marker (red pin with price)
      if (oLat && oLng) {
        const price = formatPayout(order)
        const icon = L.divIcon({
          className: 'order-detail-pin',
          html: `<div style="background:#ef4444;color:#fff;padding:6px 12px;border-radius:10px;font-weight:bold;font-size:14px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid #fff;">$${price}</div>`,
          iconSize: [80, 34],
          iconAnchor: [40, 34],
        })
        L.marker([oLat, oLng], { icon }).addTo(map)
      }

      // Driver location marker (blue dot)
      if (driverLat && driverLng) {
        const driverIcon = L.divIcon({
          className: 'driver-marker',
          html: '<div style="width:14px;height:14px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        })
        L.marker([driverLat, driverLng], { icon: driverIcon }).addTo(map)
      }

      // Fit bounds to show both driver and pickup
      if (oLat && oLng && driverLat && driverLng) {
        map.fitBounds([[oLat, oLng], [driverLat, driverLng]], { padding: [30, 30] })
      }

      detailMapInstanceRef.current = map
      setTimeout(() => map.invalidateSize(), 100)
    }

    initDetailMap()

    return () => {
      if (detailMapInstanceRef.current) {
        detailMapInstanceRef.current.remove()
        detailMapInstanceRef.current = null
      }
    }
  }, [order, driverLat, driverLng])

  const fetchOrder = useCallback(async () => {
    if (!token || !id) return
    try {
      const data = await getOrderDetail(token, id)
      setOrder(data.order)
      setBeforePhotos(parsePhotoField(data.order.before_photos))
      setAfterPhotos(parsePhotoField(data.order.after_photos))
      if (data.order.signature_data) setSignatureData(data.order.signature_data)
    } catch (err) {
      console.error('Failed to load order:', err)
    } finally {
      setLoading(false)
    }
  }, [token, id])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  // GPS location streaming when en_route/arrived/started
  useEffect(() => {
    const status = order?.status?.toLowerCase()
    if (token && order && ['en_route', 'arrived', 'started'].includes(status || '')) {
      // Stream location every 30 seconds
      const stream = () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            streamLocation(token, String(order.id), pos.coords.latitude, pos.coords.longitude).catch(console.error)
          },
          (err) => console.warn('GPS error:', err),
          { enableHighAccuracy: true, timeout: 15000 }
        )
      }
      stream() // immediate
      locationRef.current = window.setInterval(stream, 30000)
    }
    return () => {
      if (locationRef.current) window.clearInterval(locationRef.current)
    }
  }, [token, order?.status, order?.id])

  const handleAction = async (action: string) => {
    if (!token || !order) return
    setActing(true)
    try {
      switch (action) {
        case 'accept':
          await acceptOrder(token, String(order.id))
          break
        case 'start-trip':
          await startTrip(token, String(order.id))
          break
        case 'arrived':
          await markArrived(token, String(order.id))
          break
        case 'start-work':
          if (beforePhotos.length === 0) {
            alert('Please take at least one BEFORE photo first')
            setActing(false)
            return
          }
          await startWork(token, String(order.id))
          break
        case 'complete':
          if (afterPhotos.length === 0) {
            alert('Please take at least one AFTER photo first')
            setActing(false)
            return
          }
          if (!signatureData) {
            setActing(false)
            setShowSignaturePad(true)
            return
          }
          await completeOrder(token, String(order.id), signatureData)
          break
        case 'cancel':
          if (confirm('Are you sure you want to cancel this order?')) {
            await cancelOrder(token, String(order.id))
            // Navigate back to dashboard immediately so driver sees updated lists
            router.replace('/dashboard')
            return
          } else {
            setActing(false)
            return
          }
          break
      }
      await fetchOrder()
    } catch (err: any) {
      alert(err.message || 'Action failed')
    } finally {
      setActing(false)
    }
  }

  const handleDecline = async () => {
    if (!token || !order) return
    if (confirm('Are you sure you want to decline this order?')) {
      try {
        await rejectOrder(token, String(order.id))
      } catch (err) {
        // Non-fatal — still navigate back
      }
      router.back()
    }
  }

  const handlePhotoCapture = (type: 'before' | 'after', source: 'camera' | 'gallery') => {
    setPhotoType(type)
    const input = source === 'camera' ? cameraInputRef.current : galleryInputRef.current
    input?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token || !order) return
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      })
      await uploadOrderPhoto(token, String(order.id), photoType, base64)
      if (photoType === 'before') setBeforePhotos(prev => [...prev, base64])
      else setAfterPhotos(prev => [...prev, base64])
    } catch (err) {
      alert('Failed to upload photo')
    }
    // Reset input
    e.target.value = ''
  }

  const handleSignatureSave = async (dataUrl: string) => {
    if (!token || !order) return
    try {
      await submitSignature(token, String(order.id), dataUrl)
      setSignatureData(dataUrl)
      setShowSignaturePad(false)
      // Now complete the order automatically
      setActing(true)
      try {
        await completeOrder(token, String(order.id), dataUrl)
        await fetchOrder()
      } catch (err: any) {
        alert(err.message || 'Failed to complete order')
      } finally {
        setActing(false)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save signature')
    }
  }

  const openNavigation = () => {
    if (!order) return
    const lat = order.pickup_lat
    const lng = order.pickup_lng
    const address = order.pickup_address || order.pickupAddress
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
    } else if (address) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank')
    }
  }

  const callCustomer = () => {
    const phone = order?.customer_phone
    if (phone) window.open(`tel:${phone}`, '_self')
  }

  if (isLoading || loading || !token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-5">
        <p className="text-gray-500 text-lg mb-4">Order not found</p>
        <button onClick={() => router.back()} className="text-primary-600 font-semibold">Go back</button>
      </div>
    )
  }

  const status = order.status?.toLowerCase() || ''
  const isCompleted = status === 'completed'
  const isCancelled = status === 'cancelled'
  const isPending = status === 'pending' || status === 'available' || status === 'open'
  const isFinished = isCompleted || isCancelled

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hidden file inputs for photo capture — camera vs gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <div className="bg-primary-900 text-white px-5 pt-14 pb-5">
        <button onClick={() => router.back()} className="text-primary-200 text-sm mb-2">
          ← Back
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold">Order #{String(order.id).slice(0, 8)}</h1>
            <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded ${statusBadge(status)}`}>
              {status.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-400">${formatPayout(order)}</p>
            <p className="text-xs text-primary-300">Your earnings</p>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      {!isFinished && (
        <div className="flex bg-white border-b border-gray-200">
          {(status === 'accepted' || status === 'assigned' || status === 'en_route') && (
            <button onClick={openNavigation} className="flex-1 py-3 text-center text-sm font-semibold text-primary-600 border-r border-gray-200">
              🗺️ Navigate
            </button>
          )}
          {order.customer_phone && (
            <button onClick={callCustomer} className="flex-1 py-3 text-center text-sm font-semibold text-primary-600">
              📞 Call Customer
            </button>
          )}
        </div>
      )}

      {/* Mini Map showing pickup location */}
      {(() => {
        const oLat = order.pickup_lat ? Number(order.pickup_lat) : null
        const oLng = order.pickup_lng ? Number(order.pickup_lng) : null
        const dist = (driverLat && driverLng && oLat && oLng)
          ? getDistanceMiles(driverLat, driverLng, oLat, oLng).toFixed(1)
          : null
        return (
          <div className="relative">
            <div
              ref={detailMapRef}
              className="w-full bg-gray-200"
              style={{ height: 200 }}
            />
            {dist && (
              <div className="absolute bottom-3 left-3 bg-primary-900/90 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg z-[1000]">
                {dist} mi away
              </div>
            )}
          </div>
        )
      })()}

      {/* Order Info */}
      <div className="px-5 py-4 space-y-4">
        {/* Details Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Order Details</h3>
          <InfoRow label="Type" value={formatServiceType(order.service_type || order.serviceType || 'HAUL_AWAY')} />
          <InfoRow label="Address" value={order.pickup_address || order.pickupAddress || 'N/A'} />
          <InfoRow label="Scheduled" value={formatDate(order)} />
          {(order.time_window || order.pickup_time_window) && <InfoRow label="Window" value={formatTimeWindow(order.time_window || order.pickup_time_window || '')} />}
          {order.volume_tier && <InfoRow label="Volume" value={order.volume_tier} />}
          {order.estimated_hours && <InfoRow label="Est. Hours" value={`${order.estimated_hours}h`} />}
          {order.helper_count && Number(order.helper_count) > 0 && <InfoRow label="Helpers" value={`${order.helper_count} person${Number(order.helper_count) > 1 ? 's' : ''}`} />}
          {order.customer_name && <InfoRow label="Customer" value={order.customer_name} />}
        </div>

        {/* Service-Specific Items Card */}
        {(() => {
          const items = parseItemsJson(order.items_json)
          const description = stripPricing(order.description || order.customer_notes || '')
          const serviceType = (order.service_type || order.serviceType || '').toUpperCase()

          // Parse description to extract items list and customer notes separately
          let itemsFromDescription: string[] = []
          let customerNoteText = description
          if (description.startsWith('Items:')) {
            const parts = description.split('\n')
            const itemLine = parts[0].replace('Items:', '').trim()
            itemsFromDescription = itemLine.split(',').map(s => s.trim()).filter(Boolean)
            customerNoteText = parts.slice(1).join('\n').trim()
          }

          // Combine items from items_json and description
          const allItems = items.length > 0 ? items : itemsFromDescription

          const hasContent = allItems.length > 0 || customerNoteText
          if (!hasContent) return null

          return (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">
                {serviceType === 'HAUL_AWAY' ? 'Items to Remove' :
                 serviceType === 'LABOR_ONLY' ? 'Job Details' :
                 serviceType === 'MATTRESS_SWAP' ? 'Mattress Swap Details' :
                 serviceType === 'FURNITURE_ASSEMBLY' ? 'Assembly Details' :
                 serviceType === 'DUMPSTER_RENTAL' ? 'Dumpster Rental Details' :
                 'Service Details'}
              </h3>

              {/* Items list */}
              {allItems.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {allItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 py-1.5 px-3 bg-gray-50 rounded-lg">
                      <span className="text-base">
                        {serviceType === 'HAUL_AWAY' ? '🗑️' :
                         serviceType === 'FURNITURE_ASSEMBLY' ? '🔧' :
                         serviceType === 'MATTRESS_SWAP' ? '🛏️' :
                         serviceType === 'LABOR_ONLY' ? '💪' : '📦'}
                      </span>
                      <span className="text-sm font-medium text-gray-800">{stripPricing(item)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Customer notes */}
              {customerNoteText && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-xs font-semibold text-yellow-800 mb-1">Customer Notes:</p>
                  <p className="text-sm text-yellow-900 whitespace-pre-wrap">{customerNoteText}</p>
                </div>
              )}
            </div>
          )
        })()}

        {/* Customer Photos Section */}
        {(() => {
          const photoUrls = order.photo_urls || order.photos
          if (!photoUrls) return null
          let photoArr: string[] = []
          try {
            photoArr = typeof photoUrls === 'string' ? JSON.parse(photoUrls) : photoUrls
          } catch {
            if (typeof photoUrls === 'string') photoArr = photoUrls.split('|||').filter(Boolean)
          }
          if (!Array.isArray(photoArr) || photoArr.length === 0) return null
          return (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Customer Photos ({photoArr.length})</h3>
              <div className="grid grid-cols-2 gap-3">
                {photoArr.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setLightboxPhoto(url)}
                    className="relative rounded-lg overflow-hidden border border-gray-200 active:opacity-80"
                  >
                    <img
                      src={url.startsWith('data:') ? url : (url.startsWith('http') ? url : `data:image/jpeg;base64,${url}`)}
                      alt={`Customer photo ${idx + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <span className="absolute bottom-1 right-1 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded">
                      Tap to enlarge
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
        })()}

        {/* Photos Section */}
        {!isFinished && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-5">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Job Photos</h3>

            {/* BEFORE photos — required to start work */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-800">
                  Before Photos <span className="text-gray-500">({beforePhotos.length})</span>
                </span>
                {beforePhotos.length === 0 && (
                  <span className="text-xs font-semibold text-red-600">Required</span>
                )}
              </div>
              {beforePhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {beforePhotos.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLightboxPhoto(url)}
                      className="relative rounded-lg overflow-hidden border border-gray-200 aspect-square bg-gray-50 active:opacity-80"
                    >
                      <img
                        src={url.startsWith('data:') || url.startsWith('http') ? url : `data:image/jpeg;base64,${url}`}
                        alt={`Before photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => handlePhotoCapture('before', 'camera')}
                  className="flex-1 px-3 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold active:bg-primary-700"
                >
                  📷 Take Photo
                </button>
                <button
                  onClick={() => handlePhotoCapture('before', 'gallery')}
                  className="flex-1 px-3 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold active:bg-gray-200"
                >
                  🖼️ From Gallery
                </button>
              </div>
            </div>

            {/* AFTER photos — required to complete (shown once work has started) */}
            {['started', 'photo_taken', 'signed'].includes(status) && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800">
                    After Photos <span className="text-gray-500">({afterPhotos.length})</span>
                  </span>
                  {afterPhotos.length === 0 && (
                    <span className="text-xs font-semibold text-red-600">Required</span>
                  )}
                </div>
                {afterPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {afterPhotos.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLightboxPhoto(url)}
                        className="relative rounded-lg overflow-hidden border border-gray-200 aspect-square bg-gray-50 active:opacity-80"
                      >
                        <img
                          src={url.startsWith('data:') || url.startsWith('http') ? url : `data:image/jpeg;base64,${url}`}
                          alt={`After photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePhotoCapture('after', 'camera')}
                    className="flex-1 px-3 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold active:bg-primary-700"
                  >
                    📷 Take Photo
                  </button>
                  <button
                    onClick={() => handlePhotoCapture('after', 'gallery')}
                    className="flex-1 px-3 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold active:bg-gray-200"
                  >
                    🖼️ From Gallery
                  </button>
                </div>
              </div>
            )}

            {/* Signature — required to complete once after photo is taken */}
            {['started', 'photo_taken', 'signed'].includes(status) && afterPhotos.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800">Customer Signature</span>
                  {!signatureData && (
                    <span className="text-xs font-semibold text-red-600">Required</span>
                  )}
                </div>
                {signatureData ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={signatureData}
                      alt="Customer signature"
                      className="h-20 bg-white border border-gray-200 rounded-lg p-1 flex-1 object-contain"
                    />
                    <button
                      onClick={() => setShowSignaturePad(true)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 active:bg-gray-100"
                    >
                      Redo
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSignaturePad(true)}
                    className="w-full px-3 py-3 border-2 border-dashed border-primary-400 text-primary-700 rounded-lg text-sm font-semibold bg-primary-50 active:bg-primary-100"
                  >
                    ✍️ Capture Customer Signature
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Status Progress */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Progress</h3>
          <div className="space-y-2">
            {STATUS_FLOW.map((s, i) => {
              const currentIdx = STATUS_FLOW.indexOf(status)
              const isDone = i <= currentIdx
              const isCurrent = s === status
              return (
                <div key={s} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isDone ? 'bg-green-500 text-white' : isCurrent ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <span className={`text-sm ${isDone ? 'text-green-700 font-medium' : isCurrent ? 'text-primary-700 font-medium' : 'text-gray-400'}`}>
                    {s.replace(/_/g, ' ').charAt(0).toUpperCase() + s.replace(/_/g, ' ').slice(1)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Action Buttons */}
        {!isFinished && (
          <div className="space-y-3 pb-4">
            {/* Accept/Decline for pending (available) orders */}
            {isPending ? (
              <div className="flex gap-3">
                <button
                  onClick={handleDecline}
                  disabled={acting}
                  className="flex-1 py-4 border-2 border-red-500 text-red-500 rounded-xl font-bold text-lg hover:bg-red-50 transition disabled:opacity-50"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleAction('accept')}
                  disabled={acting}
                  className="flex-[2] py-4 bg-green-600 text-white rounded-xl text-lg font-bold hover:bg-green-700 transition disabled:opacity-50"
                >
                  {acting ? 'Processing...' : 'Accept Order'}
                </button>
              </div>
            ) : (
              <>
                {getNextAction(status) && (
                  <button
                    onClick={() => handleAction(getNextAction(status)!)}
                    disabled={acting}
                    className="w-full py-4 bg-green-600 text-white rounded-xl text-lg font-bold hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {acting ? 'Processing...' : getActionLabel(status)}
                  </button>
                )}

                {status !== 'completed' && (
                  <button
                    onClick={() => handleAction('cancel')}
                    disabled={acting}
                    className="w-full py-3 border-2 border-red-500 text-red-500 rounded-xl font-semibold hover:bg-red-50 transition disabled:opacity-50"
                  >
                    Cancel Order
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Completed state */}
        {isCompleted && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5 text-center">
            <p className="text-4xl mb-2">✅</p>
            <p className="text-green-800 font-bold text-lg">Order Completed</p>
            <p className="text-green-600 text-sm mt-1">Earnings will be added to your balance</p>
          </div>
        )}

        {isCancelled && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 text-center">
            <p className="text-4xl mb-2">❌</p>
            <p className="text-red-800 font-bold text-lg">Order Cancelled</p>
          </div>
        )}
      </div>

      {/* Map marker styles */}
      <style jsx global>{`
        .order-detail-pin { background: none !important; border: none !important; }
        .driver-marker { background: none !important; border: none !important; }
      `}</style>

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <SignaturePad
          onSave={handleSignatureSave}
          onCancel={() => setShowSignaturePad(false)}
        />
      )}

      {/* Lightbox Photo Viewer */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            onClick={() => setLightboxPhoto(null)}
            className="absolute top-12 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-xl font-bold z-10"
          >
            ✕
          </button>
          <img
            src={lightboxPhoto.startsWith('data:') ? lightboxPhoto : (lightboxPhoto.startsWith('http') ? lightboxPhoto : `data:image/jpeg;base64,${lightboxPhoto}`)}
            alt="Customer photo fullscreen"
            className="max-w-[95vw] max-h-[85vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{value}</span>
    </div>
  )
}

function getNextAction(status: string): string | null {
  switch (status) {
    case 'accepted':
    case 'assigned': return 'start-trip'
    case 'en_route': return 'arrived'
    case 'arrived': return 'start-work'
    case 'started': return 'complete'
    default: return null
  }
}

function getActionLabel(status: string): string {
  switch (status) {
    case 'accepted':
    case 'assigned': return '🚗 Start Trip'
    case 'en_route': return '📍 I\'ve Arrived'
    case 'arrived': return '🔨 Start Work'
    case 'started': return '✅ Complete Order'
    default: return 'Next Step'
  }
}

function statusBadge(status: string): string {
  switch (status) {
    case 'completed': return 'bg-green-800 text-green-100'
    case 'cancelled': return 'bg-red-800 text-red-100'
    case 'en_route':
    case 'arrived':
    case 'started': return 'bg-blue-800 text-blue-100'
    default: return 'bg-primary-800 text-primary-100'
  }
}

function formatPayout(order: Order): string {
  const cents = order.driver_earnings_cents || order.driver_earnings
  if (cents && cents > 100) return (cents / 100).toFixed(2)
  if (order.payout) return order.payout.toFixed(2)
  if (order.driver_earnings) return order.driver_earnings.toFixed(2)
  const price = order.price || order.total || 0
  return (price * 0.7).toFixed(2)
}

function formatDate(order: Order): string {
  const d = order.scheduled_for || order.scheduledFor
  if (!d) return 'N/A'
  try {
    return new Date(d).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    })
  } catch { return 'N/A' }
}

function formatServiceType(type: string): string {
  const labels: Record<string, string> = {
    'HAUL_AWAY': 'Hauling',
    'LABOR_ONLY': 'Moving Labor',
    'MATTRESS_SWAP': 'Mattress Swap',
    'FURNITURE_ASSEMBLY': 'Furniture Assembly',
    'DUMPSTER_RENTAL': 'Dumpster Rental',
    'DONATION_PICKUP': 'Donation Pickup',
  }
  return labels[type.toUpperCase()] || type.replace(/_/g, ' ')
}

function formatTimeWindow(window: string): string {
  const labels: Record<string, string> = {
    'ALL_DAY': 'All Day (8AM - 8PM)',
    'MORNING': 'Morning (8AM - 12PM)',
    'AFTERNOON': 'Afternoon (12PM - 4PM)',
    'EVENING': 'Evening (4PM - 8PM)',
  }
  return labels[window.toUpperCase()] || window.replace(/_/g, ' ')
}

// Strip pricing info from description — drivers should only see items, not prices/discounts/totals
function stripPricing(text: string): string {
  if (!text) return ''
  // Remove "($XX.XX)" price tags after items
  let cleaned = text.replace(/\s*\(\$[\d,.]+\)/g, '')
  // Remove "| 5% per-item discount: -$XX.XX" or similar discount lines
  cleaned = cleaned.replace(/\s*\|\s*\d+%\s*(?:per-item\s+)?discount:\s*-?\$[\d,.]+/gi, '')
  // Remove "| Total: $XX.XX" 
  cleaned = cleaned.replace(/\s*\|\s*Total:\s*\$[\d,.]+/gi, '')
  // Clean up trailing pipes and whitespace
  cleaned = cleaned.replace(/\s*\|\s*$/, '').trim()
  return cleaned
}

function parseItemsJson(itemsJson: string | undefined): string[] {
  if (!itemsJson) return []
  try {
    const parsed = typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson
    if (!Array.isArray(parsed)) return []
    return parsed.map((item: any) => {
      if (typeof item === 'string') return item
      if (item && item.name) {
        const qty = item.quantity || 1
        return qty > 1 ? `${item.name} x${qty}` : item.name
      }
      return String(item)
    }).filter(Boolean)
  } catch {
    return []
  }
}
