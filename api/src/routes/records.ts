import { Hono } from 'hono'
import { supabase } from '../lib/supabase.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import type { AppEnv } from '../env.js'

const records = new Hono<AppEnv>()

interface DbDailyRecord {
  id: string
  record_date: string
  meters: unknown[] | null
  created_by: string | null
  created_at: string
  updated_at: string
  users?: { full_name: string } | null
}

function dbRecordToApi(r: DbDailyRecord) {
  return {
    id: r.id,
    recordDate: r.record_date,
    meters: (r.meters ?? []) as unknown[],
    createdBy: r.created_by ?? undefined,
    createdByName: r.users?.full_name ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

// List all daily records
records.get('/', authMiddleware, async (c) => {
  const { data, error } = await supabase
    .from('daily_records')
    .select('*, users(full_name)')
    .order('record_date', { ascending: false })

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  return c.json((data as DbDailyRecord[]).map(dbRecordToApi))
})

// Get a single daily record
records.get('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')

  const { data, error } = await supabase
    .from('daily_records')
    .select('*, users(full_name)')
    .eq('id', id)
    .single()

  if (error || !data) {
    return c.json({ error: 'Daily record not found' }, 404)
  }

  return c.json(dbRecordToApi(data as DbDailyRecord))
})

// Save/create a daily record (Secretary only)
// Captures all Completed meters whose completed_at falls on that date.
records.post('/', authMiddleware, requireRole('Secretary'), async (c) => {
  const user = c.get('user')
  const body = await c.req.json()
  const { date } = body as { date?: string }

  let recordDate: string
  if (date) {
    const parsed = new Date(`${date}T00:00:00`)
    if (Number.isNaN(parsed.getTime())) {
      return c.json({ error: 'Invalid date. Use YYYY-MM-DD' }, 400)
    }
    recordDate = date
  } else {
    const now = new Date()
    recordDate = now.toISOString().slice(0, 10)
  }

  const dayStart = `${recordDate}T00:00:00.000Z`
  const dayEnd = new Date(new Date(`${recordDate}T00:00:00.000Z`).getTime() + 86_400_000).toISOString()

  const { data: meters, error: metersError } = await supabase
    .from('meter_installations')
    .select('*, facilities(name)')
    .eq('status', 'Completed')
    .gte('completed_at', dayStart)
    .lt('completed_at', dayEnd)

  if (metersError) {
    return c.json({ error: metersError.message }, 500)
  }

  const snapshot = (meters ?? []).map((m) => ({
    id: m.id,
    official_meter_number: m.official_meter_number,
    facility_name: m.facilities?.name ?? '',
    customer_name: m.customer_name,
    customer_phone: m.customer_phone,
    installation_address: m.installation_address,
    field_technician_name: m.field_technician_name,
    activation_code: m.activation_code,
    clear_code: m.clear_code,
    tamper_code: m.tamper_code,
    completed_at: m.completed_at,
  }))

  const { data, error } = await supabase
    .from('daily_records')
    .upsert(
      { record_date: recordDate, meters: JSON.stringify(snapshot), created_by: user.id },
      { onConflict: 'record_date' }
    )
    .select('*, users(full_name)')
    .single()

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  return c.json(dbRecordToApi(data as DbDailyRecord))
})

export default records