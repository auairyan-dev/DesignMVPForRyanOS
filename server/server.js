import Fastify from 'fastify'
import crypto from 'node:crypto'
import { ACTION_ITEMS, CUSTOMERS, INBOX, JOBS, QUOTES } from '../src/data/seed/index.ts'
import { dbPath } from './lib/db.js'
import {
  createBusiness,
  createOperator,
  deleteActionItemOverlay,
  findBusinessById,
  findOperatorByEmail,
  loadAllOverlays,
  saveActionItemOverlay,
  saveConversationMessage,
  saveConvertedJob,
  saveInvoice,
  saveInvoiceDraft,
  saveJobStatus,
  saveOutboxItem,
  saveQuoteStatus,
  createSendAttempt,
} from './lib/overlay-store.js'
import {
  buildInvoiceOutboxItem,
  isAllowedOutboxChannel,
  isAllowedOutboxKind,
  isAllowedOutboxStatus,
} from './lib/outbox.js'
import {
  executeTransportAttempt,
  isAllowedTransport,
} from './lib/transport.js'
import {
  createSession,
  destroySession,
  getCurrentOperator,
  getOperatorByEmail,
  hashPassword,
  requireOperator,
  verifyPassword,
} from './lib/auth.js'

const app = Fastify({ logger: false })
const port = Number(process.env.PORT || 3001)
const DEMO_BUSINESS_ID = 'biz-demo'
const DEMO_OPERATOR_EMAIL = process.env.RYANOS_OPERATOR_EMAIL || 'ryan@example.local'
const DEMO_OPERATOR_NAME = process.env.RYANOS_OPERATOR_NAME || 'Ryan'
const DEMO_OPERATOR_PASSWORD = process.env.RYANOS_OPERATOR_PASSWORD || 'ryanos-demo'

async function ensureDemoAuthSeed() {
  if (!findBusinessById(DEMO_BUSINESS_ID)) {
    createBusiness({
      businessId: DEMO_BUSINESS_ID,
      name: 'RyanOS Demo Business',
      mode: 'demo',
      createdAt: Date.now(),
    })
  }
  if (!findOperatorByEmail(DEMO_OPERATOR_EMAIL)) {
    const passwordHash = await hashPassword(DEMO_OPERATOR_PASSWORD)
    createOperator({
      operatorId: `op-${crypto.randomUUID()}`,
      businessId: DEMO_BUSINESS_ID,
      email: DEMO_OPERATOR_EMAIL,
      name: DEMO_OPERATOR_NAME,
      passwordHash,
      status: 'active',
      createdAt: Date.now(),
      lastLoginAt: null,
    })
    console.log(`[ryanos-demo-auth] created demo operator ${DEMO_OPERATOR_EMAIL} / ${DEMO_OPERATOR_PASSWORD} (demo-only)`)
  }
}

// Phase 2: in-memory action item overlay.
// Keyed by ActionItem.id. Status is "completed" or "snoozed".
// "snoozed" entries carry an `until` epoch-ms; we drop them once now() >= until.
// Restarting the process clears the overlay (intentional for v1; documented).
/** @type {Map<string, { status: 'completed' | 'snoozed', until?: number }>} */
const overlay = new Map()
const persisted = loadAllOverlays()
for (const [key, value] of persisted.actionItems) overlay.set(key, value)

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
      deleteActionItemOverlay(item.id)
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
const conversationOverlay = new Map(persisted.conversations)
let serverMessageCounter = 0
for (const messages of conversationOverlay.values()) {
  for (const message of messages) {
    const match = /^srv-\d+-(\d+)$/.exec(message.id)
    if (match) serverMessageCounter = Math.max(serverMessageCounter, Number(match[1]))
  }
}

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

// Phase 4: in-memory job status overlay.
// Keyed by Job.id; value is the new status string. Restarting the process
// clears the overlay. We never mutate the imported JOBS seed objects.
/** @type {Map<string, string>} */
const jobStatusOverlay = new Map(persisted.jobStatuses)

// Allowed status transitions for jobs. Pinned in this file as the protocol
// source of truth. Cancelled and Ready to invoice are terminal in this phase.
const ALLOWED_JOB_TRANSITIONS = new Map([
  ['New lead',     new Set(['Booked'])],
  ['Booked',       new Set(['Confirmed'])],
  ['Confirmed',    new Set(['In progress'])],
  ['In progress',  new Set(['Complete'])],
  ['Complete',     new Set(['Ready to invoice'])],
  ['Needs review', new Set(['Booked', 'Cancelled'])],
])

