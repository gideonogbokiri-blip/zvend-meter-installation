import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { useMeter } from '../hooks/data'
import { invalidateMeter } from '../hooks/data'
import { useAuth } from '../store/auth'
import { useToast } from '../hooks/useToast'
import { Skeleton } from '../components/Skeleton'
import { StatusBadge } from '../components/StatusBadge'
import { Field, FieldGrid } from '../components/Field'
import { AuditTimeline } from '../components/AuditTimeline'
import { Modal } from '../components/Modal'
import { MeterVisual } from '../components/MeterVisual'
import { formatDate } from '../lib/status'
import type { Role } from '../types'

const BACK_PATH: Record<Role, string> = {
  Secretary: '/dashboard',
  FieldTechnician: '/field',
  GM: '/reviews',
  MD: '/approvals',
  IT: '/it',
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable
    }
  }
  return (
    <button onClick={() => void copy()} className="btn-secondary px-3 py-1.5 text-xs">
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function ActionPanel({
  children,
  tone,
}: {
  children: ReactNode
  tone: 'brand' | 'violet' | 'fuchsia' | 'orange' | 'teal' | 'red' | 'neutral'
}) {
  const tones: Record<string, string> = {
    brand: 'border-brand-200 bg-brand-50/70',
    violet: 'border-violet-200 bg-violet-50/70',
    fuchsia: 'border-fuchsia-200 bg-fuchsia-50/70',
    orange: 'border-orange-200 bg-orange-50/70',
    teal: 'border-teal-200 bg-teal-50/70',
    red: 'border-red-200 bg-red-50/70',
    neutral: 'border-slate-200 bg-white',
  }
  return <div className={`animate-fade-in-up rounded-2xl border p-5 ${tones[tone]}`}>{children}</div>
}

export function MeterDetail() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const client = useQueryClient()
  const toast = useToast()
  const { data: meter, isLoading } = useMeter(id)

  const [busy, setBusy] = useState<string | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [itOpen, setItOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [itProfiled, setItProfiled] = useState(false)
  const [itNotes, setItNotes] = useState('')
  const [activationCode, setActivationCode] = useState('')

  const runAction = async (key: string, success: string, fn: () => Promise<unknown>) => {
    setBusy(key)
    try {
      await fn()
      invalidateMeter(client, id)
      toast.success(success)
    } catch (e) {
      toast.error('Action failed', e instanceof Error ? e.message : 'Please try again.')
    } finally {
      setBusy(null)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="card space-y-2 p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-52 w-full" />
      </div>
    )
  }

  if (!meter || !user) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="font-bold text-slate-900">Meter not found</p>
        <Link to="/" className="btn-ghost mt-3">
          Back
        </Link>
      </div>
    )
  }

  const role = user.role

  const submitReject = async () => {
    if (!reason.trim()) {
      toast.error('Reason required', 'Add a reason before rejecting the job.')
      return
    }
    await runAction(
      'reject',
      'Job rejected',
      () =>
        role === 'GM'
          ? api.gmReject(meter.id, { reason }, user.id)
          : api.mdReject(meter.id, { reason }, user.id),
    )
    setRejectOpen(false)
  }

  const submitItComplete = async () => {
    if (!itProfiled) {
      toast.error('Confirm action', 'Tick the box confirming you have acted on the task.')
      return
    }
    if (!activationCode.trim()) {
      toast.error('Code required', 'Paste the activation code from the activation platform.')
      return
    }
    await runAction(
      'itcomplete',
      'Activation code recorded',
      () => api.itComplete(meter.id, { profileConfirmed: itProfiled, activationCode, notes: itNotes }, user.id),
    )
    setItOpen(false)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="animate-fade-in-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-6 text-white shadow-lg shadow-brand-900/20">
        <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-widest text-brand-200 uppercase">Meter installation</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight">{meter.officialMeterNumber}</h1>
              <span className="rounded-full bg-white/95 px-2 py-0.5">
                <StatusBadge status={meter.status} />
              </span>
            </div>
            <p className="mt-1 text-sm text-brand-100">
              {meter.facilityName} · Created {formatDate(meter.createdAt)}
            </p>
          </div>
          <MeterVisual number={meter.officialMeterNumber} className="h-auto w-32 shrink-0 drop-shadow-xl sm:w-40" />
          <Link to={BACK_PATH[role]} className="btn-secondary bg-white/10 py-2 text-white ring-white/20 backdrop-blur hover:bg-white/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back
          </Link>
        </div>
      </div>

      {meter.rejectionReason && (
        <div className="animate-fade-in-up flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-bold text-red-800">Rejected previously</p>
            <p className="mt-0.5 text-sm text-red-700">{meter.rejectionReason}</p>
          </div>
        </div>
      )}

      {role === 'Secretary' && meter.status === 'PendingSecretaryConfirm' && (
        <ActionPanel tone="brand">
          <p className="text-sm font-semibold text-brand-900">
            Field data has been submitted. Review it below, then send to the GM.
          </p>
          <button
            onClick={() => void runAction('confirm', 'Sent to GM', () => api.secretaryConfirm(meter.id, user.id))}
            disabled={busy !== null}
            className="btn-primary mt-3 w-full"
          >
            {busy === 'confirm' ? 'Sending…' : 'Confirm Field Data & Send to GM'}
          </button>
        </ActionPanel>
      )}

      {role === 'Secretary' && meter.status === 'PendingClosure' && (
        <ActionPanel tone="teal">
          <p className="text-sm font-semibold text-teal-900">
            IT has recorded an activation code. Review and close the job.
          </p>
          <button
            onClick={() => void runAction('close', 'Job closed and archived', () => api.secretaryClose(meter.id, user.id))}
            disabled={busy !== null}
            className="btn-success mt-3 w-full"
          >
            {busy === 'close' ? 'Closing…' : 'Confirm & Close Job'}
          </button>
        </ActionPanel>
      )}

      {role === 'Secretary' && meter.status === 'Rejected' && (
        <ActionPanel tone="red">
          <p className="text-sm font-semibold text-red-900">This job was rejected. You can resubmit it to the GM.</p>
          <button
            onClick={() => void runAction('resend', 'Resubmitted to GM', () => api.resendToGM(meter.id, user.id))}
            disabled={busy !== null}
            className="btn-primary mt-3 w-full"
          >
            {busy === 'resend' ? 'Resubmitting…' : 'Resend to GM'}
          </button>
        </ActionPanel>
      )}

      {role === 'GM' && meter.status === 'PendingGM' && (
        <ActionPanel tone="violet">
          <p className="text-sm font-semibold text-violet-900">Review the installation details and forward to the MD.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => void runAction('forward', 'Forwarded to MD', () => api.gmForward(meter.id, user.id))}
              disabled={busy !== null}
              className="btn-primary flex-1 bg-violet-600 shadow-violet-600/20 hover:bg-violet-700"
            >
              {busy === 'forward' ? 'Forwarding…' : 'Forward to MD'}
            </button>
            <button
              onClick={() => {
                setReason('')
                setRejectOpen(true)
              }}
              disabled={busy !== null}
              className="btn-secondary flex-1 text-red-700 ring-red-200 hover:bg-red-50"
            >
              Reject
            </button>
          </div>
        </ActionPanel>
      )}

      {role === 'MD' && meter.status === 'PendingMD' && (
        <ActionPanel tone="fuchsia">
          <p className="text-sm font-semibold text-fuchsia-900">Final management approval decides what happens next.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => void runAction('approve', 'Approved for IT', () => api.mdApprove(meter.id, user.id))}
              disabled={busy !== null}
              className="btn-primary flex-1 bg-fuchsia-600 shadow-fuchsia-600/20 hover:bg-fuchsia-700"
            >
              {busy === 'approve' ? 'Approving…' : 'Approve'}
            </button>
            <button
              onClick={() => {
                setReason('')
                setRejectOpen(true)
              }}
              disabled={busy !== null}
              className="btn-secondary flex-1 text-red-700 ring-red-200 hover:bg-red-50"
            >
              Reject
            </button>
          </div>
        </ActionPanel>
      )}

      {role === 'IT' && meter.status === 'PendingIT' && (
        <ActionPanel tone="orange">
          <p className="text-sm font-semibold text-orange-900">
            Job approved. Review the customer profiling information, carry out the technical work, then record the activation code from the activation platform.
          </p>
          <button
            onClick={() => {
              setItProfiled(false)
              setItNotes('')
              setActivationCode('')
              setItOpen(true)
            }}
            disabled={busy !== null}
            className="btn-primary mt-3 w-full bg-orange-600 shadow-orange-600/20 hover:bg-orange-700"
          >
            Carry Out Task & Record Code
          </button>
        </ActionPanel>
      )}

      <section className="card space-y-3 p-6">
        <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Installation record</h2>
        <FieldGrid>
          <Field label="Official meter number">{meter.officialMeterNumber}</Field>
          <Field label="Facility">{meter.facilityName}</Field>
          <Field label="Scanned barcode">{meter.scannedMeterNumber ?? 'Not scanned yet'}</Field>
          <Field label="Field technician">{meter.fieldTechnicianName ?? '—'}</Field>
          <Field label="Customer name">{meter.customerName ?? '—'}</Field>
          <Field label="Customer phone">{meter.customerPhone ?? '—'}</Field>
          <Field label="Installation address">{meter.installationAddress ?? '—'}</Field>
          <Field label="Last updated">{formatDate(meter.updatedAt)}</Field>
          {meter.gpsLatitude != null && meter.gpsLongitude != null && (
            <Field label="GPS coordinates">
              <span className="font-medium break-all text-brand-700">
                {meter.gpsLatitude.toFixed(5)}, {meter.gpsLongitude.toFixed(5)}
              </span>
              {meter.gpsAccuracy != null && <span className="ml-1 text-xs text-slate-400">±{meter.gpsAccuracy}m</span>}
              <span className="mt-1 block">
                <a
                  href={`https://www.google.com/maps?q=${meter.gpsLatitude},${meter.gpsLongitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  Open in Maps →
                </a>
              </span>
            </Field>
          )}
        </FieldGrid>
      </section>

      {meter.activationCode && (
        <section className="animate-fade-in-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 to-teal-900 p-6 text-white shadow-lg shadow-teal-900/20">
          <div className="pointer-events-none absolute -top-14 -right-14 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <p className="text-xs font-bold tracking-widest text-teal-200 uppercase">Activation code</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-3xl font-extrabold tracking-widest">{meter.activationCode}</p>
              <CopyButton text={meter.activationCode} />
            </div>
            <p className="mt-2 text-xs text-teal-200">Permanently linked to {meter.officialMeterNumber}.</p>
          </div>
        </section>
      )}

      {meter.itNotes && (
        <section className="card space-y-2 p-6">
          <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">IT notes</h2>
          <p className="text-sm text-slate-700">{meter.itNotes}</p>
        </section>
      )}

      <section className="card space-y-4 p-6">
        <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Audit trail</h2>
        <AuditTimeline meterId={meter.id} />
      </section>

      <Modal open={rejectOpen} title="Reject Job" onClose={() => setRejectOpen(false)}>
        <p className="text-sm text-slate-600">
          A reason is required. The job returns to the Secretary with your comment.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Reason for rejection…"
          className="input mt-3"
        />
        <div className="mt-5 flex gap-2">
          <button onClick={() => void submitReject()} disabled={busy !== null} className="btn-danger flex-1">
            {busy === 'reject' ? 'Rejecting…' : 'Reject'}
          </button>
          <button onClick={() => setRejectOpen(false)} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </Modal>

      <Modal open={itOpen} title="Complete IT Task" onClose={() => setItOpen(false)}>
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-orange-50 p-3">
            <input
              id="profiled"
              type="checkbox"
              checked={itProfiled}
              onChange={(e) => setItProfiled(e.target.checked)}
              className="mt-0.5 h-5 w-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
            />
            <label htmlFor="profiled" className="text-sm font-medium text-orange-900">
              I have acted on the task — the meter has been profiled / configured on the grid
            </label>
          </div>

          <label className="block">
            <span className="label">Activation code</span>
            <input
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value)}
              placeholder="Paste code from the activation platform…"
              className="input font-mono tracking-widest"
              autoComplete="off"
            />
            <span className="mt-1.5 block text-xs text-slate-400">
              The code is generated by the separate activation system — type or paste it here. It will be permanently linked to this meter.
            </span>
          </label>

          <label className="block">
            <span className="label">Internal notes (optional)</span>
            <textarea
              value={itNotes}
              onChange={(e) => setItNotes(e.target.value)}
              rows={3}
              placeholder="Profiling notes…"
              className="input"
            />
          </label>

          <button onClick={() => void submitItComplete()} disabled={busy !== null} className="btn-primary w-full bg-orange-600 shadow-orange-600/20 hover:bg-orange-700">
            {busy === 'itcomplete' ? 'Saving…' : 'Save Code & Complete Task'}
          </button>
        </div>
      </Modal>
    </div>
  )
}