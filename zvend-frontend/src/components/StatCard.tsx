import type { ReactNode } from 'react'

type Tone = 'brand' | 'emerald' | 'amber' | 'red' | 'sky'

const TONES: Record<Tone, { icon: string; value: string }> = {
  brand: { icon: 'bg-brand-100 text-brand-600', value: 'text-brand-700' },
  emerald: { icon: 'bg-emerald-100 text-emerald-600', value: 'text-emerald-700' },
  amber: { icon: 'bg-amber-100 text-amber-600', value: 'text-amber-700' },
  red: { icon: 'bg-red-100 text-red-600', value: 'text-red-700' },
  sky: { icon: 'bg-sky-100 text-sky-600', value: 'text-sky-700' },
}

export function StatCard({
  label,
  value,
  tone,
  icon,
  live = false,
}: {
  label: string
  value: number | string
  tone: Tone
  icon: ReactNode
  live?: boolean
}) {
  const t = TONES[tone]
  return (
    <div className="card flex items-center gap-4 p-4 transition-shadow hover:shadow-md">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${t.icon}`}>{icon}</span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-xs font-medium text-slate-500">{label}</p>
          {live && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
          )}
        </div>
        <p className={`text-2xl font-extrabold tabular-nums ${t.value}`}>{value}</p>
      </div>
    </div>
  )
}
