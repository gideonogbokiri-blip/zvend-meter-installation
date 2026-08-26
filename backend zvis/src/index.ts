import 'dotenv/config'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import auth from './routes/auth'
import facilities from './routes/facilities'
import meters from './routes/meters'
import audit from './routes/audit'
import notifications from './routes/notifications'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Health check
app.get('/', (c) => {
  return c.json({ status: 'ok', service: 'ZVIS Backend', version: '1.0.0' })
})

// Routes
app.route('/api/auth', auth)
app.route('/api/facilities', facilities)
app.route('/api/meters', meters)
app.route('/api/audit', audit)
app.route('/api/notifications', notifications)

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

const port = Number(process.env.PORT) || 3000

console.log(`ZVIS Backend running on http://localhost:${port}`)

serve({ fetch: app.fetch, port })

export default app
