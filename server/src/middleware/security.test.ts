import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { Server } from 'http'
import { app } from '../index.js'

let server: Server
let port: number

beforeAll(async () => {
  server = app.listen(0)
  const address = server.address()
  port = typeof address === 'object' && address ? address.port : 0
})

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
})

function url(path: string) {
  return `http://localhost:${port}${path}`
}

describe('Helmet security headers', () => {
  it('sets X-Content-Type-Options to nosniff', async () => {
    const res = await fetch(url('/api/todos'))
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })

  it('sets Content-Security-Policy header', async () => {
    const res = await fetch(url('/api/todos'))
    expect(res.headers.get('content-security-policy')).toBeTruthy()
  })

  it('sets X-Frame-Options header', async () => {
    const res = await fetch(url('/api/todos'))
    const xfo = res.headers.get('x-frame-options')
    expect(xfo).toBeTruthy()
    expect(['SAMEORIGIN', 'DENY']).toContain(xfo)
  })

  it('removes X-Powered-By header', async () => {
    const res = await fetch(url('/api/todos'))
    expect(res.headers.get('x-powered-by')).toBeNull()
  })

  it('disables deprecated X-XSS-Protection header', async () => {
    const res = await fetch(url('/api/todos'))
    // Helmet sets X-XSS-Protection to "0" (disabled) rather than removing it
    expect(res.headers.get('x-xss-protection')).toBe('0')
  })

  it('applies security headers to error responses too', async () => {
    const res = await fetch(url('/api/todos/not-a-uuid'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'test' }),
    })
    expect(res.status).toBe(400)
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('x-powered-by')).toBeNull()
  })
})

describe('CORS configuration', () => {
  it('returns Access-Control-Allow-Origin for allowed origin', async () => {
    const origin = process.env.CORS_ORIGIN || 'http://localhost'
    const res = await fetch(url('/api/todos'), {
      headers: { Origin: origin },
    })
    expect(res.headers.get('access-control-allow-origin')).toBe(origin)
  })

  it('handles OPTIONS preflight requests', async () => {
    const origin = process.env.CORS_ORIGIN || 'http://localhost'
    const res = await fetch(url('/api/todos'), {
      method: 'OPTIONS',
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    })
    expect(res.status).toBeLessThan(400)
    expect(res.headers.get('access-control-allow-origin')).toBe(origin)
  })

  it('does not set CORS headers for disallowed origins', async () => {
    const res = await fetch(url('/api/todos'), {
      headers: { Origin: 'http://evil.com' },
    })
    const allowOrigin = res.headers.get('access-control-allow-origin')
    expect(allowOrigin).not.toBe('http://evil.com')
  })
})
