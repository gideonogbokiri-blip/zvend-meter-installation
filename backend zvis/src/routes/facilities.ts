import { Hono } from 'hono'
import { supabase } from '../lib/supabase'
import { authMiddleware, requireRole } from '../middleware/auth'
import type { AppEnv } from '../env'

const facilities = new Hono<AppEnv>()

// List all active facilities
facilities.get('/', authMiddleware, async (c) => {
  const { data, error } = await supabase
    .from('facilities')
    .select('*')
    .eq('active', true)
    .order('name')

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  return c.json(
    data.map((f) => ({
      id: f.id,
      name: f.name,
      location: f.location,
      active: f.active,
    }))
  )
})

// Create a facility (Secretary only)
facilities.post('/', authMiddleware, requireRole('Secretary'), async (c) => {
  const body = await c.req.json()
  const { name, location, active } = body as {
    name: string
    location: string
    active: boolean
  }

  if (!name || !location) {
    return c.json({ error: 'Name and location required' }, 400)
  }

  const { data, error } = await supabase
    .from('facilities')
    .insert({ name, location, active: active ?? true })
    .select()
    .single()

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  return c.json({
    id: data.id,
    name: data.name,
    location: data.location,
    active: data.active,
  })
})

export default facilities
