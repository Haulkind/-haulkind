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
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)

  // Load Google Maps script
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsScriptLoaded(true)
      return
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsScriptLoaded(true)
          clearInterval(checkInterval)
        }
      }, 100)
      return () => clearInterval(checkInterval)
    }

    // Load script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDummy&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => setIsScriptLoaded(true)
    document.head.appendChild(script)

    return () => {
      // Cleanup if needed
    }
  }, [])

  // Initialize autocomplete
  useEffect(() => {
    if (!isScriptLoaded || !inputRef.current || autocompleteRef.current) return

    try {
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'us' },
        fields: ['address_components', 'formatted_address', 'geometry'],
        types: ['address']
      })

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()

        if (!place.address_components || !place.geometry) {
          console.warn('[AUTOCOMPLETE] No address components or geometry')
          return
        }

        // Parse address components
        let street = ''
        let city = ''
        let state = ''
        let zip = ''

        for (const component of place.address_components) {
          const types = component.types

          if (types.includes('street_number')) {
            street = component.long_name + ' '
          } else if (types.includes('route')) {
            street += component.long_name
          } else if (types.includes('locality')) {
            city = component.long_name
          } else if (types.includes('administrative_area_level_1')) {
            state = component.short_name
          } else if (types.includes('postal_code')) {
            zip = component.long_name
          }
        }

        const lat = place.geometry.location?.lat() || 0
        const lng = place.geometry.location?.lng() || 0

        console.log('[AUTOCOMPLETE] Address selected:', {
          street,
          city,
          state,
          zip,
          lat,
          lng,
          formattedAddress: place.formatted_address
        })

        onAddressSelect({
          street: street.trim(),
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
      console.error('[AUTOCOMPLETE] Initialization error:', error)
    }
  }, [isScriptLoaded, onAddressSelect])

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      autoComplete="off"
    />
  )
}
