'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

export default function DriverApplicationPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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

  const handleStep2Submit = async () => {
    if (!step2.vehicleType || step2.availabilityDays.length === 0) {
      setError('Please fill in all required fields')
      return
    }

    if (!step2.consents) {
      setError('You must agree to the terms and consent to background check')
      return
    }

    setLoading(true)
    setError('')

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://haulkind-production.up.railway.app'
      
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
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit application')
      }

      setSuccess(true)
    } catch (err) {
      setError('Failed to submit application. Please try again.')
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
              Thank you for applying to become a Haulkind driver. We'll review your application and get back to you within 24 hours.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>What happens next:</strong><br />
                1. We review your application<br />
                2. If approved, we'll request documents (license, insurance, vehicle registration)<br />
                3. You can start accepting jobs!
              </p>
            </div>
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
            <span className="text-sm text-gray-500">Step {currentStep} of 2</span>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2 max-w-xs mx-auto">
              <div 
                className="bg-secondary-600 h-2 rounded-full transition-all"
                style={{ width: `${(currentStep / 2) * 100}%` }}
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
                    I'm 18+ and legally allowed to work in the United States *
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
                    onClick={() => setCurrentStep(1)}
                    className="w-2/5 h-11 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 font-medium hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleStep2Submit}
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
              <h3 className="font-bold text-sm mb-2">💰 What You Earn</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Keep 60% of every job</li>
                <li>• Weekly payouts</li>
                <li>• Work when you want</li>
              </ul>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold text-sm mb-2">📋 Requirements</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Valid driver's license</li>
                <li>• Vehicle that fits the job</li>
                <li>• Basic equipment recommended</li>
              </ul>
            </div>

            {/* What happens next */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold text-sm mb-2">🚀 What Happens Next</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• We review within 24 hours</li>
                <li>• We request documents after approval</li>
                <li>• Start accepting jobs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
