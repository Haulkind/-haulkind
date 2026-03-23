'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createJob, createCheckoutSession } from '@/lib/api'

export default function AssemblyContactPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [referral, setReferral] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(87)

  useEffect(() => {
    const data = sessionStorage.getItem('assemblyData')
    if (!data) {
      router.push('/quote/assembly')
      return
    }
    const parsed = JSON.parse(data)
    if (!parsed.schedule) {
      router.push('/quote/assembly/schedule')
    }
    if (parsed.total) {
      setTotal(parsed.total)
    }
  }, [router])

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  const handleSubmit = async () => {
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setError('Please fill in all required fields.')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit phone number.')
      return
    }

    setError('')
    setLoading(true)

    const existing = JSON.parse(sessionStorage.getItem('assemblyData') || '{}')
    const finalData = {
      ...existing,
      contact: { fullName, phone, email, referral },
    }
    sessionStorage.setItem('assemblyData', JSON.stringify(finalData))

    // Build description from selections
    const itemLines = (existing.items || []).map((i: any) => `${i.label} x${i.qty}`).join(', ')
    const customLine = existing.customItem ? `Custom: ${existing.customItem}` : ''
    const scheduleLine = existing.schedule
      ? `Date: ${existing.schedule.date}, Time: ${existing.schedule.time}, Floor: ${existing.schedule.floor}, ZIP: ${existing.schedule.zip}`
      : ''
    const storeLine = existing.schedule?.store ? `Store: ${existing.schedule.store}` : ''
    const description = ['Furniture Assembly', itemLines, customLine, scheduleLine, storeLine].filter(Boolean).join(' | ')

    // Build scheduledFor ISO from schedule data
    let scheduledFor: string | undefined
    if (existing.schedule?.date) {
      const timeMap: Record<string, string> = {
        morning: '09:00:00',
        afternoon: '13:00:00',
        evening: '17:00:00',
        flexible: '10:00:00',
      }
      const timeStr = timeMap[existing.schedule.time] || '10:00:00'
      scheduledFor = `${existing.schedule.date}T${timeStr}`
    }

    try {
      // 1. Create the job in the database
      const jobPayload: any = {
        serviceType: 'HAUL_AWAY',
        serviceAreaId: 1,
        pickupLat: 0,
        pickupLng: 0,
        pickupAddress: existing.schedule?.zip ? `ZIP ${existing.schedule.zip}` : '',
        scheduledFor: scheduledFor || new Date().toISOString(),
        customerNotes: description,
        customerName: fullName,
        customerPhone: phone,
        customerEmail: email,
        timeWindow: existing.schedule?.time?.toUpperCase() || 'FLEXIBLE',
        total: existing.total || 87,
      }
      const job = await createJob(jobPayload)

      // Fire Google Ads conversion
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'conversion', {
          send_to: 'AW-17988332947/ASSEMBLY',
          value: existing.total || 87,
          currency: 'USD',
        })
      }

      // 2. Create Stripe checkout session and redirect
      const origin = window.location.origin
      const checkout = await createCheckoutSession(
        job.id,
        `${origin}/quote/tracking?jobId=${job.id}&payment=success`,
        `${origin}/quote/assembly/contact?payment=cancel`
      )

      if (checkout.url) {
        window.location.href = checkout.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err: any) {
      console.error('[ASSEMBLY] Job/checkout failed:', err)
      setError(err.message || 'Something went wrong. Please try again or call (609) 456-8188.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Step 3 of 4</span>
            <span className="font-medium text-orange-600">Your Information</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: '75%' }} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Almost done! How can we reach you?</h1>
        <p className="text-gray-600 mb-8">We&apos;ll call or text to confirm your appointment.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Smith"
              className="w-full h-11 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="(555) 123-4567"
              className="w-full h-11 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full h-11 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">How did you hear about us? (optional)</label>
            <select
              value={referral}
              onChange={(e) => setReferral(e.target.value)}
              className="w-full h-11 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
            >
              <option value="">Select one</option>
              <option value="google">Google Search</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="referral">Friend / Referral</option>
              <option value="yelp">Yelp</option>
              <option value="nextdoor">Nextdoor</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <Link
            href="/quote/assembly/schedule"
            className="w-2/5 h-12 flex items-center justify-center border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Back
          </Link>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-3/5 h-12 bg-orange-500 text-white rounded-lg font-bold text-lg hover:bg-orange-600 transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : `Pay $${total}`}
          </button>
        </div>
      </div>
    </div>
  )
}
