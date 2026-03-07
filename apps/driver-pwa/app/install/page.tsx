'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function InstallPage() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    setIsIOS(/iPad|iPhone|iPod/.test(ua))
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    )
  }, [])

  // Already installed — redirect to login
  if (isStandalone) {
    return (
      <div className="min-h-screen bg-primary-900 text-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
          <span className="text-4xl font-black text-white">HK</span>
        </div>
        <h1 className="text-2xl font-bold mb-3">App Installed!</h1>
        <p className="text-primary-200 mb-8">HaulKind Drive is ready to use.</p>
        <Link
          href="/login"
          className="w-full max-w-xs py-4 bg-white text-primary-900 rounded-xl font-bold text-center block"
        >
          Open App
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary-900 text-white">
      {/* Hero */}
      <div className="px-6 pt-16 pb-8 text-center">
        <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl font-black text-white">HK</span>
        </div>
        <h1 className="text-3xl font-black mb-2">HaulKind Drive</h1>
        <p className="text-primary-200 text-lg">Your driver app for iOS</p>
      </div>

      {/* Earnings banner */}
      <div className="mx-6 bg-white/10 rounded-2xl p-5 mb-8 text-center">
        <p className="text-amber-300 font-bold text-lg mb-1">Earn $25–$45/hr</p>
        <p className="text-primary-200 text-sm">Accept haul-away and junk removal jobs in your area</p>
      </div>

      {/* Install steps */}
      <div className="px-6 mb-8">
        <h2 className="text-xl font-bold mb-5 text-center">Install in 3 Steps</h2>

        <div className="space-y-4">
          {/* Step 1 */}
          <div className="bg-white/10 rounded-xl p-4 flex items-start gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold">1</span>
            </div>
            <div>
              <p className="font-semibold mb-1">
                Tap the Share button
                <span className="ml-2 inline-block">
                  <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </span>
              </p>
              <p className="text-primary-300 text-sm">
                {isIOS
                  ? 'Tap the share icon at the bottom of Safari'
                  : 'Tap the share icon in your browser toolbar'}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white/10 rounded-xl p-4 flex items-start gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold">2</span>
            </div>
            <div>
              <p className="font-semibold mb-1">Scroll down &amp; tap &quot;Add to Home Screen&quot;</p>
              <p className="text-primary-300 text-sm">It may be near the bottom of the share menu — scroll down to find it</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white/10 rounded-xl p-4 flex items-start gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold">3</span>
            </div>
            <div>
              <p className="font-semibold mb-1">Tap &quot;Add&quot; to install</p>
              <p className="text-primary-300 text-sm">HaulKind Drive will appear on your home screen like a regular app</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 mb-8">
        <h2 className="text-lg font-bold mb-4 text-center">What You Can Do</h2>
        <div className="grid grid-cols-2 gap-3">
          <FeatureCard icon="🚛" title="Accept Jobs" desc="Get new orders in real-time" />
          <FeatureCard icon="📍" title="GPS Tracking" desc="Navigate to pickup locations" />
          <FeatureCard icon="📸" title="Photo Proof" desc="Before & after photos" />
          <FeatureCard icon="💰" title="Track Earnings" desc="See your daily payouts" />
        </div>
      </div>

      {/* Already have account */}
      <div className="px-6 pb-12 text-center">
        <p className="text-primary-300 text-sm mb-3">Already have an account?</p>
        <Link
          href="/login"
          className="inline-block px-8 py-3 bg-white text-primary-900 rounded-xl font-bold"
        >
          Log In Now
        </Link>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white/10 rounded-xl p-4 text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-primary-300 text-xs mt-1">{desc}</p>
    </div>
  )
}
