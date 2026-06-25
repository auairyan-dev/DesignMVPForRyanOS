import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ryanos-phase12-'))
const dbPath = path.join(tmpRoot, 'phase12.db')
const port = 3212
const baseUrl = `http://127.0.0.1:${port}`

function setEnv(key, value) {
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}

setEnv('PORT', String(port))
setEnv('RYANOS_DB_PATH', dbPath)
setEnv('RYANOS_OPERATOR_EMAIL', 'ryan@example.local')
setEnv('RYANOS_OPERATOR_PASSWORD', 'ryanos-demo')
setEnv('RYANOS_OPERATOR_NAME', 'Ryan')
setEnv('RYANOS_ENABLE_TWILIO_TRANSPORT', undefined)
setEnv('TWILIO_ACCOUNT_SID', undefined)
setEnv('TWILIO_AUTH_TOKEN', undefined)
setEnv('TWILIO_FROM_NUMBER', undefined)
setEnv('RYANOS_TWILIO_TEST_TO_ALLOWLIST', undefined)

const { default: startServer } = await import('./server.js')
const server = await startServer({ port, host: '127.0.0.1' })

const cookieJar = []

async function api(pathname, opts = {}) {
  const headers = new Headers(opts.headers || {})
  if (cookieJar.length) headers.set('cookie', cookieJar.join('; '))
  const res = await fetch(`${baseUrl}${pathname}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body,
  })
  const setCookie = res.headers.getSetCookie?.() || []
  for (const raw of setCookie) {
    const first = raw.split(';')[0]
    const [name] = first.split('=')
    const next = cookieJar.filter(x => !x.startsWith(`${name}=`))
    next.push(first)
    cookieJar.length = 0
    cookieJar.push(...next)
  }
  const text = await res.text()
  let json = null
  try { json = text ? JSON.parse(text) : null } catch {}
  return { res, json, text }
}

async function login() {
  const out = await api('/api/v1/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'ryan@example.local', password: 'ryanos-demo' }),
  })
  assert.equal(out.res.status, 200)
  assert.equal(out.json?.ok, true)
}

async function setupReadyOutbox() {
  const jobId = 'j3'
  const invoiceDraft = await api(`/api/v1/jobs/${encodeURIComponent(jobId)}/invoice-status`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status: 'draft' }),
  })
  assert.equal(invoiceDraft.res.status, 200)

  const createOutbox = await api(`/api/v1/jobs/${encodeURIComponent(jobId)}/outbox`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ kind: 'invoice', channel: 'email' }),
  })
  assert.equal(createOutbox.res.status, 200, JSON.stringify(createOutbox.json))
  const outboxId = createOutbox.json?.item?.outboxId
  assert.ok(outboxId)

  const ready = await api(`/api/v1/outbox/${encodeURIComponent(outboxId)}/ready`, {
    method: 'POST',
  })
  assert.equal(ready.res.status, 200)
  return outboxId
}


await login()
const outboxId = await setupReadyOutbox()
const allowlisted = '+61411111111'

const disabled = await api(`/api/v1/outbox/${encodeURIComponent(outboxId)}/attempt-send`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ transport: 'twilio-test', target: allowlisted }),
})
assert.equal(disabled.res.status, 400)
assert.equal(disabled.json?.error, 'twilio_transport_disabled')

setEnv('RYANOS_ENABLE_TWILIO_TRANSPORT', 'true')
const missingCreds = await api(`/api/v1/outbox/${encodeURIComponent(outboxId)}/attempt-send`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ transport: 'twilio-test', target: allowlisted }),
})
assert.equal(missingCreds.res.status, 400)
assert.equal(missingCreds.json?.error, 'twilio_not_configured')

setEnv('TWILIO_ACCOUNT_SID', 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')
setEnv('TWILIO_AUTH_TOKEN', 'redacted-test-token')
setEnv('TWILIO_FROM_NUMBER', '+61400000000')
const emptyAllowlist = await api(`/api/v1/outbox/${encodeURIComponent(outboxId)}/attempt-send`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ transport: 'twilio-test', target: allowlisted }),
})
assert.equal(emptyAllowlist.res.status, 400)
assert.equal(emptyAllowlist.json?.error, 'twilio_allowlist_empty')

setEnv('RYANOS_TWILIO_TEST_TO_ALLOWLIST', allowlisted)
const missingTarget = await api(`/api/v1/outbox/${encodeURIComponent(outboxId)}/attempt-send`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ transport: 'twilio-test' }),
})
assert.equal(missingTarget.res.status, 400)
assert.equal(missingTarget.json?.error, 'invalid_target')

const invalidTarget = await api(`/api/v1/outbox/${encodeURIComponent(outboxId)}/attempt-send`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ transport: 'twilio-test', target: '0412345678' }),
})
assert.equal(invalidTarget.res.status, 400)
assert.equal(invalidTarget.json?.error, 'invalid_target')

const notAllowlisted = await api(`/api/v1/outbox/${encodeURIComponent(outboxId)}/attempt-send`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ transport: 'twilio-test', target: '+61422222222' }),
})
assert.equal(notAllowlisted.res.status, 400)
assert.equal(notAllowlisted.json?.error, 'target_not_allowlisted')

const liveReady = Boolean(
  process.env.PHASE12_RUN_LIVE_TWILIO === 'true' &&
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_FROM_NUMBER &&
  process.env.RYANOS_TWILIO_TEST_TO_ALLOWLIST?.includes(allowlisted)
)

let liveAttemptRan = false
if (liveReady) {
  const live = await api(`/api/v1/outbox/${encodeURIComponent(outboxId)}/attempt-send`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ transport: 'twilio-test', target: allowlisted }),
  })
  assert.equal(live.res.status, 200)
  assert.equal(live.json?.attempt?.transport, 'twilio-test')
  assert.equal(live.json?.attempt?.status, 'attempted')
  assert.equal(live.json?.attempt?.dryRun, false)
  liveAttemptRan = true

  const attempts = await api(`/api/v1/outbox/${encodeURIComponent(outboxId)}/attempts`)
  assert.equal(attempts.res.status, 200)
  assert.ok((attempts.json?.attempts || []).some(x => x.transport === 'twilio-test'))
}

const dryRun = await api(`/api/v1/outbox/${encodeURIComponent(outboxId)}/attempt-send`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ transport: 'mock' }),
})
assert.equal(dryRun.res.status, 200)
assert.equal(dryRun.json?.attempt?.status, 'dry-run')

const attemptsBeforeRestart = await api(`/api/v1/outbox/${encodeURIComponent(outboxId)}/attempts`)
assert.equal(attemptsBeforeRestart.res.status, 200)
assert.ok((attemptsBeforeRestart.json?.attempts || []).length >= 1)

await server.close()

console.log(JSON.stringify({ ok: true, dbPath, liveAttemptRan, outboxId, attemptCountBeforeRestart: (attemptsBeforeRestart.json?.attempts || []).length }, null, 2))
