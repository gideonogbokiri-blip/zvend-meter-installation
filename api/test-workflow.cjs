const BASE = 'https://zvend-meter-installation.onrender.com'

const auth = async (userId) => ({ Authorization: `Bearer ${userId}`, 'Content-Type': 'application/json' })

async function req(method, path, userId, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: await auth(userId),
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = text }
  return { status: res.status, json }
}

const SEC = 'a0000000-0000-0000-0000-000000000001'
const TECH = 'a0000000-0000-0000-0000-000000000002'
const GM = 'a0000000-0000-0000-0000-000000000003'
const MD = 'a0000000-0000-0000-0000-000000000004'
const IT = 'a0000000-0000-0000-0000-000000000005'
const FACILITY = 'b0000000-0000-0000-0000-000000000001'

const unique = `5810${String(Date.now()).slice(-7)}`

;(async () => {
console.log('=== STEP 1: scan a new meter (field tech) ===')
let r = await req('POST', '/api/meters/scan', TECH, {
  scannedMeterNumber: unique,
  facilityId: FACILITY,
  gpsLatitude: 5.55,
  gpsLongitude: -0.2,
  gpsAccuracy: 10,
  installationAddress: '12 Test Street, Kasoa',
  fieldTechnicianName: 'Kofi Asante',
  customerName: 'Test Customer',
  customerPhone: '0240000099',
})
console.log(r.status, r.json.error ?? r.json.id, r.json.status)
const meterId = r.json.id
const meterNum = r.json.officialMeterNumber

console.log('=== STEP 2: secretary confirms ===')
r = await req('POST', `/api/meters/${meterId}/confirm`, SEC)
console.log(r.status, r.json.status)

console.log('=== STEP 3: GM forwards ===')
r = await req('POST', `/api/meters/${meterId}/forward`, GM)
console.log(r.status, r.json.status)

console.log('=== STEP 4: MD approves ===')
r = await req('POST', `/api/meters/${meterId}/approve`, MD)
console.log(r.status, r.json.status)

console.log('=== STEP 5: IT completes with ONLY tamper code ===')
r = await req('POST', `/api/meters/${meterId}/it-complete`, IT, {
  profileConfirmed: true,
  tamperCode: 'TMP-112233',
  notes: 'Only tamper code entered',
})
console.log(r.status, r.json.status, 'tamper=', r.json.tamperCode, 'clear=', r.json.clearCode, 'completedAt=', r.json.completedAt)

console.log('=== STEP 6: verify codes visible via GET (field tech sees them) ===')
r = await req('GET', `/api/meters/${meterId}`, TECH)
console.log(r.status, 'activation=', r.json.activationCode, 'clear=', r.json.clearCode, 'tamper=', r.json.tamperCode)

console.log('=== STEP 7: secretary saves today daily record ===')
r = await req('POST', '/api/records', SEC, {})
console.log(r.status, r.json.error ?? `record ${r.json.id}`, 'meters=', (r.json.meters ?? []).length)

console.log('=== STEP 8: list daily records ===')
r = await req('GET', '/api/records', SEC)
console.log(r.status, 'count=', r.json.length)
const mine = r.json.find((rec) => rec.recordDate === new Date().toISOString().slice(0, 10))
console.log('today has meter?', mine ? mine.meters.some((m) => m.official_meter_number === meterNum) : 'no record')

console.log('=== STEP 9: profile update persists ===')
r = await req('PATCH', '/api/auth/profile', SEC, { fullName: 'Grace Mensah', phone: '0240000001' })
console.log(r.status, r.json.fullName, r.json.phone)

console.log('=== CLEANUP: delete test meter ===')
const supabase = (await import('@supabase/supabase-js')).createClient
const s = supabase('https://tmhpcxxkouzcazrwdqlm.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY)
const del = await s.from('meter_installations').delete().eq('id', meterId)
console.log('deleted', del.error ? del.error.message : 'ok')

// Delete the today daily record we created (test artifact)
const rec = await s.from('daily_records').select('id').eq('record_date', new Date().toISOString().slice(0, 10)).single()
if (rec.data) {
  const d2 = await s.from('daily_records').delete().eq('id', rec.data.id)
  console.log('record cleanup', d2.error ? d2.error.message : 'ok')
}

console.log('=== DONE ===')
})().catch((e) => { console.error('FATAL', e); process.exit(1) })