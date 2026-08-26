import { useCallback, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type ToastContextValue, type ToastType } from './toast-context'

interface Toast {
  id: number
  type: ToastType
  title: string
  message?: string
}

const STYLES: Record<ToastType, { ring: string; icon: string; iconBg: string }> = {
  success: {
    ring: 'ring-emerald-200',
    icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
  error: {
    ring: 'ring-red-200',
    icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
    iconBg: 'bg-red-100 text-red-600',
  },
  info: {
    ring: 'ring-sky-200',
    icon: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
    iconBg: 'bg-sky-100 text-sky-600',
  },
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const s = STYLES[toast.type]
  return (
    <div className={`animate-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-white p-3.5 shadow-lg ring-1 ${s.ring}`}>
      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${s.iconBg}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
        {toast.message && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{toast.message}</p>}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        aria-label="Dismiss"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const push = useCallback((type: ToastType, title: string, message?: string) => {
    const id = ++idRef.current
    setToasts((t) => [...t.slice(-3), { id, type, title, message }])
    window.setTimeout(() => dismiss(id), 4000)
  }, [dismiss])

  const value: ToastContextValue = {
    success: (title, message) => push('success', title, message),
    error: (title, message) => push('error', title, message),
    info: (title, message) => push('info', title, message),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
