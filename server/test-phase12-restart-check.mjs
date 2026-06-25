import fs from 'node:fs'
import path from 'node:path'

const dbPath = process.env.RYANOS_DB_PATH
const outboxId = process.env.PHASE12_OUTBOX_ID
if (!dbPath || !outboxId) throw new Error('missing env')
const data = fs.readFileSync(dbPath)
if (!data) throw new Error('db missing')
console.log(JSON.stringify({ ok: true, outboxId, dbPath: path.basename(dbPath) }))
