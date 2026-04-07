'use client'

import { useState, useEffect, useCallback } from 'react'

type Props = {
  onVerify: (verified: boolean) => void
  className?: string
}

function generateChallenge() {
  const a = Math.floor(Math.random() * 10) + 1
  const b = Math.floor(Math.random() * 10) + 1
  return { a, b, answer: a + b }
}

export default function SimpleCaptcha({ onVerify, className = '' }: Props) {
  const [challenge, setChallenge] = useState(() => generateChallenge())
  const [userAnswer, setUserAnswer] = useState('')
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')

  const refresh = useCallback(() => {
    setChallenge(generateChallenge())
    setUserAnswer('')
    setStatus('idle')
    onVerify(false)
  }, [onVerify])

  useEffect(() => {
    if (userAnswer === '') {
      setStatus('idle')
      return
    }
    const num = parseInt(userAnswer, 10)
    if (!isNaN(num) && num === challenge.answer) {
      setStatus('correct')
      onVerify(true)
    } else if (userAnswer.length >= String(challenge.answer).length) {
      setStatus('wrong')
      onVerify(false)
    } else {
      setStatus('idle')
    }
  }, [userAnswer, challenge.answer, onVerify])

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">
            What is {challenge.a} + {challenge.b}?
          </span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value.replace(/\D/g, '').slice(0, 3))}
          placeholder="?"
          className={`w-16 h-9 px-3 text-center text-sm font-medium border rounded-lg focus:ring-2 focus:outline-none ${
            status === 'correct'
              ? 'border-green-400 bg-green-50 text-green-700 focus:ring-green-300'
              : status === 'wrong'
              ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-300'
              : 'border-gray-300 focus:ring-primary-300'
          }`}
        />
        {status === 'correct' && (
          <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {status === 'wrong' && (
          <button
            type="button"
            onClick={refresh}
            className="text-xs text-red-600 hover:underline shrink-0"
          >
            Try again
          </button>
        )}
      </div>
      <p className="text-[11px] text-gray-400 mt-2">Security check to prevent spam</p>
    </div>
  )
}
