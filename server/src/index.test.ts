import { describe, it, expect, afterAll } from 'vitest'
import { type Server } from 'http'
import { app, db } from './index.js'

describe('Server', () => {
  let server: Server
  let port: number

  afterAll(async () => {
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()))
    if (db) db.close()
  })

  it('responds to health check', async () => {
    server = app.listen(0)
    const address = server.address()
    port = typeof address === 'object' && address ? address.port : 0

    const response = await fetch(`http://localhost:${port}/api/health`)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.timestamp).toBeDefined()
  })

  it('exports database instance', () => {
    expect(db).toBeDefined()
  })

  it('applies JSON body parser middleware (accepts JSON requests)', async () => {
    const response = await fetch(`http://localhost:${port}/api/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: '550e8400-e29b-41d4-a716-446655440000', text: 'Test middleware' }),
    })

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.text).toBe('Test middleware')
  })

  it('mounts todo routes under /api/todos', async () => {
    const response = await fetch(`http://localhost:${port}/api/todos`)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(Array.isArray(data)).toBe(true)
  })

  it('mounts error handler that formats unknown errors', async () => {
    const response = await fetch(`http://localhost:${port}/api/todos/not-a-uuid`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'test' }),
    })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toHaveProperty('message')
    expect(data.error).toHaveProperty('code')
  })
})
