const ALLOWED_OUTBOX_KINDS = new Set(['invoice'])
const ALLOWED_OUTBOX_CHANNELS = new Set(['email'])
const ALLOWED_OUTBOX_STATUSES = new Set(['draft', 'ready'])

export function isAllowedOutboxKind(kind) {
  return ALLOWED_OUTBOX_KINDS.has(kind)
}

export function isAllowedOutboxChannel(channel) {
  return ALLOWED_OUTBOX_CHANNELS.has(channel)
}

export function isAllowedOutboxStatus(status) {
  return ALLOWED_OUTBOX_STATUSES.has(status)
}

export function buildInvoiceOutboxItem(job, invoiceDraft, existing) {
  const now = Date.now()
  const lineItem = invoiceDraft.lineItems?.[0]
  const lineLabel = lineItem?.label || job.type || job.title || 'Trade service'
  const body = `Hi ${invoiceDraft.customer}, your invoice draft ${invoiceDraft.invoiceId} for ${lineLabel} is ready for review. Total: $${invoiceDraft.total}. This message has been prepared by RyanOS but has not been delivered.`
  return {
    outboxId: existing?.outboxId || `out-${job.id}-invoice-email`,
    jobId: job.id,
    invoiceId: invoiceDraft.invoiceId,
    customerId: invoiceDraft.customerId || null,
    customer: invoiceDraft.customer,
    kind: 'invoice',
    channel: 'email',
    status: existing?.status || 'draft',
    subject: `Invoice draft ${invoiceDraft.invoiceId} ready for review`,
    body,
    notes: 'Internal outbox item. Not delivered by RyanOS yet.',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    approvedAt: existing?.approvedAt || null,
  }
}
