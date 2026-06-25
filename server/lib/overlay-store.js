import { db } from './db.js'

const loadActionItemRows = db.prepare(`
  SELECT action_item_id, status, until_ms
  FROM action_item_overlay
`)
const upsertActionItemRow = db.prepare(`
  INSERT INTO action_item_overlay (action_item_id, status, until_ms)
  VALUES (@action_item_id, @status, @until_ms)
  ON CONFLICT(action_item_id) DO UPDATE SET
    status = excluded.status,
    until_ms = excluded.until_ms
`)
const deleteActionItemRow = db.prepare(`
  DELETE FROM action_item_overlay
  WHERE action_item_id = ?
`)

const loadConversationRows = db.prepare(`
  SELECT conversation_id, message_id, sender, text, time_label, created_at_ms
  FROM conversation_messages
  ORDER BY created_at_ms ASC, message_id ASC
`)
const insertConversationRow = db.prepare(`
  INSERT INTO conversation_messages (conversation_id, message_id, sender, text, time_label, created_at_ms)
  VALUES (@conversation_id, @message_id, @sender, @text, @time_label, @created_at_ms)
`)

const loadJobStatusRows = db.prepare(`
  SELECT job_id, status
  FROM job_status_overlay
`)
const upsertJobStatusRow = db.prepare(`
  INSERT INTO job_status_overlay (job_id, status)
  VALUES (@job_id, @status)
  ON CONFLICT(job_id) DO UPDATE SET
    status = excluded.status
`)

const loadConvertedJobRows = db.prepare(`
  SELECT quote_id, job_json
  FROM converted_jobs
`)
const upsertConvertedJobRow = db.prepare(`
  INSERT INTO converted_jobs (quote_id, job_id, job_json)
  VALUES (@quote_id, @job_id, @job_json)
  ON CONFLICT(quote_id) DO UPDATE SET
    job_id = excluded.job_id,
    job_json = excluded.job_json
`)

const loadQuoteStatusRows = db.prepare(`
  SELECT quote_id, status
  FROM quote_status_overlay
`)
const upsertQuoteStatusRow = db.prepare(`
  INSERT INTO quote_status_overlay (quote_id, status)
  VALUES (@quote_id, @status)
  ON CONFLICT(quote_id) DO UPDATE SET
    status = excluded.status
`)

const loadInvoiceRows = db.prepare(`
  SELECT job_id, invoice_id, status, amount_min, amount_max, note, created_at_ms, sent_at_ms, paid_at_ms
  FROM invoice_overlay
`)
const upsertInvoiceRow = db.prepare(`
  INSERT INTO invoice_overlay (job_id, invoice_id, status, amount_min, amount_max, note, created_at_ms, sent_at_ms, paid_at_ms)
  VALUES (@job_id, @invoice_id, @status, @amount_min, @amount_max, @note, @created_at_ms, @sent_at_ms, @paid_at_ms)
  ON CONFLICT(job_id) DO UPDATE SET
    invoice_id = excluded.invoice_id,
    status = excluded.status,
    amount_min = excluded.amount_min,
    amount_max = excluded.amount_max,
    note = excluded.note,
    created_at_ms = excluded.created_at_ms,
    sent_at_ms = excluded.sent_at_ms,
    paid_at_ms = excluded.paid_at_ms
`)

export function loadAllOverlays() {
  const actionItems = new Map()
  for (const row of loadActionItemRows.all()) {
    actionItems.set(row.action_item_id, {
      status: row.status,
      until: row.until_ms ?? undefined,
    })
  }

  const conversations = new Map()
  for (const row of loadConversationRows.all()) {
    const message = {
      id: row.message_id,
      from: row.sender,
      text: row.text,
      time: row.time_label,
    }
    const existing = conversations.get(row.conversation_id)
    if (existing) existing.push(message)
    else conversations.set(row.conversation_id, [message])
  }

  const jobStatuses = new Map()
  for (const row of loadJobStatusRows.all()) {
    jobStatuses.set(row.job_id, row.status)
  }

  const convertedJobs = new Map()
  for (const row of loadConvertedJobRows.all()) {
    convertedJobs.set(row.quote_id, JSON.parse(row.job_json))
  }

  const quoteStatuses = new Map()
  for (const row of loadQuoteStatusRows.all()) {
    quoteStatuses.set(row.quote_id, row.status)
  }

  const invoices = new Map()
  for (const row of loadInvoiceRows.all()) {
    invoices.set(row.job_id, {
      jobId: row.job_id,
      invoiceId: row.invoice_id,
      status: row.status,
      amount: [row.amount_min, row.amount_max],
      note: row.note,
      createdAt: row.created_at_ms,
      sentAt: row.sent_at_ms ?? undefined,
      paidAt: row.paid_at_ms ?? undefined,
    })
  }

  return { actionItems, conversations, jobStatuses, convertedJobs, quoteStatuses, invoices }
}

export function saveActionItemOverlay(actionItemId, entry) {
  upsertActionItemRow.run({
    action_item_id: actionItemId,
    status: entry.status,
    until_ms: entry.until ?? null,
  })
}

export function deleteActionItemOverlay(actionItemId) {
  deleteActionItemRow.run(actionItemId)
}

export function saveConversationMessage(conversationId, message, createdAtMs = Date.now()) {
  insertConversationRow.run({
    conversation_id: conversationId,
    message_id: message.id,
    sender: message.from,
    text: message.text,
    time_label: message.time,
    created_at_ms: createdAtMs,
  })
}

export function saveJobStatus(jobId, status) {
  upsertJobStatusRow.run({ job_id: jobId, status })
}

export function saveConvertedJob(quoteId, job) {
  upsertConvertedJobRow.run({
    quote_id: quoteId,
    job_id: job.id,
    job_json: JSON.stringify(job),
  })
}

export function saveQuoteStatus(quoteId, status) {
  upsertQuoteStatusRow.run({ quote_id: quoteId, status })
}

export function saveInvoice(invoice) {
  upsertInvoiceRow.run({
    job_id: invoice.jobId,
    invoice_id: invoice.invoiceId,
    status: invoice.status,
    amount_min: invoice.amount[0],
    amount_max: invoice.amount[1],
    note: invoice.note,
    created_at_ms: invoice.createdAt,
    sent_at_ms: invoice.sentAt ?? null,
    paid_at_ms: invoice.paidAt ?? null,
  })
}
