import { describe, it, expect } from 'vitest'
import express from 'express'
import { errorHandler, AppError } from './error-handler.js'

function createTestApp() {
  const app = express()

  app.get('/throw-validation', () => {
    throw new AppError('Invalid input', 400, 'VALIDATION_ERROR')
  })

  app.get('/throw-not-found', () => {
    throw new AppError('Item not found', 404, 'NOT_FOUND')
  })

  app.get('/throw-generic', () => {
    throw new Error('Something broke')
  })

  app.use(errorHandler)
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

describe('Error handler middleware', () => {
  it('formats validation errors as { error: { message, code } }', async () => {
    const app = createTestApp()
    const { status, data } = await request(app, '/throw-validation')

    expect(status).toBe(400)
    expect(data).toEqual({
      error: { message: 'Invalid input', code: 'VALIDATION_ERROR' },
    })
  })

  it('formats not found errors', async () => {
    const app = createTestApp()
    const { status, data } = await request(app, '/throw-not-found')

    expect(status).toBe(404)
    expect(data).toEqual({
      error: { message: 'Item not found', code: 'NOT_FOUND' },
    })
  })

  it('formats unknown errors as 500 INTERNAL_ERROR without stack traces', async () => {
    const app = createTestApp()
    const { status, data } = await request(app, '/throw-generic')

    expect(status).toBe(500)
    expect(data).toEqual({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
    expect(JSON.stringify(data)).not.toContain('stack')
    expect(JSON.stringify(data)).not.toContain('Something broke')
  })

  it('handles thrown string errors as 500 INTERNAL_ERROR', async () => {
    const app = express()
    app.get('/throw-string', () => {
      throw 'a plain string error' // eslint-disable-line no-throw-literal
    })
    app.use(errorHandler)

    const { status, data } = await request(app, '/throw-string')
    expect(status).toBe(500)
    expect(data).toEqual({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
    expect(JSON.stringify(data)).not.toContain('plain string error')
  })

  it('handles errors without message property as 500 INTERNAL_ERROR', async () => {
    const app = express()
    app.get('/throw-object', () => {
      throw { custom: 'error object' } // eslint-disable-line no-throw-literal
    })
    app.use(errorHandler)

    const { status, data } = await request(app, '/throw-object')
    expect(status).toBe(500)
    expect(data).toEqual({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  })

  it('never exposes internal server paths in error response', async () => {
    const app = createTestApp()
    const { data } = await request(app, '/throw-generic')

    const responseStr = JSON.stringify(data)
    expect(responseStr).not.toMatch(/\/Users\//)
    expect(responseStr).not.toMatch(/node_modules/)
    expect(responseStr).not.toMatch(/\.ts/)
  })
})
