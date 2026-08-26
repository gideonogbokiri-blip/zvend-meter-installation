import { Navigate, Outlet } from 'react-router-dom'
import { useAuth, homePath } from '../store/auth'
import type { Role } from '../types'

export function RequireAuth() {
  const { user, token } = useAuth()
  if (!user || !token) return <Navigate to="/login" replace />
  return <Outlet />
}

export function RequireRole({ roles }: { roles: Role[] }) {
  const { user, token } = useAuth()
  if (!user || !token) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to={homePath(user)} replace />
  return <Outlet />
}