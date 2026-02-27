'use client'

interface OrderCardProps {
  order: any
  onClick?: () => void
}

export default function OrderCard({ order, onClick }: OrderCardProps) {
  const statusColor = (s: string) => {
    if (s === 'completed') return 'bg-green-100 text-green-700'
    if (s === 'cancelled') return 'bg-red-100 text-red-700'
    if (['assigned', 'in_progress', 'en_route', 'arrived'].includes(s)) return 'bg-blue-100 text-blue-700'
    if (s === 'dispatching') return 'bg-yellow-100 text-yellow-700'
    return 'bg-gray-100 text-gray-700'
  }

  const formatTimeWindow = (tw: string) => {
    if (tw === 'ALL_DAY') return 'All Day (8AM-8PM)'
    if (tw === 'MORNING') return 'Morning (8AM-12PM)'
    if (tw === 'AFTERNOON') return 'Afternoon (12PM-4PM)'
    if (tw === 'EVENING') return 'Evening (4PM-8PM)'
    return tw || ''
  }

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl p-4 shadow-sm text-left hover:shadow-md transition"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">
              {order.service_type === 'LABOR_ONLY' ? '💪' : '🚛'}
            </span>
            <span className="font-bold text-gray-900">
              {order.service_type === 'LABOR_ONLY' ? 'Labor Only' : 'Junk Removal'}
            </span>
          </div>
          <p className="text-sm text-gray-500 truncate">{order.pickup_address || 'No address'}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            {order.scheduled_for && (
              <span>{new Date(order.scheduled_for).toLocaleDateString()}</span>
            )}
            {order.pickup_time_window && (
              <span>{formatTimeWindow(order.pickup_time_window)}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 ml-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(order.status)}`}>
            {order.status?.toUpperCase()}
          </span>
          <span className="font-bold text-primary-600">
            ${Number(order.estimated_price || 0).toFixed(2)}
          </span>
        </div>
      </div>
      {order.driver && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
          <span className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-xs font-bold">
            {order.driver.name?.charAt(0) || 'D'}
          </span>
          <span>Driver: {order.driver.name}</span>
        </div>
      )}
    </button>
  )
}
