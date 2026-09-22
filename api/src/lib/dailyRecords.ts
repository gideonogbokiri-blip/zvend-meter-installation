import { supabase } from './supabase.js'

// Auto-save the daily record for a date by re-snapshotting all meters
// completed on that date. If a record already exists, only the meters
// snapshot is updated so the original creator is preserved.
export async function refreshDailyRecord(recordDate: string, createdBy: string | null = null) {
  const dayStart = `${recordDate}T00:00:00.000Z`
  const dayEnd = new Date(new Date(`${recordDate}T00:00:00.000Z`).getTime() + 86_400_000).toISOString()

  const { data: meters, error: metersError } = await supabase
    .from('meter_installations')
    .select('*, facilities(name)')
    .eq('status', 'Completed')
    .gte('completed_at', dayStart)
    .lt('completed_at', dayEnd)

  if (metersError) {
    return { error: metersError }
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

  const { data: existing } = await supabase
    .from('daily_records')
    .select('id')
    .eq('record_date', recordDate)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .from('daily_records')
      .update({ meters: snapshot })
      .eq('record_date', recordDate)
      .select()
      .single()
    return { data, error }
  }

  const { data, error } = await supabase
    .from('daily_records')
    .insert({ record_date: recordDate, meters: snapshot, created_by: createdBy })
    .select()
    .single()

  return { data, error }
}

// Backfill daily records for every date that has completed meters but no
// record yet, so records always exist without manual saving.
export async function backfillDailyRecords() {
  const { data: completed, error } = await supabase
    .from('meter_installations')
    .select('completed_at')
    .eq('status', 'Completed')
    .not('completed_at', 'is', null)

  if (error) return { error }

  const dates = [...new Set((completed ?? []).map((m) => String((m as { completed_at: string }).completed_at).slice(0, 10)))]

  const { data: existing } = await supabase
    .from('daily_records')
    .select('record_date')

  const existingDates = new Set((existing ?? []).map((r) => r.record_date))

  for (const date of dates) {
    if (existingDates.has(date)) continue
    await refreshDailyRecord(date)
  }

  return { error: null }
}