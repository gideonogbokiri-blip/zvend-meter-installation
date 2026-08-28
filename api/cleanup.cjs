require('dotenv').config()
const s = require('@supabase/supabase-js').createClient('https://tmhpcxxkouzcazrwdqlm.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY)

;(async () => {
  // delete the 2040 test record
  const d1 = await s.from('daily_records').delete().eq('record_date', '2040-01-01')
  console.log('test 2040 deleted:', d1.error ? d1.error.message : 'ok')
  // delete today's record + test meter
  const d2 = await s.from('daily_records').delete().eq('record_date', '2026-08-28')
  console.log('today record deleted:', d2.error ? d2.error.message : 'ok')
  const d3 = await s.from('meter_installations').delete().eq('official_meter_number', '58101064273')
  console.log('test meter deleted:', d3.error ? d3.error.message : 'ok')
})().catch((e) => { console.error('FATAL', e); process.exit(1) })