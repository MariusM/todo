import { describe, it, expect } from 'vitest'
import express from 'express'
import { healthRoutes } from './health-routes.js'

function createTestApp() {
  const app = express()
  app.use(healthRoutes)
  return app
}

async function request(app: express.Express, path: string) {
  const server = app.listen(0)
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 0

  try {
    const response = await fetch(`http://localhost:${port}${path}`)
    const data = await response.json()
    return { status: response.status, data }
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
}

describe('Health routes', () => {
  it('responds with 200 and correct shape', async () => {
    const app = createTestApp()
    const { status, data } = await request(app, '/api/health')

    expect(status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.timestamp).toBeDefined()
    expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp)
  })
})
