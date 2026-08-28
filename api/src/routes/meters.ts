import { Hono } from 'hono'
import { supabase } from '../lib/supabase.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { isValidMeterNumber, normalizeMeterNumber } from '../lib/helpers.js'
import type { AppEnv } from '../env.js'
import type { MeterInstallation, MeterStatus, Role } from '../types.js'

const meters = new Hono<AppEnv>()

interface DbMeter {
  id: string
  official_meter_number: string
  facility_id: string | null
  status: string
  scanned_meter_number: string | null
  gps_latitude: number | null
  gps_longitude: number | null
  gps_accuracy: number | null
  installation_address: string | null
  field_technician_name: string | null
  customer_name: string | null
  customer_phone: string | null
  activation_code: string | null
  clear_code: string | null
  tamper_code: string | null
  completed_at: string | null
  profile_confirmed: boolean | null
  it_notes: string | null
  rejection_reason: string | null
  created_by: string
  created_at: string
  updated_at: string
  facilities?: { name: string } | null
}

function dbMeterToApi(m: DbMeter) {
  return {
    id: m.id,
    officialMeterNumber: m.official_meter_number,
    facilityId: m.facility_id ?? '',
    facilityName: m.facilities?.name ?? '',
    status: m.status as MeterStatus,
    scannedMeterNumber: m.scanned_meter_number ?? undefined,
    gpsLatitude: m.gps_latitude ?? undefined,
    gpsLongitude: m.gps_longitude ?? undefined,
    gpsAccuracy: m.gps_accuracy ?? undefined,
    installationAddress: m.installation_address ?? undefined,
    fieldTechnicianName: m.field_technician_name ?? undefined,
    customerName: m.customer_name ?? undefined,
    customerPhone: m.customer_phone ?? undefined,
    activationCode: m.activation_code ?? undefined,
    clearCode: m.clear_code ?? undefined,
    tamperCode: m.tamper_code ?? undefined,
    completedAt: m.completed_at ?? undefined,
    profileConfirmed: m.profile_confirmed ?? undefined,
    itNotes: m.it_notes ?? undefined,
    rejectionReason: m.rejection_reason ?? undefined,
    createdBy: m.created_by,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
  }
}

async function addAuditEntry(
  meterId: string,
  userId: string,
  userName: string,
  userRole: Role,
  action: string,
  notes?: string
) {
  await supabase.from('audit_entries').insert({
    meter_activation_id: meterId,
    user_id: userId,
    user_name: userName,
    user_role: userRole,
    action,
    notes: notes ?? null,
  })
}

async function createNotification(
  userId: string,
  title: string,
  body: string,
  meterId?: string
) {
  await supabase.from('notifications').insert({
    user_id: userId,
    title,
    body,
    meter_id: meterId ?? null,
  })
}

async function getRoleId(role: Role) {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('role', role)
    .limit(1)
    .single()
  return data?.id
}

async function getRoleIds(role: Role) {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('role', role)
  return (data ?? []).map((u) => u.id as string)
}

// List meters with optional filters
meters.get('/', authMiddleware, async (c) => {
  const status = c.req.query('status')
  const facilityId = c.req.query('facilityId')
  const search = c.req.query('search')

  let query = supabase
    .from('meter_installations')
    .select('*, facilities(name)')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }
  if (facilityId) {
    query = query.eq('facility_id', facilityId)
  }
  if (search) {
    query = query.or(
      `official_meter_number.ilike.%${search}%,customer_name.ilike.%${search}%,installation_address.ilike.%${search}%`
    )
  }

  const { data, error } = await query

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  return c.json((data as DbMeter[]).map(dbMeterToApi))
})

// Get single meter
meters.get('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')

  const { data, error } = await supabase
    .from('meter_installations')
    .select('*, facilities(name)')
    .eq('id', id)
    .single()

  if (error || !data) {
    return c.json({ error: 'Meter not found' }, 404)
  }

  return c.json(dbMeterToApi(data as DbMeter))
})

