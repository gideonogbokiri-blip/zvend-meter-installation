import { useMemo, useState } from 'react'
import { useFacilities, useMeters } from '../hooks/data'
import { STATUSES, type MeterStatus, type Role } from '../types'
import { STATUS_META } from '../lib/status'
import { MeterTable } from '../components/MeterTable'
import { StatCard } from '../components/StatCard'
import { SkeletonTable } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { useAuth } from '../store/auth'

type Scope = 'active' | 'rejected' | 'archived'

const MY_ACTION: Record<Role, MeterStatus[]> = {
  Secretary: ['PendingSecretaryConfirm', 'Rejected'],
  FieldTechnician: [],
  GM: ['PendingGM'],
  MD: ['PendingMD'],
  IT: ['PendingIT'],
}

export function Dashboard() {
  const { user } = useAuth()
  const { data: facilities } = useFacilities()
  const [scope, setScope] = useState<Scope>('active')
  const [status, setStatus] = useState<MeterStatus | 'All'>('All')
  const [facilityId, setFacilityId] = useState('')
  const [search, setSearch] = useState('')
  const all = useMeters({})
  const isAdmin = user?.role !== 'FieldTechnician'

  const counts = useMemo(() => {
    const c: Record<Scope, number> = { active: 0, rejected: 0, archived: 0 }
    let mine = 0
    const mySet = user ? MY_ACTION[user.role] : []
    for (const m of all.data ?? []) {
      if (m.status === 'Rejected') c.rejected++
      else if (m.status === 'Completed') c.archived++
      else c.active++
      if (mySet.includes(m.status)) mine++
    }
    return { ...c, mine }
  }, [all.data, user])

  const items = useMemo(() => {
    const base = all.data ?? []
    const filtered: typeof base = []
    for (const m of base) {
      if (scope === 'active' && (m.status === 'Completed' || m.status === 'Rejected')) continue
      if (scope === 'rejected' && m.status !== 'Rejected') continue
      if (scope === 'archived' && m.status !== 'Completed') continue
      if (status !== 'All' && m.status !== status) continue
      if (facilityId && m.facilityId !== facilityId) continue
      if (search) {
        const q = search.toLowerCase()
        if (
          !m.officialMeterNumber.toLowerCase().includes(q) &&
          !(m.installationAddress ?? '').toLowerCase().includes(q) &&
          !(m.fieldTechnicianName ?? '').toLowerCase().includes(q)
        ) {
          continue
        }
      }
      filtered.push(m)
    }
    return filtered
  }, [all.data, scope, status, facilityId, search])

  const scopeTabs: { key: Scope; label: string; count: number }[] = [
    { key: 'active', label: 'Active', count: counts.active },
    { key: 'rejected', label: 'Rejected', count: counts.rejected },
    { key: 'archived', label: 'Completed', count: counts.archived },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {isAdmin ? 'Meter Activation Overview' : 'Field Installations'}
          </h1>
          <p className="mt-0.5 flex items-center gap-2 text-sm text-slate-500">
            {isAdmin
              ? 'Track every installation from field scan to final closure.'
              : 'Your active meter installations.'}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              LIVE
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Active jobs"
          value={counts.active}
          tone="brand"
          live
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          }
        />
        <StatCard
          label="Awaiting your action"
          value={counts.mine}
          tone="sky"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
        <StatCard
          label="Rejected"
          value={counts.rejected}
          tone="red"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          }
        />
        <StatCard
          label="Completed"
          value={counts.archived}
          tone="emerald"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {scopeTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setScope(t.key)}
            className={`tab-pill border transition ${
              scope === t.key
                ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400 hover:text-brand-700'
            }`}
          >
            {t.label} · {t.count}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as MeterStatus | 'All')}
          className="input"
        >
          <option value="All">All statuses</option>
          {STATUSES.filter((s) => s !== 'Completed').map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>

        <select value={facilityId} onChange={(e) => setFacilityId(e.target.value)} className="input">
          <option value="">All facilities</option>
          {(facilities ?? []).map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search meter, address, tech…"
          className="input"
        />
      </div>

      {all.isLoading ? (
        <SkeletonTable />
      ) : items.length === 0 ? (
        <EmptyState
          title={`No ${scope} installations`}
          hint="When meters are created or move through the workflow they will appear here."
        />
      ) : (
        <MeterTable items={items} />
      )}
    </div>
  )
}