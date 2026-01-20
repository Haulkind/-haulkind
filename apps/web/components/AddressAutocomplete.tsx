'use client'

import { useEffect, useRef, useState } from 'react'

interface AddressComponents {
  street: string
  city: string
  state: string
  zip: string
  formattedAddress: string
  lat: number
  lng: number
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onAddressSelect: (components: AddressComponents) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export default function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Start typing your address...',
  className = '',
  disabled = false
}: AddressAutocompleteProps) {
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  // Load Google Maps script
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.google?.maps?.places) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyDummyKeyForManus'}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => setScriptLoaded(true)
      document.head.appendChild(script)
    } else {
      setScriptLoaded(true)
    }
  }, [])

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!scriptLoaded || !inputRef.current || autocompleteRef.current) return

    try {
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'us' },
        fields: ['address_components', 'formatted_address', 'geometry'],
        types: ['address']
      })

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        
        if (!place.geometry || !place.address_components) {
          console.log('[AUTOCOMPLETE] No details available for input')
          return
        }

        // Extract address components
        let street = ''
        let city = ''
        let state = ''
        let zip = ''

        for (const component of place.address_components) {
          const types = component.types

          if (types.includes('street_number')) {
            street = component.long_name
          }
          if (types.includes('route')) {
            street = street ? `${street} ${component.long_name}` : component.long_name
          }
          if (types.includes('locality')) {
            city = component.long_name
          }
          if (types.includes('administrative_area_level_1')) {
            state = component.short_name
          }
          if (types.includes('postal_code')) {
            zip = component.long_name
          }
        }

        const lat = place.geometry.location?.lat() || 0
        const lng = place.geometry.location?.lng() || 0

        onChange(place.formatted_address || '')
        
        onAddressSelect({
          street,
          city,
          state,
          zip,
          formattedAddress: place.formatted_address || '',
          lat,
          lng
        })
      })

      autocompleteRef.current = autocomplete
    } catch (error) {
      console.error('[AUTOCOMPLETE] Error initializing Google Places:', error)
    }
  }, [scriptLoaded, onChange, onAddressSelect])

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        disabled={disabled || !scriptLoaded}
        autoComplete="off"
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-secondary-600 rounded-full"></div>
        </div>
      )}
    </div>
  )
}