// Secretary adds meter numbers to inventory (batch)
meters.post('/inventory', authMiddleware, requireRole('Secretary'), async (c) => {
  const user = c.get('user')
  const body = await c.req.json()
  const { meterNumbers } = body as { meterNumbers?: string[] }

  const raw = (meterNumbers ?? [])
    .map((n) => normalizeMeterNumber(String(n)))
    .filter(Boolean)

  if (raw.length === 0) {
    return c.json({ error: 'Enter at least one meter number' }, 400)
  }

  const created: DbMeter[] = []
  const errors: { meterNumber: string; error: string }[] = []
  const seen = new Set<string>()

  for (const meterNum of raw) {
    if (!isValidMeterNumber(meterNum)) {
      errors.push({ meterNumber: meterNum, error: 'Invalid meter number. Must be 5810XXXXXXXX (11 digits)' })
      continue
    }
    if (seen.has(meterNum)) {
      errors.push({ meterNumber: meterNum, error: 'Duplicate number in batch' })
      continue
    }
    seen.add(meterNum)

    const { data: existing } = await supabase
      .from('meter_installations')
      .select('id')
      .eq('official_meter_number', meterNum)
      .single()

    if (existing) {
      errors.push({ meterNumber: meterNum, error: 'Meter number already registered' })
      continue
    }

    const { data, error } = await supabase
      .from('meter_installations')
      .insert({
        official_meter_number: meterNum,
        facility_id: null,
        status: 'Inventory',
        created_by: user.id,
      })
      .select('*, facilities(name)')
      .single()

    if (error) {
      errors.push({ meterNumber: meterNum, error: error.message })
      continue
    }
    created.push(data as DbMeter)
  }

  if (created.length > 0) {
    await addAuditEntry(
      created[0].id,
      user.id,
      user.fullName,
      user.role,
      `Added ${created.length} meter number(s) to inventory`,
      errors.length > 0 ? `Skipped: ${errors.map((e) => e.meterNumber).join(', ')}` : undefined
    )
  }

  // Notify GM about inventory awaiting approval
  const gmId = await getRoleId('GM')
  if (gmId && created.length > 0) {
    await createNotification(
      gmId,
      'New meters in inventory',
      `${user.fullName} added ${created.length} meter number(s). Approve them so field technicians can start work.`
    )
  }

  return c.json({
    created: created.map(dbMeterToApi),
    errors,
  } satisfies { created: MeterInstallation[]; errors: { meterNumber: string; error: string }[] })
})

// GM approves a single inventory meter
meters.post('/:id/inventory-approve', authMiddleware, requireRole('GM'), async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')

  const { data: meter, error: fetchError } = await supabase
    .from('meter_installations')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !meter) {
    return c.json({ error: 'Meter not found' }, 404)
  }

  if (meter.status !== 'Inventory') {
    return c.json({ error: 'Meter is not in pending inventory' }, 400)
  }

  const { data, error } = await supabase
    .from('meter_installations')
    .update({ status: 'Approved' })
    .eq('id', id)
    .select('*, facilities(name)')
    .single()

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  await addAuditEntry(id, user.id, user.fullName, user.role, 'Approved meter from inventory')

  // Notify all field technicians
  const techIds = await getRoleIds('FieldTechnician')
  for (const techId of techIds) {
    await createNotification(
      techId,
      'Meter approved for work',
      `Meter ${meter.official_meter_number} was approved by the GM. Open it to start installation.`,
      id
    )
  }

  return c.json(dbMeterToApi(data as DbMeter))
})

