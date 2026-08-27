import 'dotenv/config'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import auth from './routes/auth.js'
import facilities from './routes/facilities.js'
import meters from './routes/meters.js'
import audit from './routes/audit.js'
import notifications from './routes/notifications.js'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({
  origin: [
    'https://zvend-frontend.vercel.app',
    'https://zvend-meter-installation.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

app.get('/', (c) => {
  return c.json({ status: 'ok', service: 'ZVIS Backend', version: '1.0.0' })
})

app.route('/api/auth', auth)
app.route('/api/facilities', facilities)
app.route('/api/meters', meters)
app.route('/api/audit', audit)
app.route('/api/notifications', notifications)

app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404)
})

app.onError((err, c) => {
  console.error('Unhandled error:', err)
  const message = err instanceof Error ? err.message : 'Internal server error'
  return c.json({ error: message }, 500)
})

export default app
