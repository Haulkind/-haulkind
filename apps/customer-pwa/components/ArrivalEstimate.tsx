interface ArrivalEstimateProps {
  arrivalTime?: string | null
  status: string
}

export default function ArrivalEstimate({ arrivalTime, status }: ArrivalEstimateProps) {
  if (!arrivalTime || !['accepted', 'assigned', 'en_route'].includes(status)) return null
  const arrival = new Date(arrivalTime)
  if (!Number.isFinite(arrival.getTime())) return null
  return (
    <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
      <h2 className="font-bold text-primary-900">Driver&apos;s arrival time</h2>
      <p className="text-2xl font-bold text-primary-700 mt-1">
        {arrival.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' })}
      </p>
      <p className="text-sm text-primary-700 mt-1">
        {arrival.toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' })} · Eastern Time
      </p>
      <p className="text-xs text-primary-600 mt-2">Arrival time provided by your driver.</p>
    </div>
  )
}
