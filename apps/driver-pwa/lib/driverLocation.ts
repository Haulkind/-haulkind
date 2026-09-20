export type LocationStatus = 'locating' | 'live' | 'approximate' | 'denied' | 'unavailable' | 'stale'

export function trackDriverLocation(
  geolocation: Geolocation,
  onPosition: (position: GeolocationPosition) => void,
  onStatus: (status: LocationStatus) => void,
) {
  let stopped = false
  let latestTimestamp = 0
  const options: PositionOptions = { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
  onStatus('locating')
  const receive: PositionCallback = position => {
    if (stopped) return
    const { latitude, longitude } = position.coords
    if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
        !Number.isFinite(longitude) || Math.abs(longitude) > 180 ||
        !Number.isFinite(position.timestamp) || position.timestamp <= latestTimestamp) return
    if (Date.now() - position.timestamp > 30000) {
      if (Date.now() - latestTimestamp > 30000) onStatus('stale')
      return
    }
    latestTimestamp = position.timestamp
    onPosition(position)
    onStatus(position.coords.accuracy <= 50 ? 'live' : 'approximate')
  }
  const fail: PositionErrorCallback = error => {
    if (stopped) return
    if (error.code === 1) {
      onStatus('denied')
      stop()
    } else if (Date.now() - latestTimestamp > 30000) onStatus('unavailable')
  }
  geolocation.getCurrentPosition(receive, fail, options)
  const watchId = geolocation.watchPosition(receive, fail, options)
  const timer = setInterval(() => {
    if (Date.now() - latestTimestamp > 30000) onStatus('stale')
    geolocation.getCurrentPosition(receive, fail, options)
  }, 15000)
  function stop() {
    if (stopped) return
    stopped = true
    geolocation.clearWatch(watchId)
    clearInterval(timer)
  }
  return stop
}
