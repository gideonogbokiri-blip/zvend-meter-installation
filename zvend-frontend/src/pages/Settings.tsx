import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '../api'
import { useAuth } from '../store/auth'
import { useToast } from '../hooks/useToast'
import { Avatar } from '../components/Avatar'
import { ROLE_LABEL } from '../lib/status'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Re-enter your new password'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export function Settings() {
  const { user } = useAuth()
  const toast = useToast()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = async (values: FormValues) => {
    setError(null)
    try {
      await api.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      toast.success('Password updated', 'Your password has been changed successfully.')
      reset()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not change password'
      setError(message)
      toast.error('Failed', message)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-0.5 text-sm text-slate-500">Manage your account security.</p>
      </div>

      <div className="card flex items-center gap-3.5 p-5">
        <Avatar name={user?.fullName ?? ''} role={user?.role ?? 'Secretary'} />
        <div>
          <p className="font-bold text-slate-900">{user?.fullName}</p>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <span className="mt-1 inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700">
            {user ? ROLE_LABEL[user.role] : ''}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-5">
        <div>
          <h2 className="font-bold text-slate-900">Change password</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            For security, change your password periodically. You'll keep the same email.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <label className="block">
          <span className="label">Current password</span>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Your current password"
            className="input"
            {...register('currentPassword')}
          />
          {errors.currentPassword && <span className="field-error">{errors.currentPassword.message}</span>}
        </label>

        <label className="block">
          <span className="label">New password</span>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="input"
            {...register('newPassword')}
          />
          {errors.newPassword && <span className="field-error">{errors.newPassword.message}</span>}
        </label>

        <label className="block">
          <span className="label">Confirm new password</span>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Repeat the new password"
            className="input"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && <span className="field-error">{errors.confirmPassword.message}</span>}
        </label>

        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}