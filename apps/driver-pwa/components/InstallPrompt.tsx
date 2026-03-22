'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOSPrompt, setShowIOSPrompt] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    setIsStandalone(standalone)
    if (standalone) return

    // Check if user previously dismissed
    const wasDismissed = sessionStorage.getItem('pwa-install-dismissed')
    if (wasDismissed) {
      setDismissed(true)
      return
    }

    // Android / Chrome: capture beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // iOS detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
    if (isIOS && isSafari) {
      setShowIOSPrompt(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('pwa-install-dismissed', 'true')
  }

  // Don't show if already installed, dismissed, or no prompt available
  if (isStandalone || dismissed) return null
  if (!deferredPrompt && !showIOSPrompt) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 max-w-md mx-auto">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-primary-900 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-black text-white">HK</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Install HaulKind Drive</h3>
            <p className="text-sm text-gray-500">Get the full app experience</p>
          </div>
        </div>

        {/* Android: direct install button */}
        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="w-full py-3.5 bg-primary-600 text-white rounded-xl font-bold text-base hover:bg-primary-700 transition"
          >
            Install App
          </button>
        )}

        {/* iOS: manual instructions */}
        {showIOSPrompt && !deferredPrompt && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
              <p className="text-sm text-gray-700">
                Tap the <strong>Share</strong> button
                <svg className="w-4 h-4 inline ml-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </p>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
              <p className="text-sm text-gray-700">Tap <strong>&quot;Add to Home Screen&quot;</strong></p>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
              <p className="text-sm text-gray-700">Tap <strong>&quot;Add&quot;</strong> to install</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
