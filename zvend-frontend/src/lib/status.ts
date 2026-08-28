import type { MeterStatus, Role } from '../types'

export interface StatusMeta {
  label: string
  badge: string
  dot: string
  order: number
}

export const STATUS_META: Record<MeterStatus, StatusMeta> = {
  Inventory: {
    label: 'In Inventory',
    badge: 'bg-slate-50 text-slate-700 ring-slate-300',
    dot: 'bg-slate-500',
    order: 1,
  },
  Approved: {
    label: 'Approved Inventory',
    badge: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
    dot: 'bg-cyan-500',
    order: 2,
  },
  Assigned: {
    label: 'Assigned · In Progress',
    badge: 'bg-blue-50 text-blue-700 ring-blue-200',
    dot: 'bg-blue-500',
    order: 3,
  },
  PendingSecretaryConfirm: {
    label: 'Pending Secretary Confirmation',
    badge: 'bg-sky-50 text-sky-700 ring-sky-200',
    dot: 'bg-sky-500',
    order: 4,
  },
  PendingGM: {
    label: 'Pending GM Review',
    badge: 'bg-violet-50 text-violet-700 ring-violet-200',
    dot: 'bg-violet-500',
    order: 5,
  },
  PendingMD: {
    label: 'Pending MD Approval',
    badge: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200',
    dot: 'bg-fuchsia-500',
    order: 6,
  },
  PendingIT: {
    label: 'Pending IT Action',
    badge: 'bg-orange-50 text-orange-700 ring-orange-200',
    dot: 'bg-orange-500',
    order: 7,
  },
  Completed: {
    label: 'Completed',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
    order: 8,
  },
  Rejected: {
    label: 'Rejected',
    badge: 'bg-red-50 text-red-700 ring-red-200',
    dot: 'bg-red-500',
    order: 9,
  },
}

export const ACTIVE_STATUSES: MeterStatus[] = [
  'Inventory',
  'Approved',
  'Assigned',
  'PendingSecretaryConfirm',
  'PendingGM',
  'PendingMD',
  'PendingIT',
]

export const INVENTORY_STATUSES: MeterStatus[] = ['Inventory', 'Approved', 'Assigned']

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
