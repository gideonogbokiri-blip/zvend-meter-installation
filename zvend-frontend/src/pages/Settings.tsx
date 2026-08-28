import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '../api'
import { useAuth } from '../store/auth'
import { useToast } from '../hooks/useToast'
import { Avatar } from '../components/Avatar'
import { ROLE_LABEL } from '../lib/status'

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Re-enter your new password'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type PasswordFormValues = z.infer<typeof passwordSchema>

const profileSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  phone: z.string().min(3, 'Enter a phone number'),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export function Settings() {
  const { user, setUser } = useAuth()
  const toast = useToast()
  const [pwError, setPwError] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName ?? '',
      phone: user?.phone ?? '',
    },
  })

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSaveProfile = async (values: ProfileFormValues) => {
    setProfileError(null)
    try {
      const updated = await api.updateProfile({
        fullName: values.fullName,
        phone: values.phone,
      })
      setUser(updated)
      toast.success('Profile updated', 'Your name and phone number have been saved.')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not update profile'
      setProfileError(message)
      toast.error('Failed', message)
    }
  }

  const onChangePassword = async (values: PasswordFormValues) => {
    setPwError(null)
    try {
      await api.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      toast.success('Password updated', 'Your password has been changed successfully.')
      passwordForm.reset()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not change password'
      setPwError(message)
      toast.error('Failed', message)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-0.5 text-sm text-slate-500">Manage your profile and account security.</p>
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

      <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="card space-y-4 p-5">
        <div>
          <h2 className="font-bold text-slate-900">Profile</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Update your display name and contact phone number.
          </p>
        </div>

        {profileError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            {profileError}
          </div>
        )}

        <label className="block">
          <span className="label">Full name</span>
          <input
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            className="input"
            {...profileForm.register('fullName')}
          />
          {profileForm.formState.errors.fullName && (
            <span className="field-error">{profileForm.formState.errors.fullName.message}</span>
          )}
        </label>

        <label className="block">
          <span className="label">Phone number</span>
          <input
            type="tel"
            autoComplete="tel"
            placeholder="e.g. 0240000001"
            className="input"
            {...profileForm.register('phone')}
          />
          {profileForm.formState.errors.phone && (
            <span className="field-error">{profileForm.formState.errors.phone.message}</span>
          )}
        </label>

        <button type="submit" disabled={profileForm.formState.isSubmitting} className="btn-primary">
          {profileForm.formState.isSubmitting ? 'Saving…' : 'Save profile'}
        </button>
      </form>

      <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="card space-y-4 p-5">
        <div>
          <h2 className="font-bold text-slate-900">Change password</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            For security, change your password periodically. You'll keep the same email.
          </p>
        </div>

        {pwError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            {pwError}
          </div>
        )}

        <label className="block">
          <span className="label">Current password</span>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Your current password"
            className="input"
            {...passwordForm.register('currentPassword')}
          />
          {passwordForm.formState.errors.currentPassword && (
            <span className="field-error">{passwordForm.formState.errors.currentPassword.message}</span>
          )}
        </label>

        <label className="block">
          <span className="label">New password</span>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="input"
            {...passwordForm.register('newPassword')}
          />
          {passwordForm.formState.errors.newPassword && (
            <span className="field-error">{passwordForm.formState.errors.newPassword.message}</span>
          )}
        </label>

        <label className="block">
          <span className="label">Confirm new password</span>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Repeat the new password"
            className="input"
            {...passwordForm.register('confirmPassword')}
          />
          {passwordForm.formState.errors.confirmPassword && (
            <span className="field-error">{passwordForm.formState.errors.confirmPassword.message}</span>
          )}
        </label>

        <button type="submit" disabled={passwordForm.formState.isSubmitting} className="btn-primary">
          {passwordForm.formState.isSubmitting ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}