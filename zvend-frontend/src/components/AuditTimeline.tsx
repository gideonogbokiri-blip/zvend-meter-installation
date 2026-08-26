import { useAudit } from '../hooks/data'
import { formatDate } from '../lib/status'
import { Skeleton } from './Skeleton'
import { EmptyState } from './EmptyState'

export function AuditTimeline({ meterId }: { meterId: string }) {
  const { data, isLoading } = useAudit(meterId)

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) return <EmptyState title="No activity recorded yet" />

  return (
    <ol className="space-y-5 border-l-2 border-slate-100 pl-5">
      {data.map((entry, i) => (
        <li key={entry.id} className="relative">
          <span
            className={`absolute top-1 -left-[27px] h-3 w-3 rounded-full ring-4 ring-white ${
              i === 0 ? 'bg-brand-500' : 'bg-slate-300'
            }`}
          />
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-sm font-semibold text-slate-800">{entry.action}</p>
            <span className="text-xs text-slate-400">{formatDate(entry.timestamp)}</span>
          </div>
          <p className="text-xs text-slate-500">By {entry.userName} ({entry.userRole})</p>
          {entry.notes && (
            <p className="mt-1.5 rounded-xl bg-slate-50 px-3 py-1.5 text-xs text-slate-600">{entry.notes}</p>
          )}
        </li>
      ))}
    </ol>
  )
}
