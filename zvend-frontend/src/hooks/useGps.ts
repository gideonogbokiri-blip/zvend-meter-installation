import { useCallback, useState } from 'react'

export interface GpsPosition {
  latitude: number
  longitude: number
  accuracy: number
}

export function useGps() {
  const [position, setPosition] = useState<GpsPosition | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const capture = useCallback(() => {
    return new Promise<GpsPosition>((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        const err = 'Geolocation is not available on this device'
        setError(err)
        reject(new Error(err))
        return
      }
      setLoading(true)
      setError(null)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const p: GpsPosition = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
          }
          setPosition(p)
          setLoading(false)
          resolve(p)
        },
        (err) => {
          let message = 'Could not capture location'
          if (err.code === 1) message = 'Location permission denied. Allow access to capture GPS.'
          else if (err.code === 2) message = 'GPS unavailable. Try again in an open area.'
          else if (err.code === 3) message = 'GPS timed out. Try again.'
          setError(message)
          setLoading(false)
          reject(new Error(message))
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      )
    })
  }, [])

  return { position, loading, error, capture }
}
