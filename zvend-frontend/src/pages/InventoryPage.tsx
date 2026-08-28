import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { useMeters } from '../hooks/data'
import { invalidateMeter } from '../hooks/data'
import { useBarcodeScanner } from '../hooks/useBarcodeScanner'
import { useAuth } from '../store/auth'
import { useToast } from '../hooks/useToast'
import { SkeletonTable } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { StatusBadge } from '../components/StatusBadge'
import { normalizeMeterNumber } from '../lib/meterNumber'
import { INVENTORY_STATUSES } from '../lib/status'

export function InventoryPage() {
  const { user } = useAuth()
  const client = useQueryClient()
  const toast = useToast()
  const { data: inventory, isLoading } = useMeters({})

  const [manualInput, setManualInput] = useState('')
  const [items, setItems] = useState<string[]>([])
  const [manualOpen, setManualOpen] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [busyApprove, setBusyApprove] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const onDecoded = useCallback((text: string) => {
    const num = normalizeMeterNumber(text)
    if (num) {
      setItems((prev) => (prev.includes(num) ? prev : [...prev, num]))
      toast.success('Meter added', num)
    }
  }, [toast])

  const { containerId, start, stop, scanning: camScanning, error: scanError } = useBarcodeScanner(onDecoded)

  const addManual = () => {
    const num = normalizeMeterNumber(manualInput)
    if (!num) return
    setItems((prev) => (prev.includes(num) ? prev : [...prev, num]))
    setManualInput('')
  }

  const inventoryMeters = (inventory ?? []).filter((m) =>
    INVENTORY_STATUSES.includes(m.status)
  )

  const pending = inventoryMeters.filter((m) => m.status === 'Inventory')
  const approved = inventoryMeters.filter((m) => m.status === 'Approved')
  const assigned = inventoryMeters.filter((m) => m.status === 'Assigned')

  const submitInventory = async () => {
    if (items.length === 0) {
      toast.error('No numbers', 'Add at least one meter number to the inventory.')
      return
    }
    setSubmitting(true)
    try {
      const result = await api.addToInventory({ meterNumbers: items }, user?.id ?? 'u-sec')
      invalidateMeter(client)
      if (result.created.length > 0) {
        toast.success(
          'Added to inventory',
          `${result.created.length} meter number(s) added. The GM will approve them before field work starts.`
        )
      }
      for (const err of result.errors) {
        toast.error(err.meterNumber, err.error)
      }
      setItems([])
    } catch (e) {
      toast.error('Could not add', e instanceof Error ? e.message : 'Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const approve = async (id: string) => {
    setBusyApprove(id)
    try {
      await api.approveInventory(id, user?.id ?? 'u-gm')
      invalidateMeter(client)
      toast.success('Meter approved', 'Field technicians can now see it and start work.')
    } catch (e) {
      toast.error('Approval failed', e instanceof Error ? e.message : 'Please try again.')
    } finally {
      setBusyApprove(null)
    }
  }

  const isSecretary = user?.role === 'Secretary'
  const isGM = user?.role === 'GM'

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Meter Inventory</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {isSecretary
              ? 'Add meter numbers from the office. The GM approves them, then field technicians install them.'
              : 'Approve the meters the Secretary scanned. Approved meters are available for field work.'}
          </p>
        </div>
      </div>

      {isSecretary && (
        <div className="animate-fade-in-up card space-y-4 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-900">Add meter numbers</p>
            <button
              onClick={() => {
                setManualOpen(false)
                if (camScanning) void stop()
                else void start()
                setScanning(true)
              }}
              className="btn-secondary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9V7.5A2.5 2.5 0 015.5 5H9m6 0h3.5A2.5 2.5 0 0121 7.5V9M3 15v1.5A2.5 2.5 0 005.5 19H9m6 0h3.5a2.5 2.5 0 002.5-2.5V15M12 9v6m-3-3h6" />
              </svg>
              {camScanning ? 'Stop camera' : 'Scan with camera'}
            </button>
          </div>

          {scanning && (
            <div>
              <div className="overflow-hidden rounded-2xl bg-slate-900">
                <p className="bg-slate-800 p-3 text-center text-sm font-medium text-slate-300">
                  {camScanning ? 'Point the camera at the meter barcode' : scanError ? 'Camera unavailable' : 'Barcode scan'}
                </p>
                <div className="relative">
                  <div ref={containerRef} id={containerId} className="flex min-h-[220px] items-center justify-center bg-slate-50" />
                  {!camScanning && !scanError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50/95 p-6 text-center">
                      <p className="max-w-xs text-sm text-slate-600">
                        Scan the barcode on each meter. Every number is added to the list below.
                      </p>
                      <button onClick={() => void start()} className="btn-primary">
                        Start Camera
                      </button>
                    </div>
                  )}
                </div>
                {scanError && (
                  <div className="border-t border-slate-100 p-4">
                    <p className="text-center text-sm font-medium text-red-600">{scanError}</p>
                  </div>
                )}
              </div>
              <button onClick={() => setScanning(false)} className="btn-ghost mt-2">
                Done scanning
              </button>
            </div>
          )}

          {!scanning && (
            <div>
              {!manualOpen && (
                <button onClick={() => setManualOpen(true)} className="btn-ghost ring-1 ring-slate-300">
                  Can't scan? Type the numbers
                </button>
              )}
              {manualOpen && (
                <div className="flex gap-2">
                  <input
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Type a meter number (5810XXXXXXXX)"
                    className="input font-mono tracking-wider"
                  />
                  <button onClick={addManual} className="btn-primary shrink-0">
                    Add
                  </button>
                  <button onClick={() => setManualOpen(false)} className="btn-secondary shrink-0">
                    Done
                  </button>
                </div>
              )}
            </div>
          )}

          {items.length > 0 && (
            <div>
              <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">
                Ready to add · {items.length}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {items.map((n) => (
                  <button
                    key={n}
                    onClick={() => setItems((prev) => prev.filter((x) => x !== n))}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-red-600 hover:line-through"
                  >
                    {n} ×
                  </button>
                ))}
              </div>
              <button
                onClick={() => void submitInventory()}
                disabled={submitting}
                className="btn-primary mt-4 w-full py-3"
              >
                {submitting ? 'Adding…' : `Add ${items.length} Meter${items.length > 1 ? 's' : ''} to Inventory`}
              </button>
            </div>
          )}
        </div>
      )}

      {isGM && pending.length > 0 && (
        <div className="animate-fade-in-up rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
          <p className="text-sm font-bold text-cyan-900">{pending.length} meter(s) awaiting your approval</p>
          <p className="mt-0.5 text-sm text-cyan-800">
            Approve them so field technicians can install them. Approved meters stay in the inventory.
          </p>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Inventory</h2>
          <span className="text-xs text-slate-500">
            {pending.length} pending · {approved.length} approved · {assigned.length} assigned
          </span>
        </div>

        {isLoading ? (
          <SkeletonTable />
        ) : inventoryMeters.length === 0 ? (
          <EmptyState
            title="Inventory is empty"
            hint={isSecretary ? 'Add meter numbers above to build the inventory.' : 'Wait for the Secretary to add meter numbers.'}
          />
        ) : (
          <div className="grid gap-2.5">
            {inventoryMeters.map((m) => (
              <div key={m.id} className="card flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <Link to={`/meters/${m.id}`} className="font-mono text-base font-extrabold tracking-tight text-slate-900 hover:text-brand-700">
                    {m.officialMeterNumber}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <StatusBadge status={m.status} />
                    {m.fieldTechnicianName && <span>· {m.fieldTechnicianName}</span>}
                  </div>
                </div>
                {isGM && m.status === 'Inventory' && (
                  <button
                    onClick={() => void approve(m.id)}
                    disabled={busyApprove !== null}
                    className="btn-primary shrink-0 bg-cyan-600 shadow-cyan-600/20 hover:bg-cyan-700"
                  >
                    {busyApprove === m.id ? 'Approving…' : 'Approve'}
                  </button>
                )}
                {m.status === 'Approved' && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 ring-inset">
                    Ready for field work
                  </span>
                )}
                {m.status === 'Assigned' && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-200 ring-inset">
                    Field work in progress
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}