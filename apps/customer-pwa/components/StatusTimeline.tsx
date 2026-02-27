'use client'

interface StatusTimelineProps {
  currentStatus: string
}

const STATUSES = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'dispatching', label: 'Finding Driver' },
  { key: 'assigned', label: 'Driver Assigned' },
  { key: 'en_route', label: 'Driver En Route' },
  { key: 'arrived', label: 'Driver Arrived' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
]

export default function StatusTimeline({ currentStatus }: StatusTimelineProps) {
  const currentIndex = STATUSES.findIndex(s => s.key === currentStatus)
  const isCancelled = currentStatus === 'cancelled'

  if (isCancelled) {
    return (
      <div className="text-center py-4">
        <div className="text-4xl mb-2">❌</div>
        <p className="font-medium text-red-600">Order Cancelled</p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {STATUSES.map((status, index) => {
        const isCompleted = index <= currentIndex
        const isCurrent = index === currentIndex
        const isLast = index === STATUSES.length - 1

        return (
          <div key={status.key} className="flex items-start gap-3">
            {/* Circle + Line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isCompleted
                    ? isCurrent
                      ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                      : 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isCompleted && !isCurrent ? '✓' : index + 1}
              </div>
              {!isLast && (
                <div className={`w-0.5 h-6 ${isCompleted ? 'bg-primary-600' : 'bg-gray-200'}`} />
              )}
            </div>
            {/* Label */}
            <div className={`pb-4 ${isCurrent ? 'font-bold text-primary-600' : isCompleted ? 'text-gray-700' : 'text-gray-400'}`}>
              <span className="text-sm">{status.label}</span>
              {isCurrent && (
                <span className="ml-2 inline-block w-2 h-2 bg-primary-600 rounded-full animate-pulse" />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