const KNOWN_JOB_STATUSES = new Set([
  'New lead', 'Booked', 'Confirmed', 'In progress',
  'Complete', 'Ready to invoice', 'Needs review', 'Cancelled',
])

function effectiveJobStatus(job) {
  const override = jobStatusOverlay.get(job.id)
  return override !== undefined ? override : job.status
}

function applyJobStatusOverlay(jobs) {
  return jobs.map(job => {
    const override = jobStatusOverlay.get(job.id)
    if (override === undefined || override === job.status) return job
    // Shallow-copy so the imported seed object stays untouched.
    return { ...job, status: override }
  })
}

function parseStatusBody(body) {
  if (body == null || typeof body !== 'object') return null
  const raw = body.status
  if (typeof raw !== 'string') return null
  const status = raw.trim()
  if (status.length === 0) return null
  if (!KNOWN_JOB_STATUSES.has(status)) return null
  return status
}

function isTransitionAllowed(from, to) {
  const allowed = ALLOWED_JOB_TRANSITIONS.get(from)
  if (!allowed) return false
  return allowed.has(to)
}

// Phase 5: in-memory quote-to-job conversion overlays.
// `convertedJobs` is keyed by quote id; value is the converted Job-shaped
// object (without any Phase 4 status overlay applied at storage time).
// `quoteStatusOverlay` is keyed by quote id; value is the overlaid status
// string (currently only used to record "Accepted" after conversion).
// Restarting the process clears both. We never mutate the imported JOBS,
// QUOTES, or CUSTOMERS seed objects.
/** @type {Map<string, object>} */
const convertedJobs = new Map(persisted.convertedJobs)
/** @type {Map<string, string>} */
const quoteStatusOverlay = new Map(persisted.quoteStatuses)

const CONVERTIBLE_QUOTE_STATUSES = new Set(['Accepted', 'Sent', 'Follow-up due'])
const CONVERT_FIELD_MAX_LEN = 64

function applyQuoteStatusOverlay(quotes) {
  return quotes.map(quote => {
    const override = quoteStatusOverlay.get(quote.id)
    if (override === undefined || override === quote.status) return quote
    return { ...quote, status: override }
  })
}

function parseConvertBody(body) {
  if (body === undefined || body === null) return { date: undefined, time: undefined }
  if (typeof body !== 'object') return null
  const out = { date: undefined, time: undefined }
  for (const key of ['date', 'time']) {
    const raw = body[key]
    if (raw === undefined || raw === null) continue
    if (typeof raw !== 'string') return null
    const trimmed = raw.trim()
    if (trimmed.length === 0) return null
    if (raw.length > CONVERT_FIELD_MAX_LEN) return null
    out[key] = trimmed
  }
  return out
}

function findCustomerSuburb(customerId) {
  if (!customerId) return '—'
  const c = CUSTOMERS.find(cu => cu.id === customerId)
  return (c && c.suburb) || '—'
}

function buildJobFromQuote(quote, opts) {
  const o = opts || {}
  return {
    id: `qj-${quote.id}`,
    title: quote.jobType,
    customer: quote.customer,
    customerId: quote.customerId,
    suburb: findCustomerSuburb(quote.customerId),
    address: '—',
    time: o.time || '—',
    date: o.date || 'Unscheduled',
    status: 'Booked',
    type: quote.jobType,
    value: quote.amount,
    tech: 'Unassigned',
    urgency: 'Normal',
    source: 'Quote',
    confidence: quote.confidence,
    aiNote: quote.aiReason,
  }
}

function overlaidConvertedJob(quoteId) {
  const base = convertedJobs.get(quoteId)
  if (!base) return null
  const override = jobStatusOverlay.get(base.id)
  if (override === undefined || override === base.status) return base
  return { ...base, status: override }
}

