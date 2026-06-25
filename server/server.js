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

// Phase 3: in-memory conversation message overlay.
// Keyed by Conversation.id; value is an array of server-appended InboxMsg.
// Restarting the process clears the overlay (intentional for v1; documented).
// We never mutate the imported INBOX seed objects.
/** @type {Map<string, Array<{ id: string, from: 'ai' | 'customer' | 'system', text: string, time: string }>>} */
const conversationOverlay = new Map()
let serverMessageCounter = 0

const MESSAGE_MAX_LEN = 4000

function applyConversationOverlay(conversations) {
  return conversations.map(conv => {
    const extras = conversationOverlay.get(conv.id)
    if (!extras || extras.length === 0) return conv
    // Shallow-copy the conversation; rebuild messages array without mutating
    // the original seed object or the original messages array.
    return { ...conv, messages: [...conv.messages, ...extras] }
  })
}

function parseMessageBody(body) {
  if (body == null || typeof body !== 'object') return null
  const rawText = body.text
  if (typeof rawText !== 'string') return null
  const text = rawText.trim()
  if (text.length === 0) return null
  if (rawText.length > MESSAGE_MAX_LEN) return null
  // Phase 3: ignore client-supplied "from" to prevent impersonation before
  // auth lands. All owner-typed messages are stored as "customer" to match
  // existing demo behaviour.
  return { text, from: 'customer' }
}

function nextServerMessageId() {
  serverMessageCounter += 1
  return `srv-${Date.now()}-${serverMessageCounter}`
}

app.get('/api/v1/health', async () => ({ ok: true }))

app.get('/api/v1/action-items', async () => applyOverlay(ACTION_ITEMS))

app.get('/api/v1/conversations', async () => applyConversationOverlay(INBOX))

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

app.post('/api/v1/conversations/:id/messages', async (req, reply) => {
  const { id } = req.params
  const parsed = parseMessageBody(req.body)
  if (parsed === null) {
    reply.code(400)
    return {
      ok: false,
      error: 'invalid_text',
      message: `text must be a non-empty string up to ${MESSAGE_MAX_LEN} characters`,
    }
  }
  const known = INBOX.some(c => c.id === id)
  if (!known) {
    return { ok: true, conversationId: id, message: null, noop: true }
  }
  const message = {
    id: nextServerMessageId(),
    from: parsed.from,
    text: parsed.text,
    time: 'Just now',
  }
  const existing = conversationOverlay.get(id)
  if (existing) existing.push(message)
  else conversationOverlay.set(id, [message])
  return { ok: true, conversationId: id, message, noop: false }
})

app.listen({ port, host: '0.0.0.0' })
  .then(() => console.log(`server listening on ${port}`))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
