import { Hono } from 'hono'
import { supabase } from '../lib/supabase'
import { dbUserToUser, getUserByEmail } from '../lib/helpers'
import type { AppEnv } from '../env'

const auth = new Hono<AppEnv>()

auth.post('/login', async (c) => {
  const body = await c.req.json()
  const { email, password } = body as { email: string; password: string }

  if (!email || !password) {
    return c.json({ error: 'Email and password required' }, 400)
  }

  const user = await getUserByEmail(email)
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  // Demo: any password works for seeded users
  // In production, verify bcrypt hash here
  const token = user.id

  return c.json({
    token,
    user: dbUserToUser(user),
  })
})

auth.get('/me', async (c) => {
  const token = c.req.header('Authorization')?.slice(7)
  if (!token) {
    return c.json({ error: 'No token' }, 401)
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, full_name, email, phone, role')
    .eq('id', token)
    .single()

  if (error || !user) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  return c.json(dbUserToUser(user))
})

export default auth
