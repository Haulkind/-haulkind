'use client'

import { useState, useEffect } from 'react'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('hk_cookie_consent')
    if (!consent) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('hk_cookie_consent', 'accepted')
    setVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem('hk_cookie_consent', 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6"
      style={{ animation: 'slideUp 0.4s ease-out' }}
    >
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl border border-gray-200 p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
        {/* Cookie icon + text */}
        <div className="flex-1">
          <p className="text-sm text-gray-700 leading-relaxed">
            <span className="font-semibold text-gray-900">We use cookies</span> to enhance your experience on our site, analyze traffic, and for marketing purposes. By clicking &quot;Accept All&quot;, you consent to our use of cookies.{' '}
            <a href="/privacy" className="text-primary-600 hover:underline font-medium">
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 shrink-0">
          <button
            onClick={handleDecline}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition shadow-sm"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  )
}
