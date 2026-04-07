'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { validateBotProtection, getFormLoadTimestamp } from '@/lib/bot-protection'
import SimpleCaptcha from '@/components/SimpleCaptcha'

type Step1Data = {
  firstName: string
  lastName: string
  email: string
  phone: string
  zip: string
  isEligible: boolean
}

type Step2Data = {
  vehicleType: string
  availabilityDays: string[]
  availabilityTime: string
  canLift75: boolean
  hasEquipment: boolean
  experience: string
  consents: boolean
}

type PhotoData = {
  selfie: string | null
  license: string | null
  vehicleRegistration: string | null
  insurance: string | null
}

export default function DriverApplicationPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const totalSteps = 3

  // Bot protection: honeypot + timestamp + captcha
  const [honeypot, setHoneypot] = useState('')
  const formLoadedAt = useRef(getFormLoadTimestamp())
  const [captchaVerified, setCaptchaVerified] = useState(false)

  // Step 1 data
  const [step1, setStep1] = useState<Step1Data>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    zip: '',
    isEligible: false,
  })

  // Step 2 data
  const [step2, setStep2] = useState<Step2Data>({
    vehicleType: '',
    availabilityDays: [],
    availabilityTime: 'all_day',
    canLift75: false,
    hasEquipment: false,
    experience: '',
    consents: false,
  })

  // Step 3 data - photos
  const [photos, setPhotos] = useState<PhotoData>({
    selfie: null,
    license: null,
    vehicleRegistration: null,
    insurance: null,
  })
  const [photoNames, setPhotoNames] = useState<Record<string, string>>({})

  // File input refs
  const selfieRef = useRef<HTMLInputElement>(null)
  const licenseRef = useRef<HTMLInputElement>(null)
  const vehicleRegRef = useRef<HTMLInputElement>(null)
  const insuranceRef = useRef<HTMLInputElement>(null)

  const handleStep1Continue = () => {
    if (!step1.firstName || !step1.lastName || !step1.email || !step1.phone || !step1.zip) {
      setError('Please fill in all required fields')
      return
    }

    if (!step1.isEligible) {
      setError('You must be 18+ and legally allowed to work')
      return
    }

    setError('')
    setCurrentStep(2)
  }

  const handleStep2Continue = () => {
    if (!step2.vehicleType || step2.availabilityDays.length === 0) {
      setError('Please fill in all required fields')
      return
    }

    if (!step2.consents) {
      setError('You must agree to the terms and consent to background check')
      return
    }

    setError('')
    setCurrentStep(3)
  }

  const handleFileChange = (field: keyof PhotoData, file: File | null) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large. Maximum size is 5MB.')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, etc.)')
      return
    }
    setError('')
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      setPhotos(prev => ({ ...prev, [field]: base64 }))
      setPhotoNames(prev => ({ ...prev, [field]: file.name }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmitApplication = async () => {
    // Bot protection check
    const botError = validateBotProtection({
      honeypotValue: honeypot,
      formLoadedAt: formLoadedAt.current,
    })
    if (botError) {
      setError(botError)
      return
    }

    if (!captchaVerified) {
      setError('Please complete the security check.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://haulkind-production-285b.up.railway.app'

      const response = await fetch(`${API_BASE_URL}/drivers/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: step1.firstName,
          lastName: step1.lastName,
          email: step1.email,
          phone: step1.phone,
          zip: step1.zip,
          vehicleType: step2.vehicleType,
          availability: {
            days: step2.availabilityDays,
            timeWindow: step2.availabilityTime,
          },
          canLift75: step2.canLift75,
          hasEquipment: step2.hasEquipment,
          experience: step2.experience,
          consents: {
            independentContractor: step2.consents,
            backgroundCheck: step2.consents,
          },
          selfieUrl: photos.selfie || null,
          licenseUrl: photos.license || null,
          vehicleRegistrationUrl: photos.vehicleRegistration || null,
          insuranceUrl: photos.insurance || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application')
      }

      setSuccess(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit application. Please try again.'
      setError(message)
      setLoading(false)
    }
  }

  const toggleDay = (day: string) => {
    if (step2.availabilityDays.includes(day)) {
      setStep2({ ...step2, availabilityDays: step2.availabilityDays.filter(d => d !== day) })
    } else {
      setStep2({ ...step2, availabilityDays: [...step2.availabilityDays, day] })
    }
  }

  const hasAllPhotos = photos.selfie && photos.license && photos.vehicleRegistration && photos.insurance
  const uploadedCount = [photos.selfie, photos.license, photos.vehicleRegistration, photos.insurance].filter(Boolean).length

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Application Received!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for applying to become a Haulkind driver. We&apos;ll review your application and get back to you within 24 hours.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>What happens next:</strong><br />
                1. Our team reviews your application and documents<br />
                2. Once approved, download the Haulkind Driver app<br />
                3. Log in with your email and start accepting jobs!
              </p>
            </div>
            {!hasAllPhotos && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> You didn&apos;t upload all required documents. You can upload them later through the Haulkind Driver app after logging in.
                </p>
              </div>
            )}
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-secondary-600 text-white rounded-lg font-medium hover:bg-secondary-700 transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Become a Haulkind Driver</h1>
          <p className="text-gray-600">Join our team and start earning on your schedule</p>
          <div className="mt-4">
            <span className="text-sm text-gray-500">Step {currentStep} of {totalSteps}</span>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2 max-w-xs mx-auto">
              <div 
                className="bg-secondary-600 h-2 rounded-full transition-all"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_300px] gap-6">
          {/* Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {/* Honeypot field — hidden from humans, bots auto-fill it */}
            <div aria-hidden="true" tabIndex={-1} style={{ position: 'absolute', left: '-9999px', top: '-9999px', height: 0, overflow: 'hidden' }}>
              <label htmlFor="hk_company">Leave this empty</label>
              <input
                type="text"
                id="hk_company"
                name="company"
                autoComplete="off"
                tabIndex={-1}
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">Basic Information</h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={step1.firstName}
                      onChange={(e) => setStep1({ ...step1, firstName: e.target.value })}
                      className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={step1.lastName}
                      onChange={(e) => setStep1({ ...step1, lastName: e.target.value })}
                      className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-600 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={step1.email}
                    onChange={(e) => setStep1({ ...step1, email: e.target.value })}
                    className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={step1.phone}
                    onChange={(e) => setStep1({ ...step1, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    value={step1.zip}
                    onChange={(e) => setStep1({ ...step1, zip: e.target.value })}
                    placeholder="19103"
                    maxLength={5}
                    className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-600 focus:border-transparent"
                  />
                </div>

                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="eligible"
                    checked={step1.isEligible}
                    onChange={(e) => setStep1({ ...step1, isEligible: e.target.checked })}
                    className="mt-0.5 h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="eligible" className="text-sm text-gray-700">
                    I&apos;m 18+ and legally allowed to work in the United States *
                  </label>
                </div>

                <button
                  onClick={handleStep1Continue}
                  className="w-full h-11 px-4 py-2 bg-secondary-600 text-white rounded-lg text-sm font-medium hover:bg-secondary-700 transition"
                >
                  Continue
                </button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">Vehicle & Availability</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Vehicle Type *
                  </label>
                  <select
                    value={step2.vehicleType}
                    onChange={(e) => setStep2({ ...step2, vehicleType: e.target.value })}
                    className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-600 focus:border-transparent bg-white"
                  >
                    <option value="">Select vehicle type</option>
                    <option value="pickup">Pickup Truck</option>
                    <option value="van">Van</option>
                    <option value="box_truck">Box Truck</option>
                    <option value="trailer">Trailer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Days *
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`h-10 px-3 py-2 text-sm rounded-lg border transition ${
                          step2.availabilityDays.includes(day)
                            ? 'bg-secondary-600 text-white border-secondary-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-secondary-600'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Preferred Time *
                  </label>
                  <select
                    value={step2.availabilityTime}
                    onChange={(e) => setStep2({ ...step2, availabilityTime: e.target.value })}
                    className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-600 focus:border-transparent bg-white"
                  >
                    <option value="morning">Morning (8AM - 12PM)</option>
                    <option value="afternoon">Afternoon (12PM - 4PM)</option>
                    <option value="evening">Evening (4PM - 8PM)</option>
                    <option value="all_day">All Day (8AM - 8PM)</option>
                  </select>
                </div>

                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="lift75"
                    checked={step2.canLift75}
                    onChange={(e) => setStep2({ ...step2, canLift75: e.target.checked })}
                    className="mt-0.5 h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="lift75" className="text-sm text-gray-700">
                    I can lift 75 lbs
                  </label>
                </div>

                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="equipment"
                    checked={step2.hasEquipment}
                    onChange={(e) => setStep2({ ...step2, hasEquipment: e.target.checked })}
                    className="mt-0.5 h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="equipment" className="text-sm text-gray-700">
                    I have straps, dolly, and/or blankets
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tell us about your experience (optional)
                  </label>
                  <textarea
                    value={step2.experience}
                    onChange={(e) => setStep2({ ...step2, experience: e.target.value })}
                    rows={3}
                    placeholder="Previous moving/hauling experience, years driving, etc."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-600 focus:border-transparent"
                  />
                </div>

                <div className="flex items-start gap-2.5 bg-gray-50 p-3 rounded-lg">
                  <input
                    type="checkbox"
                    id="consents"
                    checked={step2.consents}
                    onChange={(e) => setStep2({ ...step2, consents: e.target.checked })}
                    className="mt-0.5 h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="consents" className="text-xs text-gray-700">
                    I understand I will be an independent contractor and consent to a background check *
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setError(''); setCurrentStep(1); }}
                    className="w-2/5 h-11 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 font-medium hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleStep2Continue}
                    className="w-3/5 h-11 px-4 py-2 bg-secondary-600 text-white rounded-lg text-sm font-medium hover:bg-secondary-700 transition"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Document Upload */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-2">Upload Documents</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Upload your documents for faster approval. You can also upload them later through the driver app.
                </p>

                {/* Selfie / Profile Photo */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Profile Photo (Selfie)</h3>
                      <p className="text-xs text-gray-500 mt-0.5">A clear photo of your face</p>
                    </div>
                    {photos.selfie ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-600 font-medium">Uploaded</span>
                        <button
                          onClick={() => { setPhotos(prev => ({ ...prev, selfie: null })); setPhotoNames(prev => { const n = { ...prev }; delete n.selfie; return n; }); }}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => selfieRef.current?.click()}
                        className="px-3 py-1.5 text-xs bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition"
                      >
                        Upload
                      </button>
                    )}
                  </div>
                  {photos.selfie && (
                    <div className="mt-2">
                      <img src={photos.selfie} alt="Selfie preview" className="h-20 w-20 object-cover rounded-lg border" />
                      <p className="text-xs text-gray-400 mt-1">{photoNames.selfie}</p>
                    </div>
                  )}
                  <input ref={selfieRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => handleFileChange('selfie', e.target.files?.[0] || null)} />
                </div>

                {/* Driver's License */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Driver&apos;s License</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Front of your valid driver&apos;s license</p>
                    </div>
                    {photos.license ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-600 font-medium">Uploaded</span>
                        <button
                          onClick={() => { setPhotos(prev => ({ ...prev, license: null })); setPhotoNames(prev => { const n = { ...prev }; delete n.license; return n; }); }}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => licenseRef.current?.click()}
                        className="px-3 py-1.5 text-xs bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition"
                      >
                        Upload
                      </button>
                    )}
                  </div>
                  {photos.license && (
                    <div className="mt-2">
                      <img src={photos.license} alt="License preview" className="h-20 w-20 object-cover rounded-lg border" />
                      <p className="text-xs text-gray-400 mt-1">{photoNames.license}</p>
                    </div>
                  )}
                  <input ref={licenseRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange('license', e.target.files?.[0] || null)} />
                </div>

                {/* Vehicle Registration */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Vehicle Registration</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Photo of your vehicle registration document</p>
                    </div>
                    {photos.vehicleRegistration ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-600 font-medium">Uploaded</span>
                        <button
                          onClick={() => { setPhotos(prev => ({ ...prev, vehicleRegistration: null })); setPhotoNames(prev => { const n = { ...prev }; delete n.vehicleRegistration; return n; }); }}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => vehicleRegRef.current?.click()}
                        className="px-3 py-1.5 text-xs bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition"
                      >
                        Upload
                      </button>
                    )}
                  </div>
                  {photos.vehicleRegistration && (
                    <div className="mt-2">
                      <img src={photos.vehicleRegistration} alt="Vehicle registration preview" className="h-20 w-20 object-cover rounded-lg border" />
                      <p className="text-xs text-gray-400 mt-1">{photoNames.vehicleRegistration}</p>
                    </div>
                  )}
                  <input ref={vehicleRegRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange('vehicleRegistration', e.target.files?.[0] || null)} />
                </div>

                {/* Insurance */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Insurance Card</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Photo of your vehicle insurance card</p>
                    </div>
                    {photos.insurance ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-600 font-medium">Uploaded</span>
                        <button
                          onClick={() => { setPhotos(prev => ({ ...prev, insurance: null })); setPhotoNames(prev => { const n = { ...prev }; delete n.insurance; return n; }); }}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => insuranceRef.current?.click()}
                        className="px-3 py-1.5 text-xs bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition"
                      >
                        Upload
                      </button>
                    )}
                  </div>
                  {photos.insurance && (
                    <div className="mt-2">
                      <img src={photos.insurance} alt="Insurance preview" className="h-20 w-20 object-cover rounded-lg border" />
                      <p className="text-xs text-gray-400 mt-1">{photoNames.insurance}</p>
                    </div>
                  )}
                  <input ref={insuranceRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange('insurance', e.target.files?.[0] || null)} />
                </div>

                {/* CAPTCHA */}
                <SimpleCaptcha onVerify={setCaptchaVerified} />

                {/* Upload progress indicator */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700">Documents uploaded:</span>
                    <span className={`font-bold ${hasAllPhotos ? 'text-green-600' : uploadedCount > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                      {uploadedCount} / 4
                    </span>
                  </div>
                  {!hasAllPhotos && (
                    <p className="text-xs text-gray-500 mt-1">
                      Uploading all 4 documents speeds up the approval process.
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setError(''); setCurrentStep(2); }}
                    className="w-2/5 h-11 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 font-medium hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmitApplication}
                    disabled={loading}
                    className="w-3/5 h-11 px-4 py-2 bg-secondary-600 text-white rounded-lg text-sm font-medium hover:bg-secondary-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* What you earn */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold text-sm mb-2">What You Earn</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>Keep 70% of every job</li>
                <li>Weekly payouts via Stripe</li>
                <li>Work when you want</li>
              </ul>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold text-sm mb-2">Requirements</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>Valid driver&apos;s license</li>
                <li>Vehicle that fits the job</li>
                <li>Vehicle insurance</li>
                <li>Basic equipment recommended</li>
              </ul>
            </div>

            {/* Steps indicator */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold text-sm mb-2">Application Steps</h3>
              <ul className="text-xs space-y-2">
                <li className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-secondary-600 font-medium' : 'text-gray-400'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep > 1 ? 'bg-green-100 text-green-600' : currentStep === 1 ? 'bg-secondary-100 text-secondary-600' : 'bg-gray-100 text-gray-400'}`}>
                    {currentStep > 1 ? '\u2713' : '1'}
                  </span>
                  Personal Info
                </li>
                <li className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-secondary-600 font-medium' : 'text-gray-400'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep > 2 ? 'bg-green-100 text-green-600' : currentStep === 2 ? 'bg-secondary-100 text-secondary-600' : 'bg-gray-100 text-gray-400'}`}>
                    {currentStep > 2 ? '\u2713' : '2'}
                  </span>
                  Vehicle & Availability
                </li>
                <li className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-secondary-600 font-medium' : 'text-gray-400'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep === 3 ? 'bg-secondary-100 text-secondary-600' : 'bg-gray-100 text-gray-400'}`}>
                    3
                  </span>
                  Upload Documents
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
