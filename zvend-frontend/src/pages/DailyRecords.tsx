import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { useDailyRecords } from '../hooks/data'
import { invalidateDailyRecords } from '../hooks/data'
import { useToast } from '../hooks/useToast'
import { SkeletonTable } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { formatCode } from '../lib/status'
import type { RecordedMeter } from '../types'

function todayStr() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function displayDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}

function CodeChip({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2 py-1 font-mono text-xs font-bold text-teal-800 ring-1 ring-teal-200">
      {label}: {value}
    </span>
  )
}

function RecordedMeterRow({ m }: { m: RecordedMeter }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
      <div className="min-w-0">
        <p className="font-mono text-sm font-extrabold text-slate-900">{m.official_meter_number}</p>
        <p className="text-xs text-slate-500">
          {m.customer_name ?? '—'} · {m.customer_phone ?? '—'}
        </p>
        <p className="truncate text-xs text-slate-400">
          {m.facility_name ?? '—'} · {m.installation_address ?? '—'}
        </p>
        <p className="text-xs text-slate-400">Field: {m.field_technician_name ?? '—'}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <CodeChip label="Act" value={m.activation_code} />
        <CodeChip label="Clear" value={m.clear_code} />
        <CodeChip label="Tamper" value={m.tamper_code} />
      </div>
    </div>
  )
}

export function DailyRecords() {
  const toast = useToast()
  const client = useQueryClient()
  const { data: records, isLoading } = useDailyRecords()
  const [date, setDate] = useState(todayStr())
  const [busy, setBusy] = useState(false)

  const saveToday = async () => {
    setBusy(true)
    try {
      await api.createDailyRecord(date)
      invalidateDailyRecords(client)
      toast.success('Record saved', `Daily record for ${displayDate(date)} saved.`)
    } catch (e) {
      toast.error('Save failed', e instanceof Error ? e.message : 'Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Daily Records</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Save the list of meters installed each day so there is a permanent record for the future.
        </p>
      </div>

      <div className="card space-y-4 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="label">Record date</span>
            <input
              type="date"
              value={date}
              max={todayStr()}
              onChange={(e) => setDate(e.target.value)}
              className="input"
            />
          </label>
          <button onClick={() => void saveToday()} disabled={busy} className="btn-primary">
            {busy ? 'Saving…' : `Save ${displayDate(date)} record`}
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Saves a snapshot of all meters completed on this date: the meter number, customer, facility,
          field technician and the activation / clear / tamper codes. Ready for future reference.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-xs font-bold tracking-widest text-slate-400 uppercase">Saved records</h2>
        {isLoading ? (
          <SkeletonTable />
        ) : !records || records.length === 0 ? (
          <EmptyState
            title="No daily records yet"
            hint="Pick a date above and press Save to create the day's installation record."
          />
        ) : (
          <div className="space-y-4">
            {records.map((r) => (
              <div key={r.id} className="card space-y-3 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-extrabold text-slate-900">{displayDate(r.recordDate)}</p>
                    <p className="text-xs text-slate-500">
                      {r.meters.length} meter{r.meters.length === 1 ? '' : 's'} installed · saved by{' '}
                      {r.createdByName ?? 'Secretary'} · {formatCode(r.createdAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                    {r.meters.length} installed
                  </span>
                </div>
                {r.meters.length === 0 ? (
                  <p className="text-sm text-slate-400">No meters completed on this date.</p>
                ) : (
                  <div className="grid gap-2">
                    {r.meters.map((m) => (
                      <RecordedMeterRow key={m.id} m={m} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}