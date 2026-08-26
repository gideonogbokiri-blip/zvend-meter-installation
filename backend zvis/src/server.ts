import 'dotenv/config'
import { serve } from '@hono/node-server'
import app from './index'

const port = Number(process.env.PORT) || 3000

console.log(`ZVIS Backend running on http://localhost:${port}`)

serve({ fetch: app.fetch, port })