// Field technician claims an approved inventory meter
meters.post('/:id/claim', authMiddleware, requireRole('FieldTechnician'), async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')

  const { data: meter, error: fetchError } = await supabase
    .from('meter_installations')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !meter) {
    return c.json({ error: 'Meter not found' }, 404)
  }

  if (meter.status !== 'Approved') {
    return c.json({ error: 'Only approved inventory meters can be claimed' }, 400)
  }

  const { data, error } = await supabase
    .from('meter_installations')
    .update({
      status: 'Assigned',
      field_technician_name: user.fullName,
    })
    .eq('id', id)
    .select('*, facilities(name)')
    .single()

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  await addAuditEntry(id, user.id, user.fullName, user.role, `Claimed inventory meter ${meter.official_meter_number}`)

  const secretaryId = await getRoleId('Secretary')
  if (secretaryId) {
    await createNotification(
      secretaryId,
      'Meter claimed by field tech',
      `${user.fullName} claimed meter ${meter.official_meter_number} and is doing the field work.`,
      id
    )
  }

  return c.json(dbMeterToApi(data as DbMeter))
})

// Field technician completes field data for an assigned meter
meters.post('/:id/submit-field', authMiddleware, requireRole('FieldTechnician'), async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')
  const body = await c.req.json()

  const {
    scannedMeterNumber,
    facilityId,
    gpsLatitude,
    gpsLongitude,
    gpsAccuracy,
    installationAddress,
    customerName,
    customerPhone,
  } = body as {
    scannedMeterNumber: string
    facilityId: string
    gpsLatitude: number
    gpsLongitude: number
    gpsAccuracy?: number
    installationAddress: string
    customerName: string
    customerPhone: string
  }

  const { data: meter, error: fetchError } = await supabase
    .from('meter_installations')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !meter) {
    return c.json({ error: 'Meter not found' }, 404)
  }

  if (meter.status !== 'Assigned') {
    return c.json({ error: 'Meter is not assigned to a field technician' }, 400)
  }

  if (meter.field_technician_name !== user.fullName) {
    return c.json({ error: 'This meter is assigned to another technician' }, 403)
  }

  const meterNum = normalizeMeterNumber(scannedMeterNumber)
  if (!isValidMeterNumber(meterNum) || meterNum !== meter.official_meter_number) {
    return c.json(
      { error: 'Scanned number does not match the assigned inventory meter' },
      400
    )
  }

  if (!facilityId || !installationAddress || !customerName || !customerPhone) {
    return c.json({ error: 'Missing required fields' }, 400)
  }

  const { data, error } = await supabase
    .from('meter_installations')
    .update({
      facility_id: facilityId,
      status: 'PendingSecretaryConfirm',
      scanned_meter_number: meterNum,
      gps_latitude: gpsLatitude,
      gps_longitude: gpsLongitude,
      gps_accuracy: gpsAccuracy ?? null,
      installation_address: installationAddress,
      customer_name: customerName,
      customer_phone: customerPhone,
    })
    .eq('id', id)
    .select('*, facilities(name)')
    .single()

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  await addAuditEntry(id, user.id, user.fullName, user.role, 'Field data completed and submitted')

  // Notify Secretary
  const secretaryId = await getRoleId('Secretary')
  if (secretaryId) {
    await createNotification(
      secretaryId,
      'Field data awaiting confirmation',
      `${user.fullName} completed meter ${meterNum}. Confirm the work to continue the process.`,
      id
    )
  }

  return c.json(dbMeterToApi(data as DbMeter))
})

// Secretary confirms meter data
meters.post(
  '/:id/confirm',
  authMiddleware,
  requireRole('Secretary'),
  async (c) => {
    const id = c.req.param('id')
    const user = c.get('user')

    const { data: meter, error: fetchError } = await supabase
      .from('meter_installations')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !meter) {
      return c.json({ error: 'Meter not found' }, 404)
    }

    if (meter.status !== 'PendingSecretaryConfirm') {
      return c.json({ error: 'Meter is not pending secretary confirmation' }, 400)
    }

    const { data, error } = await supabase
      .from('meter_installations')
      .update({ status: 'PendingGM' })
      .eq('id', id)
      .select('*, facilities(name)')
      .single()

    if (error) {
      return c.json({ error: error.message }, 500)
    }

    await addAuditEntry(id, user.id, user.fullName, user.role, 'Confirmed and forwarded to GM')

    const gmId = await getRoleId('GM')
    if (gmId) {
      await createNotification(
        gmId,
        'Meter pending review',
        `Meter ${meter.official_meter_number} confirmed by secretary, awaiting GM review`,
        id
      )
    }

    return c.json(dbMeterToApi(data as DbMeter))
  }
)

