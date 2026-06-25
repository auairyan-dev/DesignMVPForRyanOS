import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { db } from './db.js'

const SESSION_COOKIE = 'ryanos_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

const findOperatorByEmailStmt = db.prepare(`
  SELECT operator_id, business_id, email, name, password_hash, status, created_at_ms, last_login_at_ms
  FROM operators
  WHERE email = ?
`)
const findOperatorByIdStmt = db.prepare(`
  SELECT operator_id, business_id, email, name, password_hash, status, created_at_ms, last_login_at_ms
  FROM operators
  WHERE operator_id = ?
`)
const updateOperatorLoginStmt = db.prepare(`
  UPDATE operators
  SET last_login_at_ms = ?
  WHERE operator_id = ?
`)
const insertSessionStmt = db.prepare(`
  INSERT INTO sessions (session_id, operator_id, created_at_ms, expires_at_ms, last_seen_at_ms)
  VALUES (@session_id, @operator_id, @created_at_ms, @expires_at_ms, @last_seen_at_ms)
`)
const findSessionStmt = db.prepare(`
  SELECT session_id, operator_id, created_at_ms, expires_at_ms, last_seen_at_ms
  FROM sessions
  WHERE session_id = ?
`)
const updateSessionSeenStmt = db.prepare(`
  UPDATE sessions
  SET last_seen_at_ms = ?, expires_at_ms = ?
  WHERE session_id = ?
`)
const deleteSessionStmt = db.prepare(`
  DELETE FROM sessions WHERE session_id = ?
`)

export async function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash)
}

function parseCookies(request) {
  const header = request.headers.cookie
  if (!header) return {}
  return Object.fromEntries(
    header
      .split(';')
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const idx = part.indexOf('=')
        return idx === -1 ? [part, ''] : [part.slice(0, idx), decodeURIComponent(part.slice(idx + 1))]
      })
  )
}

function serializeSessionCookie(sessionId, maxAgeMs) {
  const maxAgeSeconds = Math.max(0, Math.floor(maxAgeMs / 1000))
  return `${SESSION_COOKIE}=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`
}

export function clearSessionCookie(reply) {
  reply.header('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
}

export async function createSession(reply, operator) {
  const now = Date.now()
  const sessionId = crypto.randomUUID()
  insertSessionStmt.run({
    session_id: sessionId,
    operator_id: operator.operatorId,
    created_at_ms: now,
    expires_at_ms: now + SESSION_TTL_MS,
    last_seen_at_ms: now,
  })
  updateOperatorLoginStmt.run(now, operator.operatorId)
  reply.header('Set-Cookie', serializeSessionCookie(sessionId, SESSION_TTL_MS))
  return sessionId
}

export function destroySession(request, reply) {
  const cookies = parseCookies(request)
  const sessionId = cookies[SESSION_COOKIE]
  if (sessionId) deleteSessionStmt.run(sessionId)
  clearSessionCookie(reply)
}

function normalizeOperator(row) {
  if (!row) return null
  return {
    operatorId: row.operator_id,
    businessId: row.business_id,
    email: row.email,
    name: row.name,
    status: row.status,
  }
}

export function getOperatorByEmail(email) {
  const row = findOperatorByEmailStmt.get(email)
  return row ? {
    ...normalizeOperator(row),
    passwordHash: row.password_hash,
  } : null
}

export function getCurrentOperator(request) {
  const cookies = parseCookies(request)
  const sessionId = cookies[SESSION_COOKIE]
  if (!sessionId) return null
  const session = findSessionStmt.get(sessionId)
  if (!session) return null
  const now = Date.now()
  if (session.expires_at_ms <= now) {
    deleteSessionStmt.run(sessionId)
    return null
  }
  updateSessionSeenStmt.run(now, now + SESSION_TTL_MS, sessionId)
  const operator = findOperatorByIdStmt.get(session.operator_id)
  if (!operator || operator.status !== 'active') return null
  return normalizeOperator(operator)
}

export function requireOperator(request, reply) {
  const operator = getCurrentOperator(request)
  if (!operator) {
    reply.code(401)
    return { ok: false, error: 'auth_required' }
  }
  request.operator = operator
  return operator
}