// Phase 6: in-memory invoice/payment overlay keyed by Job.id. This is an
// internal bookkeeping state machine only — no real invoice generation,
// delivery, payment collection, SMS, or email happens in this phase.
/** @type {Map<string, { jobId: string, invoiceId: string, status: 'draft' | 'sent' | 'paid' | 'overdue', amount: [number, number], note: string, createdAt: number, sentAt?: number, paidAt?: number }>} */
const invoiceOverlay = new Map(persisted.invoices)
/** @type {Map<string, { invoiceId: string, jobId: string, customerId?: string, customer: string, status: 'draft', lineItems: Array<{ id: string, label: string, qty: number, unitPrice: number, total: number }>, subtotal: number, total: number, notes: string, createdAt: number, updatedAt: number }>} */
const invoiceDrafts = new Map(persisted.invoiceDrafts)
/** @type {Map<string, { outboxId: string, jobId: string, invoiceId: string | null, customerId: string | null, customer: string, kind: 'invoice', channel: 'email', status: 'draft' | 'ready', subject: string | null, body: string, notes: string, createdAt: number, updatedAt: number, approvedAt: number | null }>} */
const outboxItems = new Map(persisted.outboxItems)
/** @type {Map<string, { attemptId: string, outboxId: string, jobId: string, invoiceId: string | null, customerId: string | null, customer: string, kind: 'invoice', channel: 'email', transport: 'mock', status: 'dry-run' | 'failed', target: string | null, subject: string | null, body: string, notes: string, requestedByOperatorId: string, requestedByName: string, approvedByOperatorId: string | null, approvedByName: string | null, approvedAt: number | null, createdAt: number, updatedAt: number, attemptedAt: number | null, failedAt: number | null, providerMessageId: string | null, providerStatus: string | null, providerErrorCode: string | null, providerErrorMessage: string | null, dryRun: boolean }>} */
const sendAttempts = new Map(persisted.sendAttempts)

const KNOWN_INVOICE_STATUSES = new Set(['draft', 'sent', 'paid', 'overdue'])
const ALLOWED_INVOICE_TRANSITIONS = new Map([
  ['draft', new Set(['sent'])],
  ['sent', new Set(['paid', 'overdue'])],
  ['overdue', new Set(['paid'])],
])

function findJobById(id) {
  const seedJob = JOBS.find(j => j.id === id)
  if (seedJob) return seedJob
  return [...convertedJobs.values()].find(j => j.id === id) || null
}

function parseInvoiceStatusBody(body) {
  if (body == null || typeof body !== 'object') return null
  const raw = body.status
  if (typeof raw !== 'string') return null
  const status = raw.trim()
  if (!KNOWN_INVOICE_STATUSES.has(status)) return null
  return status
}

function buildInvoiceNote(job, invoice) {
  const base = `${job.title} · ${job.date} · ${job.time} · ${job.value[0]}–${job.value[1]}`
  if (invoice.status === 'draft') return `${base} · Invoice draft created`
  if (invoice.status === 'sent') return `${base} · Invoice marked as sent`
  if (invoice.status === 'paid') return `${base} · Payment marked as paid`
  return `${base} · Payment marked as overdue`
}

function projectConversationPayment(conversation) {
  if (!conversation.linkedJobId) return conversation
  const invoice = invoiceOverlay.get(conversation.linkedJobId)
  if (!invoice) return conversation
  const job = findJobById(conversation.linkedJobId)
  if (!job) return conversation
  const paymentStatus = invoice.status === 'draft'
    ? 'ready-to-invoice'
    : invoice.status === 'sent'
      ? 'invoice-sent'
      : invoice.status === 'paid'
        ? 'paid'
        : 'overdue'
  const currentStage = invoice.status === 'paid'
    ? 'Paid'
    : invoice.status === 'overdue'
      ? 'Overdue'
      : invoice.status === 'sent'
        ? 'Invoice sent'
        : 'Invoice draft'
  const nextAction = invoice.status === 'draft'
    ? 'Review the draft and mark it as sent when you are ready.'
    : invoice.status === 'sent'
      ? 'Wait for payment or mark this invoice as overdue later if needed.'
      : invoice.status === 'paid'
        ? 'Payment is recorded internally. No external action has been taken by RyanOS.'
        : 'Follow up manually outside RyanOS if needed, or mark payment as paid when received.'
  return {
    ...conversation,
    journey: {
      ...conversation.journey,
      currentStage,
      nextAction,
      paymentStatus,
      paymentNote: buildInvoiceNote(job, invoice),
    },
  }
}

