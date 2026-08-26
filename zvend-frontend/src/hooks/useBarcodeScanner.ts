import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export function useBarcodeScanner(onDecoded: (text: string) => void) {
  const containerIdRef = useRef(`qr-${Math.random().toString(36).slice(2)}`)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const onDecodedRef = useRef(onDecoded)
  onDecodedRef.current = onDecoded
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stop = useCallback(async () => {
    if (!scannerRef.current) return
    try {
      await scannerRef.current.stop()
      scannerRef.current.clear()
    } catch {
      // camera already stopped
    }
    scannerRef.current = null
    setScanning(false)
  }, [])

  const pickBackCamera = useCallback(async () => {
    try {
      const cameras = await Html5Qrcode.getCameras()
      const back = cameras.find((c) => /back|rear|environment/i.test(c.label))
      return back?.id ?? cameras[0]?.id
    } catch {
      return undefined
    }
  }, [])

  const start = useCallback(async () => {
    if (scannerRef.current) return
    if (!('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices)) {
      setError('Camera is unavailable on this page. Open it over HTTPS or localhost and allow camera access.')
      return
    }
    const scanner = new Html5Qrcode(containerIdRef.current)
    scannerRef.current = scanner
    setError(null)
    const cameraId = await pickBackCamera()
    try {
      await scanner.start(
        cameraId ?? { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          void scanner
            .stop()
            .catch(() => undefined)
            .finally(() => {
              scannerRef.current = null
              setScanning(false)
              onDecodedRef.current(decodedText)
            })
        },
        () => undefined,
      )
      setScanning(true)
    } catch (e) {
      const err = e as Error
      setError(
        err.name === 'NotAllowedError'
          ? 'Camera access was denied. Allow camera permission, then tap Start Camera again.'
          : err.name === 'NotFoundError'
            ? 'No camera was found on this device.'
            : err.name === 'NotReadableError'
              ? 'The camera is already in use by another app. Close it and try again.'
              : `Could not start the camera: ${err.message}`,
      )
      scannerRef.current = null
    }
  }, [pickBackCamera])

  useEffect(() => {
    return () => {
      const s = scannerRef.current
      if (s) {
        s.stop()
          .catch(() => undefined)
          .finally(() => s.clear())
        scannerRef.current = null
      }
    }
  }, [])

  return { containerId: containerIdRef.current, start, stop, scanning, error }
}