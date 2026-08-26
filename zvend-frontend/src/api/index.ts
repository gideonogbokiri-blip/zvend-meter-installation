import { clientApi, setAuthToken } from './client'
import type { ZvendApi } from './contract'

export type { ZvendApi } from './contract'
export type * from './contract'

export const api: ZvendApi = clientApi

// Restore token from localStorage on load
try {
  const raw = localStorage.getItem('zvend-auth')
  if (raw) {
    const parsed = JSON.parse(raw)
    const token = parsed?.state?.token
    if (token) {
      setAuthToken(token)
    }
  }
} catch {
  // ignore
}
