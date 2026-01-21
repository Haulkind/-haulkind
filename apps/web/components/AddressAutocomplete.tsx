'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (address: {
    street: string
    city: string
    state: string
    zip: string
    lat: number
    lng: number
  }) => void
  placeholder?: string
  className?: string
}

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address: {
    house_number?: string
    road?: string
    city?: string
    town?: string
    village?: string
    state?: string
    postcode?: string
    country?: string
  }
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Start typing your address...',
  className = ''
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced search function
  const searchAddress = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Use Nominatim API directly - it's free and doesn't require API key
      // Adding countrycodes=us to limit to US addresses
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=us&limit=5&accept-language=en-US&q=${encodeURIComponent(query)}`,
        {
          headers: {
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'HaulKind/1.0 (https://haulkind.com)'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions')
      }

      const data: NominatimResult[] = await response.json()
      
      // Filter to only show results with street addresses
      const filteredData = data.filter(result => 
        result.address?.road || result.address?.house_number
      )

      setSuggestions(filteredData)
      setShowDropdown(filteredData.length > 0)
      setHighlightedIndex(-1)
    } catch (err) {
      console.error('Address search error:', err)
      setError('Unable to search addresses. Please enter manually.')
      setSuggestions([])
      setShowDropdown(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Debounce the search
    debounceRef.current = setTimeout(() => {
      searchAddress(newValue)
    }, 300)
  }

  // Handle suggestion selection
  const handleSelect = (result: NominatimResult) => {
    const address = result.address
    const street = [address.house_number, address.road].filter(Boolean).join(' ')
    const city = address.city || address.town || address.village || ''
    const state = address.state || ''
    const zip = address.postcode || ''

    // Get state abbreviation
    const stateAbbr = getStateAbbreviation(state)

    onChange(street)
    onSelect({
      street,
      city,
      state: stateAbbr,
      zip,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    })

    setSuggestions([])
    setShowDropdown(false)
  }

  // Get US state abbreviation
  const getStateAbbreviation = (stateName: string): string => {
    const states: Record<string, string> = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
      'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
      'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
      'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
      'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
      'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
      'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
      'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
      'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
      'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
      'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC'
    }
    // Try exact match first
    if (states[stateName]) return states[stateName]
    
    // Try case-insensitive match
    const normalizedName = stateName.trim()
    const matchedState = Object.keys(states).find(
      key => key.toLowerCase() === normalizedName.toLowerCase()
    )
    if (matchedState) return states[matchedState]
    
    // If already 2 letters, assume it's already an abbreviation
    if (normalizedName.length === 2) return normalizedName.toUpperCase()
    
    // Return original if no match found
    return stateName
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0) {
          handleSelect(suggestions[highlightedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        break
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
        autoComplete="off"
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((result, index) => (
            <button
              key={result.place_id}
              type="button"
              onClick={() => handleSelect(result)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                index === highlightedIndex ? 'bg-blue-50' : ''
              }`}
            >
              <div className="text-sm font-medium text-gray-900">
                {[result.address.house_number, result.address.road].filter(Boolean).join(' ')}
              </div>
              <div className="text-xs text-gray-500">
                {[
                  result.address.city || result.address.town || result.address.village,
                  result.address.state,
                  result.address.postcode
                ].filter(Boolean).join(', ')}
              </div>
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-1 text-xs text-amber-600">{error}</p>
      )}
    </div>
  )
}