function applyConversationPaymentOverlay(conversations) {
  return conversations.map(projectConversationPayment)
}

function effectiveInvoiceStatus(jobId) {
  const invoice = invoiceOverlay.get(jobId)
  return invoice ? invoice.status : null
}

function getInvoiceDraftByJobId(jobId) {
  return invoiceDrafts.get(jobId) || null
}

function createInvoiceDraftFromJob(job) {
  const existing = getInvoiceDraftByJobId(job.id)
  if (existing) return existing
  const selectedDraftAmount = Array.isArray(job.value) ? job.value[1] : 0
  const now = Date.now()
  const lineLabel = job.type || job.title || 'Trade service'
  const draft = {
    invoiceId: `inv-${job.id}`,
    jobId: job.id,
    customerId: job.customerId || undefined,
    customer: job.customer,
    status: 'draft',
    lineItems: [
      {
        id: 'li-1',
        label: lineLabel,
        qty: 1,
        unitPrice: selectedDraftAmount,
        total: selectedDraftAmount,
      },
    ],
    subtotal: selectedDraftAmount,
    total: selectedDraftAmount,
    notes: 'Internal draft only. Review before sending. Not delivered by RyanOS.',
    createdAt: now,
    updatedAt: now,
  }
  invoiceDrafts.set(job.id, draft)
  saveInvoiceDraft(draft)
  return draft
}

function hasSeedReadyToInvoiceConversation(jobId) {
  return INBOX.some(conv => conv.linkedJobId === jobId && conv.journey?.paymentStatus === 'ready-to-invoice')
}

function listOutboxItemsByJobId(jobId) {
  return [...outboxItems.values()].filter(item => item.jobId === jobId)
}

function getOutboxItemById(outboxId) {
  return outboxItems.get(outboxId) || null
}

function listSendAttemptsByOutboxId(outboxId) {
  return [...sendAttempts.values()].filter(attempt => attempt.outboxId === outboxId)
}

function getSendAttemptById(id) {
  return sendAttempts.get(id) || null
}

function createOrGetOutboxItem(job, invoiceDraft, kind, channel) {
  const existing = listOutboxItemsByJobId(job.id).find(item => item.kind === kind && item.channel === channel)
  if (existing) return { item: existing, idempotent: true, noop: true }
  const item = buildInvoiceOutboxItem(job, invoiceDraft)
  outboxItems.set(item.outboxId, item)
  saveOutboxItem(item)
  return { item, idempotent: false, noop: false }
}

function isInvoiceTransitionAllowed(from, to) {
  if (from === null) return to === 'draft'
  const allowed = ALLOWED_INVOICE_TRANSITIONS.get(from)
  if (!allowed) return false
  return allowed.has(to)
}

function operatorResponse(operator) {
  if (!operator) return null
  return {
    operatorId: operator.operatorId,
    businessId: operator.businessId,
    email: operator.email,
    name: operator.name,
  }
}

app.get('/api/v1/health', async () => ({ ok: true }))

app.get('/api/v1/me', async (req) => {
  const operator = getCurrentOperator(req)
  return { ok: true, operator: operatorResponse(operator) }
})

app.post('/api/v1/login', async (req, reply) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  const operator = email ? getOperatorByEmail(email) : null
  if (!operator || operator.status !== 'active') {
    reply.code(401)
    return { ok: false, error: 'invalid_credentials' }
  }
  const ok = await verifyPassword(password, operator.passwordHash)
  if (!ok) {
    reply.code(401)
    return { ok: false, error: 'invalid_credentials' }
  }
  await createSession(reply, operator)
  return { ok: true, operator: operatorResponse(operator) }
})

app.post('/api/v1/logout', async (req, reply) => {
  destroySession(req, reply)
  return { ok: true }
})

app.get('/api/v1/action-items', async () => applyOverlay(ACTION_ITEMS))

app.get('/api/v1/conversations', async () => {
  const withMessages = applyConversationOverlay(INBOX)
  return applyConversationPaymentOverlay(withMessages)
})

app.get('/api/v1/jobs', async () => {
  const seedWithStatus = applyJobStatusOverlay(JOBS)
  const extras = []
  for (const quoteId of convertedJobs.keys()) {
    const job = overlaidConvertedJob(quoteId)
    if (job) extras.push(job)
  }
  return [...seedWithStatus, ...extras]
})

