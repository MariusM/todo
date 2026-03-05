import { describe, it, expect, afterAll } from 'vitest'
import { type Server } from 'http'
import { app } from './index.js'

describe('Server', () => {
  let server: Server

  afterAll(() => {
    if (server) server.close()
  })

  it('responds to health check', async () => {
    server = app.listen(0)
    const address = server.address()
    const port = typeof address === 'object' && address ? address.port : 0

    const response = await fetch(`http://localhost:${port}/api/health`)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.timestamp).toBeDefined()
  })
})
