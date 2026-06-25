import twilio from 'twilio'

function isE164ish(value) {
  return /^\+[1-9]\d{7,14}$/.test(value)
}

function normalizeTarget(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!isE164ish(trimmed)) return null
  return trimmed
}

function parseAllowlist(raw) {
  if (typeof raw !== 'string') return []
  return raw
    .split(',')
    .map(value => normalizeTarget(value))
    .filter(Boolean)
}

function isTwilioTransportEnabled() {
  return process.env.RYANOS_ENABLE_TWILIO_TRANSPORT === 'true'
}

function getTwilioConfig() {
  const allowlist = parseAllowlist(process.env.RYANOS_TWILIO_TEST_TO_ALLOWLIST)
  return {
    enabled: isTwilioTransportEnabled(),
    accountSid: process.env.TWILIO_ACCOUNT_SID?.trim() || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    fromNumber: normalizeTarget(process.env.TWILIO_FROM_NUMBER),
    allowlist,
  }
}

export function isAllowedTransport(transport) {
  return transport === 'mock' || transport === 'twilio-test'
}

function mockResult(attempt) {
  if (attempt.transport !== 'mock') {
    return {
      ok: false,
      status: 'failed',
      providerStatus: null,
      providerMessageId: null,
      providerErrorCode: 'invalid_transport',
      providerErrorMessage: 'transport must be "mock" or "twilio-test"',
      notes: `${attempt.notes} Mock transport rejected: invalid transport.`,
      dryRun: attempt.dryRun,
      attemptedAt: null,
      failedAt: Date.now(),
    }
  }

  const now = Date.now()
  return {
    ok: true,
    status: 'dry-run',
    providerStatus: 'dry-run',
    providerMessageId: null,
    providerErrorCode: null,
    providerErrorMessage: null,
    notes: attempt.notes,
    dryRun: true,
    attemptedAt: now,
    failedAt: null,
  }
}

async function twilioTestResult(attempt) {
  const config = getTwilioConfig()
  if (!config.enabled) {
    return {
      ok: false,
      status: 'failed',
      providerStatus: null,
      providerMessageId: null,
      providerErrorCode: 'twilio_transport_disabled',
      providerErrorMessage: 'Twilio test transport is disabled.',
      notes: `${attempt.notes} Twilio test attempt blocked: transport disabled.`,
      dryRun: false,
      attemptedAt: null,
      failedAt: Date.now(),
    }
  }
  if (!config.accountSid || !config.authToken || !config.fromNumber) {
    return {
      ok: false,
      status: 'failed',
      providerStatus: null,
      providerMessageId: null,
      providerErrorCode: 'twilio_not_configured',
      providerErrorMessage: 'Twilio credentials are not fully configured.',
      notes: `${attempt.notes} Twilio test attempt blocked: missing Twilio configuration.`,
      dryRun: false,
      attemptedAt: null,
      failedAt: Date.now(),
    }
  }
  if (config.allowlist.length === 0) {
    return {
      ok: false,
      status: 'failed',
      providerStatus: null,
      providerMessageId: null,
      providerErrorCode: 'twilio_allowlist_empty',
      providerErrorMessage: 'Twilio test target allowlist is empty.',
      notes: `${attempt.notes} Twilio test attempt blocked: no allowlisted test targets configured.`,
      dryRun: false,
      attemptedAt: null,
      failedAt: Date.now(),
    }
  }
  if (!attempt.target || !config.allowlist.includes(attempt.target)) {
    return {
      ok: false,
      status: 'failed',
      providerStatus: null,
      providerMessageId: null,
      providerErrorCode: 'target_not_allowlisted',
      providerErrorMessage: 'Target is not an allowlisted Twilio test number.',
      notes: `${attempt.notes} Twilio test attempt blocked: target not allowlisted.`,
      dryRun: false,
      attemptedAt: null,
      failedAt: Date.now(),
    }
  }

  try {
    const client = twilio(config.accountSid, config.authToken)
    const message = await client.messages.create({
      from: config.fromNumber,
      to: attempt.target,
      body: attempt.body,
    })
    return {
      ok: true,
      status: 'attempted',
      providerStatus: message.status || 'accepted',
      providerMessageId: message.sid || null,
      providerErrorCode: null,
      providerErrorMessage: null,
      notes: `${attempt.notes} Provider request accepted. Delivery not confirmed.`,
      dryRun: false,
      attemptedAt: Date.now(),
      failedAt: null,
    }
  } catch (error) {
    return {
      ok: false,
      status: 'failed',
      providerStatus: error?.status ? String(error.status) : null,
      providerMessageId: null,
      providerErrorCode: error?.code ? String(error.code) : 'twilio_request_failed',
      providerErrorMessage: typeof error?.message === 'string' ? error.message : 'Twilio request failed.',
      notes: `${attempt.notes} Twilio test attempt failed at provider request stage. Delivery not confirmed.`,
      dryRun: false,
      attemptedAt: null,
      failedAt: Date.now(),
    }
  }
}

export async function executeTransportAttempt(attempt) {
  if (attempt.transport === 'mock') return mockResult(attempt)
  if (attempt.transport === 'twilio-test') return twilioTestResult(attempt)
  return {
    ok: false,
    status: 'failed',
    providerStatus: null,
    providerMessageId: null,
    providerErrorCode: 'invalid_transport',
    providerErrorMessage: 'transport must be "mock" or "twilio-test"',
    notes: `${attempt.notes} Transport rejected: invalid transport.`,
    dryRun: attempt.dryRun,
    attemptedAt: null,
    failedAt: Date.now(),
  }
}

export {
  getTwilioConfig,
  isE164ish,
  normalizeTarget,
}
