import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '../api'
import { useFacilities, qk } from '../hooks/data'
import { useToast } from '../hooks/useToast'
import { Skeleton } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'

const schema = z.object({
  name: z.string().min(2, 'Enter a facility name'),
  location: z.string().min(2, 'Enter a location'),
})

type FormValues = z.infer<typeof schema>

export function Facilities() {
  const client = useQueryClient()
  const toast = useToast()
  const { data: facilities, isLoading } = useFacilities()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', location: '' } })

  const onSubmit = async (values: FormValues) => {
    setError(null)
    try {
      await api.createFacility({ ...values, active: true })
      client.invalidateQueries({ queryKey: qk.facilities })
      toast.success('Facility added', `${values.name} is now available for new meters.`)
      reset()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add facility')
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Facilities</h1>
        <p className="mt-0.5 text-sm text-slate-500">Manage the installation locations used on new meters.</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="card grid grid-cols-1 gap-4 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <label className="block">
          <span className="label">Name</span>
          <input {...register('name')} placeholder="e.g. Ikeja Depot" className="input" />
          {errors.name && <span className="field-error">{errors.name.message}</span>}
        </label>
        <label className="block">
          <span className="label">Location</span>
          <input {...register('location')} placeholder="e.g. Ikeja, Lagos" className="input" />
          {errors.location && <span className="field-error">{errors.location.message}</span>}
        </label>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Adding…' : 'Add Facility'}
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="card divide-y divide-slate-100">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      ) : !facilities || facilities.length === 0 ? (
        <EmptyState title="No facilities yet" hint="Add your first facility to start creating meters." />
      ) : (
        <ul className="card divide-y divide-slate-100">
          {facilities.map((f) => (
            <li key={f.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </span>
                <div>
                  <p className="font-bold text-slate-900">{f.name}</p>
                  <p className="text-sm text-slate-500">{f.location}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}