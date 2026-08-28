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
}

async function attachCreatedByName(
  rows: DbDailyRecord[]
): Promise<{ id: string; record_date: string; meters: unknown[] | null; created_by: string | null; created_at: string; updated_at: string; created_by_name: string | null }[]> {
  const userIds = [...new Set(rows.map((r) => r.created_by).filter(Boolean))]
  let names: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', userIds as string[])
    names = Object.fromEntries((users ?? []).map((u) => [u.id, u.full_name]))
  }
  return rows.map((r) => ({
    id: r.id,
    record_date: r.record_date,
    meters: r.meters ?? [],
    created_by: r.created_by ?? null,
    created_at: r.created_at,
    updated_at: r.updated_at,
    created_by_name: r.created_by ? (names[r.created_by] ?? null) : null,
  }))
}

function dbRecordToApi(r: Awaited<ReturnType<typeof attachCreatedByName>>[number]) {
  return {
    id: r.id,
    recordDate: r.record_date,
    meters: r.meters as unknown[],
    createdBy: r.created_by ?? undefined,
    createdByName: r.created_by_name ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

// List all daily records
records.get('/', authMiddleware, async (c) => {
  const { data, error } = await supabase
    .from('daily_records')
    .select('*')
    .order('record_date', { ascending: false })

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  const rows = await attachCreatedByName(data as DbDailyRecord[])
  return c.json(rows.map(dbRecordToApi))
})

// Get a single daily record
records.get('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')

  const { data, error } = await supabase
    .from('daily_records')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return c.json({ error: 'Daily record not found' }, 404)
  }

  const rows = await attachCreatedByName([data as DbDailyRecord])
  return c.json(dbRecordToApi(rows[0]))
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
    .select()
    .single()

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  const rows = await attachCreatedByName([data as DbDailyRecord])
  return c.json(dbRecordToApi(rows[0]))
})

export default records