'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import PageHeader from '@/components/PageHeader'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

interface Document {
  id: string
  type: string
  file_url: string
  status: string
  uploaded_at: string
}

export default function DocumentsPage() {
  const router = useRouter()
  const { token, isLoading } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!isLoading && !token) router.replace('/login')
  }, [token, isLoading, router])

  const fetchDocuments = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/driver/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents || [])
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleUpload = async (type: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,.pdf'
    input.capture = 'environment'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file || !token) return

      setUploading(true)
      try {
        const reader = new FileReader()
        reader.onload = async () => {
          const base64 = reader.result as string
          const res = await fetch(`${API_BASE}/driver/documents/upload`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ type, file_data: base64 }),
          })
          if (res.ok) {
            await fetchDocuments()
          } else {
            alert('Failed to upload document')
          }
          setUploading(false)
        }
        reader.readAsDataURL(file)
      } catch (err) {
        alert('Failed to upload document')
        setUploading(false)
      }
    }
    input.click()
  }

  if (isLoading || !token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const docTypes = [
    { type: 'drivers_license', label: "Driver's License", icon: '🪪' },
    { type: 'insurance', label: 'Insurance', icon: '📋' },
    { type: 'vehicle_registration', label: 'Vehicle Registration', icon: '🚛' },
    { type: 'selfie', label: 'Profile Photo', icon: '📸' },
  ]

  return (
    <div className="bg-gray-50 min-h-screen">
      <PageHeader title="My Documents" />

      <div className="px-5 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {docTypes.map((docType) => {
              const existing = documents.find(d => d.type === docType.type)
              return (
                <div key={docType.type} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{docType.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{docType.label}</p>
                        {existing ? (
                          <span className={`text-xs font-medium ${
                            existing.status === 'approved' ? 'text-green-600' :
                            existing.status === 'rejected' ? 'text-red-600' :
                            'text-yellow-600'
                          }`}>
                            {existing.status === 'approved' ? 'Approved' :
                             existing.status === 'rejected' ? 'Rejected — re-upload' :
                             'Under review'}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Not uploaded</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUpload(docType.type)}
                      disabled={uploading}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        existing
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      } disabled:opacity-50`}
                    >
                      {existing ? 'Re-upload' : 'Upload'}
                    </button>
                  </div>
                </div>
              )
            })}

            {uploading && (
              <div className="text-center py-4">
                <div className="w-6 h-6 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Uploading...</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
