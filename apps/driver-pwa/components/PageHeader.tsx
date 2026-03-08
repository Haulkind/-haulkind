'use client'

import { useRouter } from 'next/navigation'

interface PageHeaderProps {
  title: string
  backHref?: string
}

export default function PageHeader({ title, backHref = '/dashboard' }: PageHeaderProps) {
  const router = useRouter()

  return (
    <div className="bg-primary-900 text-white px-5 pt-12 pb-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(backHref)}
          className="text-white/80 hover:text-white transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
    </div>
  )
}
