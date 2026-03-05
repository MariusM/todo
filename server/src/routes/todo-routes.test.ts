import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import express from 'express'
import { initDatabase } from '../db/init.js'
import { createQueries } from '../db/queries.js'
import { createTodoRoutes } from './todo-routes.js'
import { errorHandler } from '../middleware/error-handler.js'
import type { Server } from 'http'

let server: Server
let port: number

function createTestApp() {
  const db = initDatabase(':memory:')
  const queries = createQueries(db)
  const app = express()
  app.use(express.json())
  app.use(createTodoRoutes(queries))
  app.use(errorHandler)
  return { app, db }
}

const { app, db } = createTestApp()

beforeAll(async () => {
  server = app.listen(0)
  const address = server.address()
  port = typeof address === 'object' && address ? address.port : 0
})

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
  db.close()
})

function url(path: string) {
  return `http://localhost:${port}${path}`
}

describe('POST /api/todos', () => {
  it('creates a todo and returns 201', async () => {
    const id = '550e8400-e29b-41d4-a716-446655440000'
    const res = await fetch(url('/api/todos'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, text: 'Buy milk' }),
    })

    expect(res.status).toBe(201)
    const todo = await res.json()
    expect(todo.id).toBe(id)
    expect(todo.text).toBe('Buy milk')
    expect(todo.completed).toBe(false)
    expect(todo.createdAt).toBeDefined()
    expect(todo.updatedAt).toBeDefined()
  })

  it('returns 400 for empty text', async () => {
    const res = await fetch(url('/api/todos'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: '550e8400-e29b-41d4-a716-446655440001', text: '' }),
    })

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error.code).toBe('VALIDATION_ERROR')
    expect(data.error.message).toBe('Todo text cannot be empty')
  })

  it('returns 400 for invalid UUID', async () => {
    const res = await fetch(url('/api/todos'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'not-valid', text: 'Test' }),
    })

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('trims text before storing', async () => {
    const id = '550e8400-e29b-41d4-a716-446655440010'
    const res = await fetch(url('/api/todos'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, text: '  Buy eggs  ' }),
    })

    expect(res.status).toBe(201)
    const todo = await res.json()
    expect(todo.text).toBe('Buy eggs')
  })

  it('sanitizes HTML in text to prevent XSS', async () => {
    const id = '550e8400-e29b-41d4-a716-446655440011'
    const res = await fetch(url('/api/todos'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, text: '<script>alert("xss")</script>' }),
    })

    expect(res.status).toBe(201)
    const todo = await res.json()
    expect(todo.text).not.toContain('<script>')
    expect(todo.text).toContain('&lt;script&gt;')
  })

  it('returns error for duplicate ID', async () => {
    const id = '550e8400-e29b-41d4-a716-446655440002'
    await fetch(url('/api/todos'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, text: 'First' }),
    })

    const res = await fetch(url('/api/todos'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, text: 'Duplicate' }),
    })

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('created todo has ISO 8601 timestamp', async () => {
    const id = '550e8400-e29b-41d4-a716-446655440003'
    const res = await fetch(url('/api/todos'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, text: 'Check timestamp' }),
    })

    const todo = await res.json()
    expect(() => new Date(todo.createdAt)).not.toThrow()
    expect(new Date(todo.createdAt).toISOString()).toContain('T')
  })
})

describe('GET /api/todos', () => {
  it('returns empty array when no todos exist', async () => {
    const emptyDb = initDatabase(':memory:')
    const emptyQueries = createQueries(emptyDb)
    const emptyApp = express()
    emptyApp.use(express.json())
    emptyApp.use(createTodoRoutes(emptyQueries))
    emptyApp.use(errorHandler)

    const emptyServer = emptyApp.listen(0)
    const emptyAddress = emptyServer.address()
    const emptyPort = typeof emptyAddress === 'object' && emptyAddress ? emptyAddress.port : 0

    const res = await fetch(`http://localhost:${emptyPort}/api/todos`)
    expect(res.status).toBe(200)
    const todos = await res.json()
    expect(Array.isArray(todos)).toBe(true)
    expect(todos.length).toBe(0)

    await new Promise<void>((resolve) => emptyServer.close(() => resolve()))
    emptyDb.close()
  })

  it('returns all todos as array', async () => {
    const res = await fetch(url('/api/todos'))

    expect(res.status).toBe(200)
    const todos = await res.json()
    expect(Array.isArray(todos)).toBe(true)
    expect(todos.length).toBeGreaterThan(0)
  })

  it('returns todos with camelCase fields', async () => {
    const res = await fetch(url('/api/todos'))
    const todos = await res.json()

    const todo = todos[0]
    expect(todo).toHaveProperty('id')
    expect(todo).toHaveProperty('text')
    expect(todo).toHaveProperty('completed')
    expect(todo).toHaveProperty('createdAt')
    expect(todo).toHaveProperty('updatedAt')
    expect(todo).not.toHaveProperty('created_at')
    expect(todo).not.toHaveProperty('updated_at')
  })

  it('returns todos ordered by created_at', async () => {
    const res = await fetch(url('/api/todos'))
    const todos = await res.json()

    for (let i = 1; i < todos.length; i++) {
      expect(new Date(todos[i].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(todos[i - 1].createdAt).getTime()
      )
    }
  })
})
