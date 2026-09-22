import { Hono } from 'hono'
import { supabase } from '../lib/supabase.js'
import { authMiddleware } from '../middleware/auth.js'
import { backfillDailyRecords, refreshDailyRecord } from '../lib/dailyRecords.js'
import type { AppEnv } from '../env.js'

const records = new Hono<AppEnv>()

interface DbDailyRecord {
  id: string
  record_date: string
  meters: unknown
  created_by: string | null
  created_at: string
  updated_at: string
}

function parseMeters(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

async function attachCreatedByName(
  rows: DbDailyRecord[]
): Promise<{ id: string; record_date: string; meters: unknown[]; created_by: string | null; created_at: string; updated_at: string; created_by_name: string | null }[]> {
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
    meters: parseMeters(r.meters),
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
    meters: r.meters,
    createdBy: r.created_by ?? undefined,
    createdByName: r.created_by_name ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

// List all daily records (auto-saved — refreshes today's snapshot on read)
records.get('/', authMiddleware, async (c) => {
  const user = c.get('user')
  const today = new Date().toISOString().slice(0, 10)

  await backfillDailyRecords()
  await refreshDailyRecord(today, user.id)

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

// Daily records are auto-saved: refreshed when a meter is completed and
// backfilled on read, so no manual save endpoint is needed.

export default records