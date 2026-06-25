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

const loadInvoiceDraftRows = db.prepare(`
  SELECT invoice_id, job_id, customer_id, customer, status, line_items_json, subtotal, total, notes, created_at_ms, updated_at_ms
  FROM invoice_drafts
`)
const upsertInvoiceDraftRow = db.prepare(`
  INSERT INTO invoice_drafts (invoice_id, job_id, customer_id, customer, status, line_items_json, subtotal, total, notes, created_at_ms, updated_at_ms)
  VALUES (@invoice_id, @job_id, @customer_id, @customer, @status, @line_items_json, @subtotal, @total, @notes, @created_at_ms, @updated_at_ms)
  ON CONFLICT(invoice_id) DO UPDATE SET
    job_id = excluded.job_id,
    customer_id = excluded.customer_id,
    customer = excluded.customer,
    status = excluded.status,
    line_items_json = excluded.line_items_json,
    subtotal = excluded.subtotal,
    total = excluded.total,
    notes = excluded.notes,
    created_at_ms = excluded.created_at_ms,
    updated_at_ms = excluded.updated_at_ms
`)

const loadOutboxRows = db.prepare(`
  SELECT outbox_id, job_id, invoice_id, customer_id, customer, kind, channel, status, subject, body, notes, created_at_ms, updated_at_ms, approved_at_ms, approved_by_operator_id, approved_by_name
  FROM outbox_items
`)
const upsertOutboxRow = db.prepare(`
  INSERT INTO outbox_items (outbox_id, job_id, invoice_id, customer_id, customer, kind, channel, status, subject, body, notes, created_at_ms, updated_at_ms, approved_at_ms, approved_by_operator_id, approved_by_name)
  VALUES (@outbox_id, @job_id, @invoice_id, @customer_id, @customer, @kind, @channel, @status, @subject, @body, @notes, @created_at_ms, @updated_at_ms, @approved_at_ms, @approved_by_operator_id, @approved_by_name)
  ON CONFLICT(outbox_id) DO UPDATE SET
    job_id = excluded.job_id,
    invoice_id = excluded.invoice_id,
    customer_id = excluded.customer_id,
    customer = excluded.customer,
    kind = excluded.kind,
    channel = excluded.channel,
    status = excluded.status,
    subject = excluded.subject,
    body = excluded.body,
    notes = excluded.notes,
    created_at_ms = excluded.created_at_ms,
    updated_at_ms = excluded.updated_at_ms,
    approved_at_ms = excluded.approved_at_ms,
    approved_by_operator_id = excluded.approved_by_operator_id,
    approved_by_name = excluded.approved_by_name
`)

const findBusinessByIdRow = db.prepare(`SELECT business_id, name, mode, created_at_ms FROM businesses WHERE business_id = ?`)
const insertBusinessRow = db.prepare(`
  INSERT INTO businesses (business_id, name, mode, created_at_ms)
  VALUES (@business_id, @name, @mode, @created_at_ms)
`)
const findOperatorByEmailRow = db.prepare(`
  SELECT operator_id, business_id, email, name, password_hash, status, created_at_ms, last_login_at_ms
  FROM operators WHERE email = ?
`)
const insertOperatorRow = db.prepare(`
  INSERT INTO operators (operator_id, business_id, email, name, password_hash, status, created_at_ms, last_login_at_ms)
  VALUES (@operator_id, @business_id, @email, @name, @password_hash, @status, @created_at_ms, @last_login_at_ms)
`)

