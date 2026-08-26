import { Hono } from 'hono'
import { supabase } from '../lib/supabase'
import { authMiddleware } from '../middleware/auth'
import type { AppEnv } from '../env'

const audit = new Hono<AppEnv>()

// List audit entries for a meter
audit.get('/:meterId', authMiddleware, async (c) => {
  const meterId = c.req.param('meterId')

  const { data, error } = await supabase
    .from('audit_entries')
    .select('*')
    .eq('meter_activation_id', meterId)
    .order('created_at', { ascending: true })

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  return c.json(
    data.map((a) => ({
      id: a.id,
      meterActivationId: a.meter_activation_id,
      userId: a.user_id,
      userName: a.user_name,
      userRole: a.user_role,
      action: a.action,
      timestamp: a.created_at,
      notes: a.notes ?? undefined,
    }))
  )
})

export default audit
