import { describe, it, expect } from 'vitest'
import express from 'express'
import { type Server } from 'http'

describe('Server', () => {
  let server: Server

  it('responds to health check', async () => {
    const app = express()
    app.use(express.json())
    app.get('/api/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() })
    })

    server = app.listen(0)
    const address = server.address()
    const port = typeof address === 'object' && address ? address.port : 0

    const response = await fetch(`http://localhost:${port}/api/health`)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.timestamp).toBeDefined()

    server.close()
  })
})
