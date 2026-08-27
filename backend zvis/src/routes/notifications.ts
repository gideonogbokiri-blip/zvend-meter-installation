import { Hono } from 'hono'
import { supabase } from '../lib/supabase.js'
import { authMiddleware } from '../middleware/auth.js'
import type { AppEnv } from '../env.js'

const notifications = new Hono<AppEnv>()

// List notifications for a user
notifications.get('/', authMiddleware, async (c) => {
  const userId = c.get('userId')

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  return c.json(
    data.map((n) => ({
      id: n.id,
      userId: n.user_id,
      title: n.title,
      body: n.body,
      meterId: n.meter_id ?? undefined,
      read: n.read,
      createdAt: n.created_at,
    }))
  )
})

// Mark notification as read
notifications.patch('/:id/read', authMiddleware, async (c) => {
  const id = c.req.param('id')
  const userId = c.get('userId')

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  return c.json({ success: true })
})

export default notifications
