import type { ReactNode } from 'react'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3.5 transition hover:bg-slate-100/70">
      <dt className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="mt-1 text-sm font-medium break-words text-slate-900">{children}</dd>
    </div>
  )
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>
}