// GM forwards to MD
meters.post('/:id/forward', authMiddleware, requireRole('GM'), async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')

  const { data: meter, error: fetchError } = await supabase
    .from('meter_installations')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !meter) {
    return c.json({ error: 'Meter not found' }, 404)
  }

  if (meter.status !== 'PendingGM') {
    return c.json({ error: 'Meter is not pending GM review' }, 400)
  }

  const { data, error } = await supabase
    .from('meter_installations')
    .update({ status: 'PendingMD' })
    .eq('id', id)
    .select('*, facilities(name)')
    .single()

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  await addAuditEntry(id, user.id, user.fullName, user.role, 'Forwarded to MD for approval')

  const mdId = await getRoleId('MD')
  if (mdId) {
    await createNotification(
      mdId,
      'Meter pending approval',
      `Meter ${meter.official_meter_number} forwarded by GM, awaiting MD approval`,
      id
    )
  }

  return c.json(dbMeterToApi(data as DbMeter))
})

// GM rejects
meters.post('/:id/gm-reject', authMiddleware, requireRole('GM'), async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')
  const body = await c.req.json()
  const { reason } = body as { reason: string }

  if (!reason) {
    return c.json({ error: 'Rejection reason required' }, 400)
  }

  const { data: meter, error: fetchError } = await supabase
    .from('meter_installations')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !meter) {
    return c.json({ error: 'Meter not found' }, 404)
  }

  if (meter.status !== 'PendingGM') {
    return c.json({ error: 'Meter is not pending GM review' }, 400)
  }

  const { data, error } = await supabase
    .from('meter_installations')
    .update({ status: 'Rejected', rejection_reason: reason })
    .eq('id', id)
    .select('*, facilities(name)')
    .single()

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  await addAuditEntry(id, user.id, user.fullName, user.role, 'Rejected', reason)

  // Notify Secretary about rejection
  const secretaryId = await getRoleId('Secretary')
  if (secretaryId) {
    await createNotification(
      secretaryId,
      'Meter rejected by GM',
      `Meter ${meter.official_meter_number} rejected. Reason: ${reason}`,
      id
    )
  }

  return c.json(dbMeterToApi(data as DbMeter))
})

// MD approves (sends to IT)
meters.post('/:id/approve', authMiddleware, requireRole('MD'), async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')

  const { data: meter, error: fetchError } = await supabase
    .from('meter_installations')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !meter) {
    return c.json({ error: 'Meter not found' }, 404)
  }

  if (meter.status !== 'PendingMD') {
    return c.json({ error: 'Meter is not pending MD approval' }, 400)
  }

  const { data, error } = await supabase
    .from('meter_installations')
    .update({ status: 'PendingIT' })
    .eq('id', id)
    .select('*, facilities(name)')
    .single()

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  await addAuditEntry(id, user.id, user.fullName, user.role, 'Approved and forwarded to IT')

  const itId = await getRoleId('IT')
  if (itId) {
    await createNotification(
      itId,
      'Meter pending IT setup',
      `Meter ${meter.official_meter_number} approved by MD, awaiting IT profiling`,
      id
    )
  }

  return c.json(dbMeterToApi(data as DbMeter))
})

// MD rejects
meters.post('/:id/md-reject', authMiddleware, requireRole('MD'), async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')
  const body = await c.req.json()
  const { reason } = body as { reason: string }

  if (!reason) {
    return c.json({ error: 'Rejection reason required' }, 400)
  }

  const { data: meter, error: fetchError } = await supabase
    .from('meter_installations')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !meter) {
    return c.json({ error: 'Meter not found' }, 404)
  }

  if (meter.status !== 'PendingMD') {
    return c.json({ error: 'Meter is not pending MD approval' }, 400)
  }

  const { data, error } = await supabase
    .from('meter_installations')
    .update({ status: 'Rejected', rejection_reason: reason })
    .eq('id', id)
    .select('*, facilities(name)')
    .single()

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  await addAuditEntry(id, user.id, user.fullName, user.role, 'Rejected', reason)

  const secretaryId = await getRoleId('Secretary')
  if (secretaryId) {
    await createNotification(
      secretaryId,
      'Meter rejected by MD',
      `Meter ${meter.official_meter_number} rejected. Reason: ${reason}`,
      id
    )
  }

  return c.json(dbMeterToApi(data as DbMeter))
})

