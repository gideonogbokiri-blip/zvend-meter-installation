import { createContext } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastContextValue {
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)