'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

const servicesList = [
  {
    id: 'haul-away',
    title: 'Junk Removal (PA Only)',
    desc: 'We haul away furniture, appliances, yard waste, and general junk fast. PA residents only.',
    price: 'Starting at $99',
    priceNote: 'disposal included',
    colorBg: 'bg-teal-50',
    colorBorder: 'border-teal-500',
    colorText: 'text-teal-600',
    colorIconBg: 'bg-teal-100',
    href: '/#calculator',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
  },
  {
    id: 'labor-only',
    title: 'Moving Labor',
    desc: 'Get help loading, unloading, heavy lifting, and moving furniture.',
    price: 'Starting at $79/hr',
    priceNote: 'equipment included',
    colorBg: 'bg-blue-50',
    colorBorder: 'border-blue-500',
    colorText: 'text-blue-600',
    colorIconBg: 'bg-blue-100',
    href: '/quote/labor-only/hours',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: 'donation',
    title: 'Donation Pickup',
    desc: 'We pick up eligible items and deliver them to a local charity.',
    price: 'Starting at $109',
    priceNote: 'charity delivery included',
    colorBg: 'bg-green-50',
    colorBorder: 'border-green-500',
    colorText: 'text-green-600',
    colorIconBg: 'bg-green-100',
    href: '/#calculator',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    id: 'mattress-swap',
    title: 'Mattress Swap',
    desc: 'We remove your old mattress and set up your new one.',
    price: 'Starting at $99',
    priceNote: 'removal & setup included',
    colorBg: 'bg-purple-50',
    colorBorder: 'border-purple-500',
    colorText: 'text-purple-600',
    colorIconBg: 'bg-purple-100',
    href: '/quote/mattress-swap',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'assembly',
    title: 'Furniture Assembly',
    desc: 'Fast assembly for IKEA, Wayfair, Amazon, and more.',
    price: 'Starting at $87',
    priceNote: 'tools & cleanup included',
    colorBg: 'bg-orange-50',
    colorBorder: 'border-orange-500',
    colorText: 'text-orange-600',
    colorIconBg: 'bg-orange-100',
    href: '/quote/assembly',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

function QuotePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedService, setSelectedService] = useState<string | null>(null)

  // Handle ?service= query param from service pages
  useEffect(() => {
    const serviceParam = searchParams.get('service')
    if (serviceParam) {
      const match = servicesList.find(s => s.id === serviceParam)
      if (match) {
        setSelectedService(match.id)
        setTimeout(() => {
          router.push(match.href)
        }, 400)
      }
    }
  }, [searchParams, router])

  const handleServiceSelect = (service: typeof servicesList[number]) => {
    setSelectedService(service.id)
    if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).gtag) {
      ((window as unknown as Record<string, unknown>).gtag as (...args: unknown[]) => void)('event', 'ads_conversion_Solicitar_cota_o_1', {})
    }
    if (typeof window !== 'undefined' && (window as any).clarity) {
      (window as any).clarity('set', 'quote_submitted', 'true');
      (window as any).clarity('set', 'service_type', service.id);
    }
    router.push(service.href)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Get a Free Quote and Book Fast
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-4">
            Trusted local pros for junk removal, moving help, mattress swaps, donation pickup, and furniture assembly. No hidden fees.
          </p>
          <a
            href="tel:+16094568188"
            className="inline-flex items-center gap-2 text-teal-600 font-semibold hover:text-teal-700 transition text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            Need help today? Call or text (609) 456-8188
          </a>
        </div>

        {/* Helper text */}
        <div className="text-center mb-8">
          <p className="text-xl md:text-2xl font-semibold text-gray-800 mb-2">
            👇 Select Your Service to Get Started
          </p>
          <div className="flex justify-center">
            <svg className="w-8 h-8 text-teal-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>

        {/* Service Cards */}
        <div className="grid sm:grid-cols-2 gap-6">
          {servicesList.map((service) => {
            const isSelected = selectedService === service.id
            return (
              <button
                key={service.id}
                onClick={() => handleServiceSelect(service)}
                className={`relative bg-white rounded-xl shadow-md p-6 md:p-8 hover:shadow-xl transition-all text-left border-2 ${
                  isSelected ? `${service.colorBorder} ${service.colorBg}` : 'border-transparent hover:border-gray-200'
                }`}
              >
                <div className={`w-14 h-14 ${service.colorIconBg} rounded-full flex items-center justify-center mb-4 ${service.colorText}`}>
                  {service.icon}
                </div>
                <h2 className="text-xl md:text-2xl font-bold mb-2">{service.title}</h2>
                <p className="text-gray-600 text-sm mb-4">
                  {service.desc}
                </p>
                <div className={`${service.colorText} font-bold text-base md:text-lg`}>
                  {service.price} <span className="text-gray-500 font-normal text-sm">{' \u2014 '}{service.priceNote}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Trust badges */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-gray-600">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            <span className="font-medium text-sm">Licensed & Insured Drivers</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="font-medium text-sm">GPS Tracking</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="font-medium text-sm">Price Guaranteed Before You Book</span>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-6 text-center">
          <a
            href="tel:+16094568188"
            className="inline-flex items-center gap-2 bg-teal-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-teal-700 transition text-base shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            Need help now? Call or text (609) 456-8188
          </a>
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link href="/" className="text-gray-500 hover:text-gray-700 transition text-sm">
            {'← Back to Home'}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function QuotePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 py-12"><div className="container mx-auto px-4 text-center"><p className="text-gray-500">Loading...</p></div></div>}>
      <QuotePageInner />
    </Suspense>
  )
}
