import type { MeterStatus } from '../types'

const FLOW: MeterStatus[] = [
  'Inventory',
  'Approved',
  'Assigned',
  'PendingSecretaryConfirm',
  'PendingGM',
  'PendingMD',
  'PendingIT',
]

export function StageBar({ status, showLabel = false }: { status: MeterStatus; showLabel?: boolean }) {
  if (status === 'Rejected') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {FLOW.map((s, i) => (
            <span key={s} className={`h-1.5 flex-1 rounded-full ${i === 0 ? 'bg-red-400' : 'bg-red-100'}`} />
          ))}
        </div>
        {showLabel && <span className="text-[11px] font-semibold text-red-600">Rejected</span>}
      </div>
    )
  }

  const idx = status === 'Completed' ? FLOW.length : FLOW.indexOf(status)
  const pct = Math.round(((idx + 1) / (FLOW.length + 1)) * 100)

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            status === 'Completed' ? 'bg-emerald-500' : 'bg-brand-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-[11px] font-medium text-slate-500">
          {status === 'Completed' ? 'Done' : `Step ${idx + 1} of ${FLOW.length + 1}`}
        </span>
      )}
    </div>
  )
}
