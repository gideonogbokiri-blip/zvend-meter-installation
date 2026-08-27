import type { Next } from 'hono'
import { supabase } from '../lib/supabase.js'
import type { AppEnv } from '../env.js'

// Simple token-based auth: token = user ID (for demo)
// In production, use JWT or Supabase Auth tokens
export async function authMiddleware(c: { get: any; set: any; req: any; json: any }, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401)
  }

  const token = authHeader.slice(7)

  const { data: user, error } = await supabase
    .from('users')
    .select('id, full_name, email, phone, role')
    .eq('id', token)
    .single()

  if (error || !user) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  c.set('userId', user.id)
  c.set('user', {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone ?? undefined,
    role: user.role,
  })

  await next()
}

export function requireRole(...roles: string[]) {
  return async (c: { get: any; json: any }, next: Next) => {
    const user = c.get('user')
    if (!user || !roles.includes(user.role)) {
      return c.json({ error: 'Insufficient permissions' }, 403)
    }
    await next()
  }
}
