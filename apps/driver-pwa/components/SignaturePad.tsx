'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  onSave: (dataUrl: string) => void
  onCancel: () => void
}

export default function SignaturePad({ onSave, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hasDrawn, setHasDrawn] = useState(false)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)

  // Size the canvas to its container on mount (handles DPR for crisp lines)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.scale(dpr, dpr)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, rect.width, rect.height)
      ctx.strokeStyle = '#111827'
      ctx.lineWidth = 2.2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
    drawingRef.current = true
    lastPointRef.current = getPoint(e)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    e.preventDefault()
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const point = getPoint(e)
    const last = lastPointRef.current
    if (last) {
      ctx.beginPath()
      ctx.moveTo(last.x, last.y)
      ctx.lineTo(point.x, point.y)
      ctx.stroke()
    }
    lastPointRef.current = point
    if (!hasDrawn) setHasDrawn(true)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false
    lastPointRef.current = null
    try {
      ;(e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId)
    } catch {}
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, rect.width, rect.height)
    setHasDrawn(false)
  }

  const save = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasDrawn) return
    const dataUrl = canvas.toDataURL('image/png')
    onSave(dataUrl)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center">
      <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Customer Signature</h3>
        <p className="text-sm text-gray-500 mb-3">
          Ask the customer to sign below to confirm the job is complete.
        </p>
        <div className="w-full bg-white border-2 border-dashed border-gray-300 rounded-xl overflow-hidden" style={{ height: 220 }}>
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="touch-none block w-full h-full"
          />
        </div>
        <div className="flex items-center justify-between mt-3 gap-3">
          <button
            onClick={clear}
            type="button"
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 active:bg-gray-100"
          >
            Clear
          </button>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              type="button"
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 active:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={save}
              type="button"
              disabled={!hasDrawn}
              className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold active:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save & Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
