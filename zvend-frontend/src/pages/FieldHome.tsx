import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMeters } from '../hooks/data'
import { useAuth } from '../store/auth'
import { SkeletonTable } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { StatusBadge } from '../components/StatusBadge'
import { StageBar } from '../components/StageBar'
import { formatDate } from '../lib/status'

export function FieldHome() {
  const { user } = useAuth()
  const all = useMeters({})
  const [tab, setTab] = useState<'mine' | 'all'>('mine')

  const { mine, allCount } = useMemo(() => {
    const items = all.data ?? []
    return {
      mine: items.filter((m) => m.fieldTechnicianName === user?.fullName),
      allCount: items.length,
    }
  }, [all.data, user?.fullName])

  const tabs: { key: 'mine' | 'all'; label: string }[] = [
    { key: 'mine', label: `My Submissions · ${mine.length}` },
    { key: 'all', label: `All Meters · ${allCount}` },
  ]

  const items = tab === 'mine' ? mine : (all.data ?? [])

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Field Technician</h1>
          <p className="mt-0.5 text-sm text-slate-500">Scan a physical meter to register it.</p>
        </div>
        <Link to="/scan/new" className="btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9V7.5A2.5 2.5 0 015.5 5H9m6 0h3.5A2.5 2.5 0 0121 7.5V9M3 15v1.5A2.5 2.5 0 005.5 19H9m6 0h3.5a2.5 2.5 0 002.5-2.5V15" />
          </svg>
          Scan New Meter
        </Link>
      </div>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`tab-pill border transition ${
              tab === t.key
                ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400 hover:text-brand-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {all.isLoading ? (
        <SkeletonTable />
      ) : items.length === 0 ? (
        <EmptyState
          title={tab === 'mine' ? 'No submissions yet' : 'No meters yet'}
          hint="Tap “Scan New Meter” to scan the first meter on site."
        />
      ) : (
        <div className="grid gap-3">
          {items.map((m) => (
            <Link
              key={m.id}
              to={`/meters/${m.id}`}
              className="animate-fade-in-up card block p-4 transition hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-extrabold tracking-tight text-slate-900">{m.officialMeterNumber}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{m.facilityName}</p>
                </div>
                <StatusBadge status={m.status} />
              </div>
              {m.customerName && (
                <p className="mt-2 text-xs text-slate-500">
                  Customer: <span className="font-semibold text-slate-700">{m.customerName}</span>{' '}
                  <span className="text-slate-400">· {m.customerPhone}</span>
                </p>
              )}
              {m.installationAddress && <p className="mt-2 text-xs text-slate-400">{m.installationAddress}</p>}
              <div className="mt-3">
                <StageBar status={m.status} showLabel />
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                {m.fieldTechnicianName ?? '—'} · Created {formatDate(m.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}