const loadSendAttemptRows = db.prepare(`
  SELECT attempt_id, outbox_id, job_id, invoice_id, customer_id, customer, kind, channel, transport, status, target, subject, body, notes,
         requested_by_operator_id, requested_by_name,
         approved_by_operator_id, approved_by_name, approved_at_ms,
         created_at_ms, updated_at_ms, attempted_at_ms, failed_at_ms,
         provider_message_id, provider_status, provider_error_code, provider_error_message, dry_run
  FROM send_attempts
  ORDER BY created_at_ms ASC, attempt_id ASC
`)
const insertSendAttemptRow = db.prepare(`
  INSERT INTO send_attempts (
    attempt_id, outbox_id, job_id, invoice_id, customer_id, customer, kind, channel, transport, status, target, subject, body, notes,
    requested_by_operator_id, requested_by_name,
    approved_by_operator_id, approved_by_name, approved_at_ms,
    created_at_ms, updated_at_ms, attempted_at_ms, failed_at_ms,
    provider_message_id, provider_status, provider_error_code, provider_error_message, dry_run
  )
  VALUES (
    @attempt_id, @outbox_id, @job_id, @invoice_id, @customer_id, @customer, @kind, @channel, @transport, @status, @target, @subject, @body, @notes,
    @requested_by_operator_id, @requested_by_name,
    @approved_by_operator_id, @approved_by_name, @approved_at_ms,
    @created_at_ms, @updated_at_ms, @attempted_at_ms, @failed_at_ms,
    @provider_message_id, @provider_status, @provider_error_code, @provider_error_message, @dry_run
  )
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

  const invoiceDrafts = new Map()
  for (const row of loadInvoiceDraftRows.all()) {
    invoiceDrafts.set(row.job_id, {
      invoiceId: row.invoice_id,
      jobId: row.job_id,
      customerId: row.customer_id ?? undefined,
      customer: row.customer,
      status: row.status,
      lineItems: JSON.parse(row.line_items_json),
      subtotal: row.subtotal,
      total: row.total,
      notes: row.notes,
      createdAt: row.created_at_ms,
      updatedAt: row.updated_at_ms,
    })
  }

  const outboxItems = new Map()
  for (const row of loadOutboxRows.all()) {
    outboxItems.set(row.outbox_id, {
      outboxId: row.outbox_id,
      jobId: row.job_id,
      invoiceId: row.invoice_id ?? null,
      customerId: row.customer_id ?? null,
      customer: row.customer,
      kind: row.kind,
      channel: row.channel,
      status: row.status,
      subject: row.subject ?? null,
      body: row.body,
      notes: row.notes,
      createdAt: row.created_at_ms,
      updatedAt: row.updated_at_ms,
      approvedAt: row.approved_at_ms ?? null,
      approvedByOperatorId: row.approved_by_operator_id ?? null,
      approvedByName: row.approved_by_name ?? null,
    })
  }

  const sendAttempts = new Map()
  for (const row of loadSendAttemptRows.all()) {
    sendAttempts.set(row.attempt_id, {
      attemptId: row.attempt_id,
      outboxId: row.outbox_id,
      jobId: row.job_id,
      invoiceId: row.invoice_id ?? null,
      customerId: row.customer_id ?? null,
      customer: row.customer,
      kind: row.kind,
      channel: row.channel,
      transport: row.transport,
      status: row.status,
      target: row.target ?? null,
      subject: row.subject ?? null,
      body: row.body,
      notes: row.notes,
      requestedByOperatorId: row.requested_by_operator_id,
      requestedByName: row.requested_by_name,
      approvedByOperatorId: row.approved_by_operator_id ?? null,
      approvedByName: row.approved_by_name ?? null,
      approvedAt: row.approved_at_ms ?? null,
      createdAt: row.created_at_ms,
      updatedAt: row.updated_at_ms,
      attemptedAt: row.attempted_at_ms ?? null,
      failedAt: row.failed_at_ms ?? null,
      providerMessageId: row.provider_message_id ?? null,
      providerStatus: row.provider_status ?? null,
      providerErrorCode: row.provider_error_code ?? null,
      providerErrorMessage: row.provider_error_message ?? null,
      dryRun: Boolean(row.dry_run),
    })
  }

  return { actionItems, conversations, jobStatuses, convertedJobs, quoteStatuses, invoices, invoiceDrafts, outboxItems, sendAttempts }
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

export function saveInvoiceDraft(draft) {
  upsertInvoiceDraftRow.run({
    invoice_id: draft.invoiceId,
    job_id: draft.jobId,
    customer_id: draft.customerId ?? null,
    customer: draft.customer,
    status: draft.status,
    line_items_json: JSON.stringify(draft.lineItems),
    subtotal: draft.subtotal,
    total: draft.total,
    notes: draft.notes,
    created_at_ms: draft.createdAt,
    updated_at_ms: draft.updatedAt,
  })
}

export function saveOutboxItem(item) {
  upsertOutboxRow.run({
    outbox_id: item.outboxId,
    job_id: item.jobId,
    invoice_id: item.invoiceId ?? null,
    customer_id: item.customerId ?? null,
    customer: item.customer,
    kind: item.kind,
    channel: item.channel,
    status: item.status,
    subject: item.subject ?? null,
    body: item.body,
    notes: item.notes,
    created_at_ms: item.createdAt,
    updated_at_ms: item.updatedAt,
    approved_at_ms: item.approvedAt ?? null,
    approved_by_operator_id: item.approvedByOperatorId ?? null,
    approved_by_name: item.approvedByName ?? null,
  })
}

export function findBusinessById(businessId) {
  return findBusinessByIdRow.get(businessId) ?? null
}

export function createBusiness(business) {
  insertBusinessRow.run({
    business_id: business.businessId,
    name: business.name,
    mode: business.mode,
    created_at_ms: business.createdAt,
  })
}

export function findOperatorByEmail(email) {
  const row = findOperatorByEmailRow.get(email)
  if (!row) return null
  return {
    operatorId: row.operator_id,
    businessId: row.business_id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    status: row.status,
    createdAt: row.created_at_ms,
    lastLoginAt: row.last_login_at_ms ?? null,
  }
}

export function createOperator(operator) {
  insertOperatorRow.run({
    operator_id: operator.operatorId,
    business_id: operator.businessId,
    email: operator.email,
    name: operator.name,
    password_hash: operator.passwordHash,
    status: operator.status,
    created_at_ms: operator.createdAt,
    last_login_at_ms: operator.lastLoginAt ?? null,
  })
}

export function createSendAttempt(attempt) {
  insertSendAttemptRow.run({
    attempt_id: attempt.attemptId,
    outbox_id: attempt.outboxId,
    job_id: attempt.jobId,
    invoice_id: attempt.invoiceId ?? null,
    customer_id: attempt.customerId ?? null,
    customer: attempt.customer,
    kind: attempt.kind,
    channel: attempt.channel,
    transport: attempt.transport,
    status: attempt.status,
    target: attempt.target ?? null,
    subject: attempt.subject ?? null,
    body: attempt.body,
    notes: attempt.notes,
    requested_by_operator_id: attempt.requestedByOperatorId,
    requested_by_name: attempt.requestedByName,
    approved_by_operator_id: attempt.approvedByOperatorId ?? null,
    approved_by_name: attempt.approvedByName ?? null,
    approved_at_ms: attempt.approvedAt ?? null,
    created_at_ms: attempt.createdAt,
    updated_at_ms: attempt.updatedAt,
    attempted_at_ms: attempt.attemptedAt ?? null,
    failed_at_ms: attempt.failedAt ?? null,
    provider_message_id: attempt.providerMessageId ?? null,
    provider_status: attempt.providerStatus ?? null,
    provider_error_code: attempt.providerErrorCode ?? null,
    provider_error_message: attempt.providerErrorMessage ?? null,
    dry_run: attempt.dryRun ? 1 : 0,
  })
}