app.get('/api/v1/quotes', async () => applyQuoteStatusOverlay(QUOTES))

app.post('/api/v1/action-items/:id/complete', async (req, reply) => {
  const operator = requireOperator(req, reply)
  if (!operator || reply.statusCode === 401) return { ok: false, error: 'auth_required' }
  const { id } = req.params
  const known = ACTION_ITEMS.some(it => it.id === id)
  overlay.set(id, { status: 'completed' })
  saveActionItemOverlay(id, { status: 'completed' })
  return { ok: true, id, status: 'completed', noop: !known }
})

app.post('/api/v1/action-items/:id/snooze', async (req, reply) => {
  const operator = requireOperator(req, reply)
  if (!operator || reply.statusCode === 401) return { ok: false, error: 'auth_required' }
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
  saveActionItemOverlay(id, { status: 'snoozed', until })
  return { ok: true, id, status: 'snoozed', until, minutes, noop: !known }
})

app.post('/api/v1/conversations/:id/messages', async (req, reply) => {
  const operator = requireOperator(req, reply)
  if (!operator || reply.statusCode === 401) return { ok: false, error: 'auth_required' }
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
  saveConversationMessage(id, message)
  return { ok: true, conversationId: id, message, noop: false }
})

app.post('/api/v1/jobs/:id/status', async (req, reply) => {
  const operator = requireOperator(req, reply)
  if (!operator || reply.statusCode === 401) return { ok: false, error: 'auth_required' }
  const { id } = req.params
  const status = parseStatusBody(req.body)
  if (status === null) {
    reply.code(400)
    return {
      ok: false,
      error: 'invalid_status',
      message: 'status must be one of the known job status strings',
    }
  }
  const job = findJobById(id)
  if (!job) {
    return { ok: true, id, from: null, to: status, job: null, noop: true }
  }
  const from = effectiveJobStatus(job)
  if (from === status) {
    return { ok: true, id, from, to: status, job: { ...job, status }, noop: true }
  }
  if (!isTransitionAllowed(from, status)) {
    reply.code(400)
    return {
      ok: false,
      error: 'invalid_transition',
      message: `cannot move job from "${from}" to "${status}"`,
      from,
      to: status,
    }
  }
  jobStatusOverlay.set(id, status)
  saveJobStatus(id, status)
  return { ok: true, id, from, to: status, job: { ...job, status }, noop: false }
})

app.post('/api/v1/quotes/:id/convert-to-job', async (req, reply) => {
  const operator = requireOperator(req, reply)
  if (!operator || reply.statusCode === 401) return { ok: false, error: 'auth_required' }
  const { id } = req.params
  const parsed = parseConvertBody(req.body)
  if (parsed === null) {
    reply.code(400)
    return {
      ok: false,
      error: 'invalid_body',
      message: `date/time must be optional non-empty strings up to ${CONVERT_FIELD_MAX_LEN} chars`,
    }
  }
  const quote = QUOTES.find(q => q.id === id)
  if (!quote) {
    return { ok: true, quoteId: id, quote: null, job: null, idempotent: false, noop: true }
  }
  if (convertedJobs.has(id)) {
    const job = overlaidConvertedJob(id)
    const overlaidQuote = applyQuoteStatusOverlay([quote])[0]
    return { ok: true, quoteId: id, quote: overlaidQuote, job, idempotent: true, noop: true }
  }
  const effectiveQuoteStatus = quoteStatusOverlay.get(id) ?? quote.status
  if (!CONVERTIBLE_QUOTE_STATUSES.has(effectiveQuoteStatus)) {
    reply.code(400)
    return {
      ok: false,
      error: 'invalid_quote_status',
      message: `quote status "${effectiveQuoteStatus}" is not convertible`,
      status: effectiveQuoteStatus,
    }
  }
  const job = buildJobFromQuote(quote, parsed)
  convertedJobs.set(id, job)
  quoteStatusOverlay.set(id, 'Accepted')
  saveConvertedJob(id, job)
  saveQuoteStatus(id, 'Accepted')
  const overlaidQuote = applyQuoteStatusOverlay([quote])[0]
  return { ok: true, quoteId: id, quote: overlaidQuote, job, idempotent: false, noop: false }
})

