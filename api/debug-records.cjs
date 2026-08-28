require('dotenv').config()
const s = require('@supabase/supabase-js').createClient('https://tmhpcxxkouzcazrwdqlm.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY)

;(async () => {
  const { data, error } = await s.from('daily_records').select('record_date, meters').order('record_date', { ascending: false }).limit(1).single()
  console.log('raw meters value:', data && data.meters)
  console.log('type:', data && typeof data.meters)
  if (data && typeof data.meters === 'string') {
    try { const parsed = JSON.parse(data.meters); console.log('parsed length:', parsed.length, Array.isArray(parsed)) } catch (e) { console.log('parse fail', e.message) }
  }
})().catch((e) => { console.error('FATAL', e); process.exit(1) })