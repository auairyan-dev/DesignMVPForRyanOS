import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'

const DEFAULT_DB_PATH = path.resolve(process.cwd(), 'server/data/ryanos.db')
const dbPath = path.resolve(process.env.RYANOS_DB_PATH || DEFAULT_DB_PATH)

fs.mkdirSync(path.dirname(dbPath), { recursive: true })

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS action_item_overlay (
    action_item_id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    until_ms INTEGER NULL
  );

  CREATE TABLE IF NOT EXISTS conversation_messages (
    conversation_id TEXT NOT NULL,
    message_id TEXT PRIMARY KEY,
    sender TEXT NOT NULL,
    text TEXT NOT NULL,
    time_label TEXT NOT NULL,
    created_at_ms INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS job_status_overlay (
    job_id TEXT PRIMARY KEY,
    status TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS converted_jobs (
    quote_id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL UNIQUE,
    job_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS quote_status_overlay (
    quote_id TEXT PRIMARY KEY,
    status TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS invoice_overlay (
    job_id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    amount_min INTEGER NOT NULL,
    amount_max INTEGER NOT NULL,
    note TEXT NOT NULL,
    created_at_ms INTEGER NOT NULL,
    sent_at_ms INTEGER NULL,
    paid_at_ms INTEGER NULL
  );

  CREATE TABLE IF NOT EXISTS invoice_drafts (
    invoice_id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL UNIQUE,
    customer_id TEXT NULL,
    customer TEXT NOT NULL,
    status TEXT NOT NULL,
    line_items_json TEXT NOT NULL,
    subtotal INTEGER NOT NULL,
    total INTEGER NOT NULL,
    notes TEXT NOT NULL,
    created_at_ms INTEGER NOT NULL,
    updated_at_ms INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS outbox_items (
    outbox_id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    invoice_id TEXT NULL,
    customer_id TEXT NULL,
    customer TEXT NOT NULL,
    kind TEXT NOT NULL,
    channel TEXT NOT NULL,
    status TEXT NOT NULL,
    subject TEXT NULL,
    body TEXT NOT NULL,
    notes TEXT NOT NULL,
    created_at_ms INTEGER NOT NULL,
    updated_at_ms INTEGER NOT NULL,
    approved_at_ms INTEGER NULL,
    UNIQUE(job_id, kind, channel)
  );
`)

export { db, dbPath }