app.get('/api/v1/jobs/:id/invoice-draft', async (req) => {
  const { id } = req.params
  const job = findJobById(id)
  if (!job) {
    return { ok: true, draft: null, noop: true }
  }
  const draft = getInvoiceDraftByJobId(id)
  return { ok: true, draft }
})

app.get('/api/v1/jobs/:id/outbox', async (req) => {
  const { id } = req.params
  const job = findJobById(id)
  if (!job) {
    return { ok: true, items: [], noop: true }
  }
  return { ok: true, items: listOutboxItemsByJobId(id) }
})

app.post('/api/v1/jobs/:id/outbox', async (req, reply) => {
  const operator = requireOperator(req, reply)
  if (!operator || reply.statusCode === 401) return { ok: false, error: 'auth_required' }
  const { id } = req.params
  const job = findJobById(id)
  if (!job) {
    return { ok: true, item: null, idempotent: false, noop: true }
  }
  const kind = req.body?.kind
  const channel = req.body?.channel
  if (!isAllowedOutboxKind(kind) || !isAllowedOutboxChannel(channel)) {
    reply.code(400)
    return {
      ok: false,
      error: 'invalid_outbox_request',
      message: 'kind must be "invoice" and channel must be "email"',
    }
  }
  const invoiceDraft = getInvoiceDraftByJobId(id)
  if (!invoiceDraft) {
    reply.code(400)
    return {
      ok: false,
      error: 'missing_invoice_draft',
      message: 'invoice draft must exist before preparing an outbox item',
    }
  }
  const result = createOrGetOutboxItem(job, invoiceDraft, kind, channel)
  return { ok: true, item: result.item, idempotent: result.idempotent, noop: result.noop }
})

app.post('/api/v1/outbox/:id/ready', async (req, reply) => {
  const operator = requireOperator(req, reply)
  if (!operator || reply.statusCode === 401) return { ok: false, error: 'auth_required' }
  const { id } = req.params
  const item = getOutboxItemById(id)
  if (!item) {
    return { ok: true, item: null, from: null, to: 'ready', noop: true }
  }
  if (!isAllowedOutboxStatus(item.status)) {
    reply.code(400)
    return {
      ok: false,
      error: 'invalid_outbox_status',
      message: 'outbox item has an unsupported status',
    }
  }
  if (item.status === 'ready') {
    return { ok: true, item, from: 'ready', to: 'ready', noop: true }
  }
  const now = Date.now()
  const updated = {
    ...item,
    status: 'ready',
    updatedAt: now,
    approvedAt: now,
    approvedByOperatorId: operator.operatorId,
    approvedByName: operator.name,
  }
  outboxItems.set(id, updated)
  saveOutboxItem(updated)
  return { ok: true, item: updated, from: 'draft', to: 'ready', noop: false }
})

app.get('/api/v1/outbox/:id/attempts', async (req, reply) => {
  const operator = requireOperator(req, reply)
  if (!operator || reply.statusCode === 401) return { ok: false, error: 'auth_required' }
  const { id } = req.params
  const item = getOutboxItemById(id)
  if (!item) {
    return { ok: true, attempts: [], noop: true }
  }
  return { ok: true, attempts: listSendAttemptsByOutboxId(id) }
})

