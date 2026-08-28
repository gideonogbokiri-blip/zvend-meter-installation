import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useMeters } from '../hooks/data'
import { invalidateMeter } from '../hooks/data'
import { useAuth } from '../store/auth'
import { useToast } from '../hooks/useToast'
import { api } from '../api'
import { SkeletonTable } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { StatusBadge } from '../components/StatusBadge'
import { StageBar } from '../components/StageBar'
import { formatDate } from '../lib/status'

export function FieldHome() {
  const { user } = useAuth()
  const client = useQueryClient()
  const navigate = useNavigate()
  const toast = useToast()
  const all = useMeters({})
  const [tab, setTab] = useState<'available' | 'mine'>('available')
  const [claiming, setClaiming] = useState<string | null>(null)

  const { available, mine, myCount, availableCount } = useMemo(() => {
    const items = all.data ?? []
    return {
      available: items.filter((m) => m.status === 'Approved'),
      mine: items.filter((m) => m.fieldTechnicianName === user?.fullName),
      myCount: items.filter((m) => m.fieldTechnicianName === user?.fullName).length,
      availableCount: items.filter((m) => m.status === 'Approved').length,
    }
  }, [all.data, user?.fullName])

  const claimAndStart = async (id: string) => {
    setClaiming(id)
    try {
      const meter = await api.claimMeter(id, user?.id ?? 'u-tech')
      invalidateMeter(client, meter.id)
      toast.success('Meter assigned', 'It is now yours. Complete the field steps to continue.')
      navigate(`/field/install/${meter.id}`)
    } catch (e) {
      toast.error('Could not claim', e instanceof Error ? e.message : 'This meter may already be taken.')
      client.invalidateQueries({ queryKey: ['meters'] })
    } finally {
      setClaiming(null)
    }
  }

  const tabs: { key: 'available' | 'mine'; label: string }[] = [
    { key: 'available', label: `Available Meters · ${availableCount}` },
    { key: 'mine', label: `My Work · ${myCount}` },
  ]

  const items = tab === 'available' ? available : mine

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Field Technician</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Pick a meter from the approved inventory and install it at the site.
          </p>
        </div>
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
          title={tab === 'available' ? 'No approved meters yet' : 'No work assigned to you yet'}
          hint={
            tab === 'available'
              ? 'The Secretary scans meter numbers and the GM approves them. Check back when meters are available.'
              : 'Claim an available meter to start your first installation.'
          }
        />
      ) : (
        <div className="grid gap-3">
          {items.map((m) => (
            <div
              key={m.id}
              className="card animate-fade-in-up block p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link to={`/meters/${m.id}`} className="font-extrabold tracking-tight text-slate-900 hover:text-brand-700">
                    {m.officialMeterNumber}
                  </Link>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {m.facilityName || (tab === 'available' ? 'Facility chosen on site' : '—')}
                  </p>
                </div>
                <StatusBadge status={m.status} />
              </div>
              {tab === 'available' && (
                <button
                  onClick={() => void claimAndStart(m.id)}
                  disabled={claiming !== null}
                  className="btn-primary mt-3 w-full"
                >
                  {claiming === m.id ? 'Claiming…' : 'Claim Meter & Start Installation'}
                </button>
              )}
              {tab === 'mine' && m.status === 'Assigned' && (
                <Link to={`/field/install/${m.id}`} className="btn-primary mt-3 block w-full text-center">
                  Continue Installation
                </Link>
              )}
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
                {m.fieldTechnicianName ?? 'Unassigned'} · {formatDate(m.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}