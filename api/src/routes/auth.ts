import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { supabase } from '../lib/supabase.js'
import { dbUserToUser, getUserByEmail } from '../lib/helpers.js'
import { authMiddleware } from '../middleware/auth.js'
import type { AppEnv } from '../env.js'

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

  const passwordMatches = await bcrypt.compare(password, user.password_hash)
  if (!passwordMatches) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

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

// Change own password
auth.post('/change-password', authMiddleware, async (c) => {
  const user = c.get('user')
  const body = await c.req.json()
  const { currentPassword, newPassword } = body as {
    currentPassword: string
    newPassword: string
  }

  if (!currentPassword || !newPassword) {
    return c.json({ error: 'Current and new password are required' }, 400)
  }

  if (newPassword.length < 8) {
    return c.json({ error: 'New password must be at least 8 characters long' }, 400)
  }

  const { data: dbUser, error: fetchError } = await supabase
    .from('users')
    .select('id, password_hash')
    .eq('id', user.id)
    .single()

  if (fetchError || !dbUser?.password_hash) {
    return c.json({ error: 'Account not found' }, 404)
  }

  const passwordMatches = await bcrypt.compare(currentPassword, dbUser.password_hash)
  if (!passwordMatches) {
    return c.json({ error: 'Current password is incorrect' }, 400)
  }

  const newHash = await bcrypt.hash(newPassword, 12)

  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash: newHash })
    .eq('id', user.id)

  if (updateError) {
    return c.json({ error: updateError.message }, 500)
  }

  return c.json({ message: 'Password updated successfully' })
})

export default auth
