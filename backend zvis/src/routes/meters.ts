import { Hono } from 'hono'
import { supabase } from '../lib/supabase'
import { authMiddleware, requireRole } from '../middleware/auth'
import { isValidMeterNumber, normalizeMeterNumber } from '../lib/helpers'
import type { AppEnv } from '../env'
import type { MeterStatus, Role } from '../types'

const meters = new Hono<AppEnv>()

interface DbMeter {
  id: string
  official_meter_number: string
  facility_id: string
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
    facilityId: m.facility_id,
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

// Submit new scan (FieldTechnician only)
meters.post('/scan', authMiddleware, requireRole('FieldTechnician'), async (c) => {
  const user = c.get('user')
  const body = await c.req.json()

  const {
    scannedMeterNumber,
    facilityId,
    gpsLatitude,
    gpsLongitude,
    gpsAccuracy,
    installationAddress,
    fieldTechnicianName,
    customerName,
    customerPhone,
  } = body as {
    scannedMeterNumber: string
    facilityId: string
    gpsLatitude: number
    gpsLongitude: number
    gpsAccuracy?: number
    installationAddress: string
    fieldTechnicianName: string
    customerName: string
    customerPhone: string
  }

  const meterNum = normalizeMeterNumber(scannedMeterNumber)
  if (!isValidMeterNumber(meterNum)) {
    return c.json(
      { error: 'Invalid meter number. Must be 5810XXXXXXXX (11 digits)' },
      400
    )
  }

  if (!facilityId || !installationAddress || !customerName || !customerPhone) {
    return c.json({ error: 'Missing required fields' }, 400)
  }

  // Check for duplicate meter number
  const { data: existing } = await supabase
    .from('meter_installations')
    .select('id')
    .eq('official_meter_number', meterNum)
    .single()

  if (existing) {
    return c.json({ error: 'Meter number already registered' }, 409)
  }

  const { data, error } = await supabase
    .from('meter_installations')
    .insert({
      official_meter_number: meterNum,
      facility_id: facilityId,
      status: 'PendingSecretaryConfirm',
      scanned_meter_number: meterNum,
      gps_latitude: gpsLatitude,
      gps_longitude: gpsLongitude,
      gps_accuracy: gpsAccuracy ?? null,
      installation_address: installationAddress,
      field_technician_name: fieldTechnicianName,
      customer_name: customerName,
      customer_phone: customerPhone,
      created_by: user.id,
    })
    .select('*, facilities(name)')
    .single()

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  await addAuditEntry(data.id, user.id, user.fullName, user.role, 'Meter scanned and submitted')

  // Notify Secretary
  const secretaryId = await getRoleId('Secretary')
  if (secretaryId) {
    await createNotification(
      secretaryId,
      'New meter submission',
      `${fieldTechnicianName} submitted meter ${meterNum} for review`,
      data.id
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

// IT completes (profiling + activation code)
meters.post('/:id/it-complete', authMiddleware, requireRole('IT'), async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')
  const body = await c.req.json()
  const { profileConfirmed, activationCode, notes } = body as {
    profileConfirmed: boolean
    activationCode: string
    notes?: string
  }

  if (!activationCode) {
    return c.json({ error: 'Activation code required' }, 400)
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

  const { data, error } = await supabase
    .from('meter_installations')
    .update({
      status: 'PendingClosure',
      profile_confirmed: profileConfirmed,
      activation_code: activationCode,
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
    `IT profiling complete. Profile confirmed: ${profileConfirmed}`,
    notes
  )

  const secretaryId = await getRoleId('Secretary')
  if (secretaryId) {
    await createNotification(
      secretaryId,
      'Meter ready for closure',
      `Meter ${meter.official_meter_number} IT setup complete. Ready for final closure.`,
      id
    )
  }

  return c.json(dbMeterToApi(data as DbMeter))
})

// Secretary closes the job
meters.post('/:id/close', authMiddleware, requireRole('Secretary'), async (c) => {
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

  if (meter.status !== 'PendingClosure') {
    return c.json({ error: 'Meter is not pending closure' }, 400)
  }

  const { data, error } = await supabase
    .from('meter_installations')
    .update({ status: 'Completed' })
    .eq('id', id)
    .select('*, facilities(name)')
    .single()

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  await addAuditEntry(id, user.id, user.fullName, user.role, 'Job completed and closed')

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
