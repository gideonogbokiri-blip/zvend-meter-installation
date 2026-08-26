import { Link } from 'react-router-dom'
import { useMeters } from '../hooks/data'
import type { MeterStatus } from '../types'
import { STATUS_META } from '../lib/status'
import { MeterTable } from '../components/MeterTable'
import { SkeletonTable } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'

interface QueuePageProps {
  status: MeterStatus
  title: string
  subtitle: string
}

export function QueuePage({ status, title, subtitle }: QueuePageProps) {
  const { data, isLoading } = useMeters({ status })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
        </div>
        <Link to="/dashboard" className="btn-secondary">
          Full list
        </Link>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50/70 px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-bold text-slate-900">{STATUS_META[status].label}</p>
          <p className="text-xs text-slate-500">
            {isLoading ? 'Checking…' : `${data?.length ?? 0} item(s) currently awaiting this stage`}
          </p>
        </div>
      </div>

      {isLoading ? (
        <SkeletonTable />
      ) : !data || data.length === 0 ? (
        <EmptyState title="Queue is empty" hint={`Nothing is ${STATUS_META[status].label.toLowerCase()} right now.`} />
      ) : (
        <MeterTable items={data} />
      )}
    </div>
  )
}