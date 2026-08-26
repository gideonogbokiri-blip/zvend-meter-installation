import type { Role } from '../types'
import { ROLE_LABEL } from '../lib/status'

const ROLE_COLORS: Record<Role, string> = {
  Secretary: 'bg-brand-100 text-brand-700',
  FieldTechnician: 'bg-emerald-100 text-emerald-700',
  GM: 'bg-violet-100 text-violet-700',
  MD: 'bg-fuchsia-100 text-fuchsia-700',
  IT: 'bg-orange-100 text-orange-700',
}

export function Avatar({ name, role, size = 'md' }: { name: string; role: Role; size?: 'md' | 'lg' }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${ROLE_COLORS[role]} ${
        size === 'lg' ? 'h-12 w-12 text-lg' : 'h-9 w-9 text-sm'
      }`}
      title={`${name} · ${ROLE_LABEL[role]}`}
    >
      {initials}
    </span>
  )
}
