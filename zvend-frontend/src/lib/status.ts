import type { MeterStatus, Role } from '../types'

export const STATUS_META: Record<
  MeterStatus,
  { label: string; badge: string; dot: string; order: number }
> = {
  PendingSecretaryConfirm: {
    label: 'Pending Secretary Confirmation',
    badge: 'bg-sky-50 text-sky-700 ring-sky-200',
    dot: 'bg-sky-500',
    order: 1,
  },
  PendingGM: {
    label: 'Pending GM Review',
    badge: 'bg-violet-50 text-violet-700 ring-violet-200',
    dot: 'bg-violet-500',
    order: 2,
  },
  PendingMD: {
    label: 'Pending MD Approval',
    badge: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200',
    dot: 'bg-fuchsia-500',
    order: 3,
  },
  PendingIT: {
    label: 'Pending IT Action',
    badge: 'bg-orange-50 text-orange-700 ring-orange-200',
    dot: 'bg-orange-500',
    order: 4,
  },
  Completed: {
    label: 'Completed',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
    order: 5,
  },
  Rejected: {
    label: 'Rejected',
    badge: 'bg-red-50 text-red-700 ring-red-200',
    dot: 'bg-red-500',
    order: 6,
  },
}

export const ACTIVE_STATUSES: MeterStatus[] = [
  'PendingSecretaryConfirm',
  'PendingGM',
  'PendingMD',
  'PendingIT',
]

export const ROLE_LABEL: Record<Role, string> = {
  Secretary: 'Secretary',
  FieldTechnician: 'Field Technician',
  GM: 'General Manager',
  MD: 'Managing Director',
  IT: 'IT Support',
}

export const HOME_BY_ROLE: Record<Role, string> = {
  Secretary: '/dashboard',
  FieldTechnician: '/field',
  GM: '/reviews',
  MD: '/approvals',
  IT: '/it',
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export const formatCode = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