// IT completes (profiling + activation/clear/tamper codes)
meters.post('/:id/it-complete', authMiddleware, requireRole('IT'), async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')
  const body = await c.req.json()
  const { profileConfirmed, activationCode, clearCode, tamperCode, notes } = body as {
    profileConfirmed: boolean
    activationCode?: string
    clearCode?: string
    tamperCode?: string
    notes?: string
  }

  if (!activationCode && !clearCode && !tamperCode) {
    return c.json({ error: 'At least one code (activation, clear or tamper) is required' }, 400)
  }

  const { data: meter, error: fetchError } = await supabase
    .from('meter_installations')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !meter) {
    return c.json({ error: 'Meter not found' }, 404)
  }

  if (meter.status !== 'PendingIT') {
    return c.json({ error: 'Meter is not pending IT setup' }, 400)
  }

  const codesRecorded = [activationCode, clearCode, tamperCode].filter(Boolean).join(', ')

  const { data, error } = await supabase
    .from('meter_installations')
    .update({
      status: 'Completed',
      completed_at: new Date().toISOString(),
      profile_confirmed: profileConfirmed,
      activation_code: activationCode ?? null,
      clear_code: clearCode ?? null,
      tamper_code: tamperCode ?? null,
      it_notes: notes ?? null,
    })
    .eq('id', id)
    .select('*, facilities(name)')
    .single()

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  await addAuditEntry(
    id,
    user.id,
    user.fullName,
    user.role,
    `Job completed and closed. Codes recorded: ${codesRecorded}`,
    notes
  )

  // Notify the field technician who submitted the meter
  if (meter.created_by) {
    await createNotification(
      meter.created_by,
      'Job completed',
      `Meter ${meter.official_meter_number} is complete. Codes: ${codesRecorded}`,
      id
    )
  }

  // Also notify the field technician by name (inventory workflow)
  if (meter.field_technician_name) {
    const { data: tech } = await supabase
      .from('users')
      .select('id')
      .eq('full_name', meter.field_technician_name)
      .eq('role', 'FieldTechnician')
      .limit(1)
      .single()
    if (tech?.id && tech.id !== meter.created_by) {
      await createNotification(
        tech.id,
        'Job completed',
        `Meter ${meter.official_meter_number} is complete. Codes: ${codesRecorded}`,
        id
      )
    }
  }

  return c.json(dbMeterToApi(data as DbMeter))
})

// Resend to GM (after rejection)
meters.post('/:id/resend', authMiddleware, requireRole('Secretary'), async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')

  const { data: meter, error: fetchError } = await supabase
    .from('meter_installations')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !meter) {
    return c.json({ error: 'Meter not found' }, 404)
  }

  if (meter.status !== 'Rejected') {
    return c.json({ error: 'Only rejected meters can be resent' }, 400)
  }

  const { data, error } = await supabase
    .from('meter_installations')
    .update({ status: 'PendingGM', rejection_reason: null })
    .eq('id', id)
    .select('*, facilities(name)')
    .single()

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  await addAuditEntry(id, user.id, user.fullName, user.role, 'Resubmitted to GM after rejection')

  const gmId = await getRoleId('GM')
  if (gmId) {
    await createNotification(
      gmId,
      'Meter resubmitted',
      `Meter ${meter.official_meter_number} has been resubmitted by secretary for re-review`,
      id
    )
  }

  return c.json(dbMeterToApi(data as DbMeter))
})

export default meters
