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
`)

export { db, dbPath }
