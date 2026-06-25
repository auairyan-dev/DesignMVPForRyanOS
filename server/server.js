import Fastify from 'fastify'
import { ACTION_ITEMS, INBOX } from '../src/data/seed/index.ts'

const app = Fastify({ logger: false })
const port = Number(process.env.PORT || 3001)

// Phase 2: in-memory action item overlay.
// Keyed by ActionItem.id. Status is "completed" or "snoozed".
// "snoozed" entries carry an `until` epoch-ms; we drop them once now() >= until.
// Restarting the process clears the overlay (intentional for v1; documented).
/** @type {Map<string, { status: 'completed' | 'snoozed', until?: number }>} */
const overlay = new Map()

const SNOOZE_DEFAULT_MIN = 60
const SNOOZE_MAX_MIN = 1440 // 24h

function applyOverlay(items) {
  const now = Date.now()
  return items.filter(item => {
    const entry = overlay.get(item.id)
    if (!entry) return true
    if (entry.status === 'completed') return false
    if (entry.status === 'snoozed') {
      if (typeof entry.until === 'number' && entry.until > now) return false
      // Snooze expired — drop the entry so it stops accumulating.
      overlay.delete(item.id)
      return true
    }
    return true
  })
}

function parseSnoozeMinutes(body) {
  if (body == null || typeof body !== 'object') return SNOOZE_DEFAULT_MIN
  const raw = body.minutes
  if (raw === undefined || raw === null) return SNOOZE_DEFAULT_MIN
  const n = Number(raw)
  if (!Number.isFinite(n)) return null
  if (n <= 0) return null
  if (n > SNOOZE_MAX_MIN) return null
  return n
}

app.get('/api/v1/health', async () => ({ ok: true }))

app.get('/api/v1/action-items', async () => applyOverlay(ACTION_ITEMS))

app.get('/api/v1/conversations', async () => INBOX)

app.post('/api/v1/action-items/:id/complete', async (req) => {
  const { id } = req.params
  const known = ACTION_ITEMS.some(it => it.id === id)
  overlay.set(id, { status: 'completed' })
  return { ok: true, id, status: 'completed', noop: !known }
})

app.post('/api/v1/action-items/:id/snooze', async (req, reply) => {
  const { id } = req.params
  const minutes = parseSnoozeMinutes(req.body)
  if (minutes === null) {
    reply.code(400)
    return {
      ok: false,
      error: 'invalid_minutes',
      message: `minutes must be a positive number <= ${SNOOZE_MAX_MIN}`,
    }
  }
  const known = ACTION_ITEMS.some(it => it.id === id)
  const until = Date.now() + Math.round(minutes * 60_000)
  overlay.set(id, { status: 'snoozed', until })
  return { ok: true, id, status: 'snoozed', until, minutes, noop: !known }
})

app.listen({ port, host: '0.0.0.0' })
  .then(() => console.log(`server listening on ${port}`))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
