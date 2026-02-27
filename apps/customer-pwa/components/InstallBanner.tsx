'use client'

import { useState, useEffect } from 'react'

export default function InstallBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already installed as PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true
    setIsStandalone(standalone)
    if (standalone) return

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa_install_dismissed')
    if (dismissed) {
      const dismissedAt = parseInt(dismissed)
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return // 7 days
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    if (isIOSDevice) {
      // Show iOS install guide after 3 seconds
      setTimeout(() => setShowBanner(true), 3000)
    } else {
      // Listen for beforeinstallprompt (Chrome/Edge/Android)
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setTimeout(() => setShowBanner(true), 2000)
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const result = await deferredPrompt.userChoice
      if (result.outcome === 'accepted') {
        setShowBanner(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa_install_dismissed', String(Date.now()))
  }

  if (isStandalone || !showBanner) return null

  return (
    <>
      {/* Install Banner */}
      <div className="fixed bottom-20 left-4 right-4 bg-white rounded-2xl shadow-2xl p-4 z-50 border border-gray-200 animate-slide-up">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-white text-xl font-bold">H</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900">Install Haulkind</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {isIOS
                ? 'Add to your home screen for the best experience'
                : 'Install our app for quick access & notifications'
              }
            </p>
          </div>
          <button onClick={handleDismiss} className="text-gray-400 text-xl leading-none">&times;</button>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2 text-sm text-gray-500 font-medium rounded-lg"
          >
            Not Now
          </button>
          <button
            onClick={isIOS ? () => setShowIOSGuide(true) : handleInstall}
            className="flex-1 py-2 text-sm bg-primary-600 text-white font-medium rounded-lg"
          >
            {isIOS ? 'How to Install' : 'Install'}
          </button>
        </div>
      </div>

      {/* iOS Install Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 animate-slide-up">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Install on iPhone/iPad</h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold shrink-0">1</div>
                <div>
                  <p className="font-medium">Tap the Share button</p>
                  <p className="text-sm text-gray-500">The square with an arrow pointing up, at the bottom of Safari</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold shrink-0">2</div>
                <div>
                  <p className="font-medium">Scroll down and tap &quot;Add to Home Screen&quot;</p>
                  <p className="text-sm text-gray-500">You may need to scroll down in the share menu</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold shrink-0">3</div>
                <div>
                  <p className="font-medium">Tap &quot;Add&quot;</p>
                  <p className="text-sm text-gray-500">The Haulkind icon will appear on your home screen</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => { setShowIOSGuide(false); setShowBanner(false) }}
              className="w-full py-3 mt-6 bg-primary-600 text-white font-medium rounded-lg"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
