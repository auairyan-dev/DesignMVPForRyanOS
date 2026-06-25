import Fastify from 'fastify'
import { ACTION_ITEMS, INBOX } from '../src/data/seed/index.ts'

const app = Fastify({ logger: false })
const port = Number(process.env.PORT || 3001)

app.get('/api/v1/health', async () => ({ ok: true }))
app.get('/api/v1/action-items', async () => ACTION_ITEMS)
app.get('/api/v1/conversations', async () => INBOX)

app.listen({ port, host: '0.0.0.0' })
  .then(() => console.log(`server listening on ${port}`))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
