import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '../api'
import type { ClaimMeterInput } from '../api/contract'
import { useFacilities, useMeter } from '../hooks/data'
import { invalidateMeter } from '../hooks/data'
import { useBarcodeScanner } from '../hooks/useBarcodeScanner'
import { useGps } from '../hooks/useGps'
import { useAuth } from '../store/auth'
import { useToast } from '../hooks/useToast'
import { normalizeMeterNumber } from '../lib/meterNumber'
import { StatusBadge } from '../components/StatusBadge'
import { MeterVisual } from '../components/MeterVisual'
import { Skeleton } from '../components/Skeleton'

const formSchema = z.object({
  facilityId: z.string().min(1, 'Select a facility'),
  installationAddress: z.string().min(5, 'Enter the full installation address'),
  customerName: z.string().min(2, 'Enter the customer’s full name'),
  customerPhone: z.string().regex(/^\+?[\d\s-]{7,15}$/, 'Enter a valid phone number'),
})

type FormValues = z.infer<typeof formSchema>

type Step = 'scan' | 'form' | 'done'

export function FieldInstallPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const client = useQueryClient()
  const { user } = useAuth()
  const toast = useToast()
  const { data: meter, isLoading: meterLoading } = useMeter(id)
  const { data: facilities } = useFacilities()
  const {
    position: gpsPosition,
    loading: gpsLoading,
    error: gpsError,
    capture: captureGps,
  } = useGps()

  const [step, setStep] = useState<Step>('scan')
  const [scannedValue, setScannedValue] = useState<string | null>(null)
  const [manualInput, setManualInput] = useState('')
  const [manualOpen, setManualOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const onDecoded = useCallback((text: string) => {
    setScannedValue(normalizeMeterNumber(text))
  }, [])

  const { containerId, start, stop, scanning, error: scanError } = useBarcodeScanner(onDecoded)

  const startScanning = () => {
    setManualOpen(false)
    void start()
  }

  useEffect(() => {
    if (scannedValue) setStep('form')
  }, [scannedValue])

  useEffect(() => {
    if (step === 'form') captureGps().catch(() => undefined)
  }, [step, captureGps])

  const checkManual = () => {
    setScannedValue(normalizeMeterNumber(manualInput))
  }

  const assignedToMe = meter?.fieldTechnicianName === user?.fullName

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      facilityId: '',
      installationAddress: '',
      customerName: '',
      customerPhone: '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    if (!scannedValue || !meter) return
    if (!gpsPosition) {
      toast.error('GPS required', 'Capture your location before submitting.')
      return
    }
    const payload: ClaimMeterInput = {
      scannedMeterNumber: scannedValue,
      facilityId: values.facilityId,
      gpsLatitude: gpsPosition.latitude,
      gpsLongitude: gpsPosition.longitude,
      gpsAccuracy: gpsPosition.accuracy,
      installationAddress: values.installationAddress,
      customerName: values.customerName,
      customerPhone: values.customerPhone,
    }

    setSubmitting(true)
    try {
      const updated = await api.submitFieldInstall(meter.id, payload, user?.id ?? 'u-tech')
      invalidateMeter(client, updated.id)
      toast.success('Field data submitted', 'The Secretary will confirm your work to continue the process.')
      setStep('done')
    } catch (e) {
      toast.error('Submission failed', e instanceof Error ? e.message : 'Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (meterLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!meter) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="font-bold text-slate-900">Meter not found</p>
        <Link to="/field" className="btn-ghost mt-3">
          Back
        </Link>
      </div>
    )
  }

  if (!assignedToMe) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="font-bold text-slate-900">Meter not assigned to you</p>
        <p className="mt-1 text-sm text-slate-500">
          {meter.status === 'Approved'
            ? 'Claim this meter from the available list first.'
            : `Assigned to ${meter.fieldTechnicianName ?? 'another technician'}.`}
        </p>
        <Link to="/field" className="btn-ghost mt-3">
          Back
        </Link>
      </div>
    )
  }

  if (meter.status !== 'Assigned') {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="font-bold text-slate-900">This meter is not in progress</p>
        <p className="mt-1 text-sm text-slate-500">
          It is already at <StatusBadge status={meter.status} />.
        </p>
        <Link to="/field" className="btn-ghost mt-3">
          Back
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <button onClick={() => navigate(-1)} className="btn-ghost px-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back
      </button>

      <div className="animate-fade-in-up overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-900 p-5 text-white shadow-lg shadow-brand-900/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-widest text-brand-200 uppercase">Approved meter · assigned to you</p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight">
              {scannedValue ?? meter.officialMeterNumber}
            </p>
            <p className="mt-1 text-sm text-brand-100">Scan the barcode on the physical meter</p>
          </div>
          <MeterVisual number={scannedValue ?? meter.officialMeterNumber} className="h-auto w-32 shrink-0 drop-shadow-xl sm:w-36" />
        </div>
        <div className="mt-3">
          <StatusBadge status="Assigned" />
        </div>
      </div>

      {step === 'scan' && (
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="bg-slate-900 p-3.5">
              <p className="text-center text-sm font-medium text-slate-300">
                {scanning ? 'Point the camera at the meter barcode' : scanError ? 'Camera unavailable' : 'Barcode scan'}
              </p>
            </div>
            <div className="relative">
              <div ref={containerRef} id={containerId} className="flex min-h-[300px] items-center justify-center bg-slate-50" />
              {!scanning && !scanError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50/95 p-6 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9V7.5A2.5 2.5 0 015.5 5H9m6 0h3.5A2.5 2.5 0 0121 7.5V9M3 15v1.5A2.5 2.5 0 005.5 19H9m6 0h3.5a2.5 2.5 0 002.5-2.5V15M12 9v6m-3-3h6" />
                    </svg>
                  </span>
                  <p className="max-w-xs text-sm text-slate-600">
                    Scan the barcode of the physical meter to confirm it matches the assigned inventory number.
                  </p>
                  <button onClick={startScanning} className="btn-primary">
                    Start Camera
                  </button>
                </div>
              )}
            </div>
            {scanError && (
              <div className="border-t border-slate-100 p-4">
                <p className="text-center text-sm font-medium text-red-600">{scanError}</p>
                <button onClick={startScanning} className="btn-secondary mx-auto mt-3">
                  Try again
                </button>
              </div>
            )}
          </div>

          {scanning && (
            <div className="flex gap-2">
              <button onClick={() => void stop()} className="btn-secondary flex-1">
                Stop scanning
              </button>
              <button onClick={() => setManualOpen((v) => !v)} className="btn-ghost flex-1 ring-1 ring-slate-300">
                {manualOpen ? 'Hide manual entry' : "Can't scan? Type the number"}
              </button>
            </div>
          )}

          {!scanning && !scanError && (
            <button onClick={() => setManualOpen((v) => !v)} className="btn-ghost w-full ring-1 ring-slate-300">
              {manualOpen ? 'Hide manual entry' : "Can't scan? Type the number"}
            </button>
          )}

          {manualOpen && (
            <div className="card space-y-2 p-4">
              <p className="text-xs font-semibold text-slate-500">
                Type the number printed on the physical meter. It must match {meter.officialMeterNumber}.
              </p>
              <div className="flex gap-2">
                <input
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Enter meter number manually"
                  className="input font-mono tracking-wider"
                  autoFocus
                />
                <button onClick={checkManual} className="btn-primary shrink-0">
                  Check
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'form' && (
        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-5">
          <div
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold ${
              scannedValue === meter.officialMeterNumber
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {scannedValue === meter.officialMeterNumber
              ? `Meter number matches the assigned inventory meter: ${scannedValue}`
              : `Mismatch! Scanned ${scannedValue} but must match ${meter.officialMeterNumber}.`}
          </div>

          <label className="block">
            <span className="label">Facility</span>
            <select {...register('facilityId')} className="input">
              <option value="">Select a facility…</option>
              {(facilities ?? []).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} — {f.location}
                </option>
              ))}
            </select>
            {errors.facilityId && <span className="field-error">{errors.facilityId.message}</span>}
          </label>

          <div className="rounded-xl bg-slate-50 p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-700">GPS location</p>
              <button
                type="button"
                onClick={() => captureGps().catch(() => undefined)}
                disabled={gpsLoading}
                className="btn-ghost px-2 py-1 text-xs"
              >
                {gpsLoading ? 'Capturing…' : gpsPosition ? 'Recapture' : 'Capture now'}
              </button>
            </div>
            {gpsPosition ? (
              <div className="mt-1.5 flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <p className="text-sm text-slate-600">
                  {gpsPosition.latitude.toFixed(5)}, {gpsPosition.longitude.toFixed(5)}
                  <span className="ml-2 text-xs text-slate-400">accuracy ±{gpsPosition.accuracy}m</span>
                </p>
              </div>
            ) : (
              <p className="mt-1.5 text-sm text-slate-500">
                {gpsError ?? (gpsLoading ? 'Fetching your location…' : 'Location not captured yet.')}
              </p>
            )}
          </div>

          <label className="block">
            <span className="label">Installation address</span>
            <textarea
              {...register('installationAddress')}
              rows={3}
              placeholder="Full address of the installation…"
              className="input"
            />
            {errors.installationAddress && (
              <span className="field-error">{errors.installationAddress.message}</span>
            )}
          </label>

          <div className="rounded-xl border border-brand-200 bg-brand-50 p-3.5">
            <p className="text-xs font-bold tracking-wide text-brand-800 uppercase">Customer profiling</p>
            <p className="mt-1 text-xs text-brand-700">
              Ask the customer for their name and phone number. This profile is used later at the IT approval stage.
            </p>
          </div>

          <label className="block">
            <span className="label">Customer’s full name</span>
            <input {...register('customerName')} placeholder="e.g. Oluwaseun Adebayo" className="input" />
            {errors.customerName && (
              <span className="field-error">{errors.customerName.message}</span>
            )}
          </label>

          <label className="block">
            <span className="label">Customer’s phone number</span>
            <input {...register('customerPhone')} type="tel" placeholder="e.g. 0803 123 4567" className="input" />
            {errors.customerPhone && (
              <span className="field-error">{errors.customerPhone.message}</span>
            )}
          </label>

          <button
            type="submit"
            disabled={submitting || gpsLoading || scannedValue !== meter.officialMeterNumber}
            className="btn-primary w-full py-3 text-base"
          >
            {submitting ? 'Submitting…' : 'Submit Field Data'}
          </button>
        </form>
      )}

      {step === 'done' && (
        <div className="animate-fade-in-up rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-14 w-14 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="mt-3 text-xl font-extrabold text-emerald-800">Field data submitted</h2>
          <p className="mt-1 text-sm text-emerald-700">
            Your work is with the Secretary for confirmation. The process continues from there.
          </p>
          <Link to="/field" className="btn-success mt-5">
            Back to my work
          </Link>
        </div>
      )}
    </div>
  )
}