app.post('/api/v1/outbox/:id/attempt-send', async (req, reply) => {
  const operator = requireOperator(req, reply)
  if (!operator || reply.statusCode === 401) return { ok: false, error: 'auth_required' }
  const { id } = req.params
  const item = getOutboxItemById(id)
  if (!item) {
    return { ok: true, attempt: null, noop: true }
  }
  const transport = typeof req.body?.transport === 'string' ? req.body.transport.trim() : 'mock'
  if (!isAllowedTransport(transport)) {
    reply.code(400)
    return {
      ok: false,
      error: 'invalid_transport',
      message: 'transport must be "mock" in Phase 11',
    }
  }
  if (item.status !== 'ready' || !item.approvedAt || !item.approvedByOperatorId || !item.approvedByName) {
    reply.code(400)
    return {
      ok: false,
      error: 'outbox_not_ready',
      message: 'outbox item must be marked ready before a send attempt can be created',
    }
  }
  const now = Date.now()
  const draftAttempt = {
    attemptId: `att-${crypto.randomUUID()}`,
    outboxId: item.outboxId,
    jobId: item.jobId,
    invoiceId: item.invoiceId ?? null,
    customerId: item.customerId ?? null,
    customer: item.customer,
    kind: item.kind,
    channel: item.channel,
    transport: 'mock',
    status: 'dry-run',
    target: null,
    subject: item.subject ?? null,
    body: item.body,
    notes: 'Dry-run only. Not delivered by RyanOS.',
    requestedByOperatorId: operator.operatorId,
    requestedByName: operator.name,
    approvedByOperatorId: item.approvedByOperatorId ?? null,
    approvedByName: item.approvedByName ?? null,
    approvedAt: item.approvedAt ?? null,
    createdAt: now,
    updatedAt: now,
    attemptedAt: null,
    failedAt: null,
    providerMessageId: null,
    providerStatus: null,
    providerErrorCode: null,
    providerErrorMessage: null,
    dryRun: true,
  }
  const result = executeTransportAttempt(draftAttempt)
  const attempt = {
    ...draftAttempt,
    status: result.status,
    notes: result.notes,
    updatedAt: Date.now(),
    attemptedAt: result.attemptedAt,
    failedAt: result.failedAt,
    providerMessageId: result.providerMessageId,
    providerStatus: result.providerStatus,
    providerErrorCode: result.providerErrorCode,
    providerErrorMessage: result.providerErrorMessage,
    dryRun: result.dryRun,
  }
  sendAttempts.set(attempt.attemptId, attempt)
  createSendAttempt(attempt)
  return { ok: true, attempt }
})

app.post('/api/v1/jobs/:id/invoice-status', async (req, reply) => {
  const operator = requireOperator(req, reply)
  if (!operator || reply.statusCode === 401) return { ok: false, error: 'auth_required' }
  const { id } = req.params
  const status = parseInvoiceStatusBody(req.body)
  if (status === null) {
    reply.code(400)
    return {
      ok: false,
      error: 'invalid_invoice_status',
      message: 'status must be one of: draft, sent, paid, overdue',
    }
  }
  const job = findJobById(id)
  if (!job) {
    return { ok: true, id, invoice: null, draft: null, from: null, to: status, noop: true }
  }
  const existing = invoiceOverlay.get(id)
  const from = effectiveInvoiceStatus(id)
  const jobReady = effectiveJobStatus(job) === 'Ready to invoice'
  const seedReady = hasSeedReadyToInvoiceConversation(id)
  if (!existing && !jobReady && !seedReady) {
    reply.code(400)
    return {
      ok: false,
      error: 'invalid_invoice_transition',
      message: 'job must be Ready to invoice before invoice workflow can start',
      from,
      to: status,
    }
  }
  if (from === status) {
    return { ok: true, id, invoice: existing, draft: getInvoiceDraftByJobId(id), from, to: status, noop: true }
  }
  if (!isInvoiceTransitionAllowed(from, status)) {
    reply.code(400)
    return {
      ok: false,
      error: 'invalid_invoice_transition',
      message: `cannot move invoice from "${from ?? 'none'}" to "${status}"`,
      from,
      to: status,
    }
  }
  const now = Date.now()
  let draft = getInvoiceDraftByJobId(id)
  if (status === 'draft') {
    draft = createInvoiceDraftFromJob(job)
  }
  const invoice = {
    jobId: id,
    invoiceId: `inv-${id}`,
    status,
    amount: job.value,
    note: '',
    createdAt: existing?.createdAt ?? now,
    sentAt: status === 'sent' ? now : existing?.sentAt,
    paidAt: status === 'paid' ? now : existing?.paidAt,
  }
  invoice.note = buildInvoiceNote(job, invoice)
  invoiceOverlay.set(id, invoice)
  saveInvoice(invoice)
  if (draft) {
    const updatedDraft = {
      ...draft,
      updatedAt: now,
    }
    invoiceDrafts.set(id, updatedDraft)
    saveInvoiceDraft(updatedDraft)
    draft = updatedDraft
  }
  return { ok: true, id, invoice, draft: draft ?? null, from, to: status, noop: false }
})

await ensureDemoAuthSeed()

app.listen({ port, host: '0.0.0.0' })
  .then(() => console.log(`server listening on ${port} (db: ${dbPath})`))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
