import { test, expect } from '@playwright/test'
import { deleteAllTodos } from './fixtures'

const API_BASE = 'http://localhost:3001/api'

test.describe('API Contract Tests', () => {
  test.beforeEach(async () => {
    await deleteAllTodos()
  })

  test.describe('GET /api/health', () => {
    test('returns 200 with status and timestamp', async ({ request }) => {
      const res = await request.get(`${API_BASE}/health`)

      expect(res.status()).toBe(200)
      const body = await res.json()
      expect(body).toHaveProperty('status', 'ok')
      expect(body).toHaveProperty('timestamp')
      expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp)
    })
  })

  test.describe('POST /api/todos', () => {
    test('creates a todo and returns 201 with correct shape', async ({ request }) => {
      const id = '550e8400-e29b-41d4-a716-446655440100'
      const res = await request.post(`${API_BASE}/todos`, {
        data: { id, text: 'Contract test todo' },
      })

      expect(res.status()).toBe(201)
      const body = await res.json()
      expect(body).toEqual(
        expect.objectContaining({
          id,
          text: 'Contract test todo',
          completed: false,
        })
      )
      expect(body).toHaveProperty('createdAt')
      expect(body).toHaveProperty('updatedAt')
      expect(body).not.toHaveProperty('created_at')
      expect(body).not.toHaveProperty('updated_at')
    })

    test('returns 400 with error shape for empty text', async ({ request }) => {
      const res = await request.post(`${API_BASE}/todos`, {
        data: { id: '550e8400-e29b-41d4-a716-446655440101', text: '' },
      })

      expect(res.status()).toBe(400)
      const body = await res.json()
      expect(body.error).toEqual(
        expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: 'Todo text cannot be empty',
        })
      )
    })

    test('returns 400 for invalid UUID', async ({ request }) => {
      const res = await request.post(`${API_BASE}/todos`, {
        data: { id: 'bad-id', text: 'Test' },
      })

      expect(res.status()).toBe(400)
      const body = await res.json()
      expect(body.error).toHaveProperty('code', 'VALIDATION_ERROR')
    })

    test('returns 400 for duplicate ID', async ({ request }) => {
      const id = '550e8400-e29b-41d4-a716-446655440102'
      await request.post(`${API_BASE}/todos`, {
        data: { id, text: 'First' },
      })

      const res = await request.post(`${API_BASE}/todos`, {
        data: { id, text: 'Duplicate' },
      })

      expect(res.status()).toBe(400)
      const body = await res.json()
      expect(body.error).toHaveProperty('code', 'VALIDATION_ERROR')
    })

    test('trims whitespace from text', async ({ request }) => {
      const res = await request.post(`${API_BASE}/todos`, {
        data: { id: '550e8400-e29b-41d4-a716-446655440103', text: '  Trimmed  ' },
      })

      expect(res.status()).toBe(201)
      const body = await res.json()
      expect(body.text).toBe('Trimmed')
    })

    test('sanitizes HTML to prevent XSS', async ({ request }) => {
      const res = await request.post(`${API_BASE}/todos`, {
        data: {
          id: '550e8400-e29b-41d4-a716-446655440104',
          text: '<script>alert("xss")</script>',
        },
      })

      expect(res.status()).toBe(201)
      const body = await res.json()
      expect(body.text).not.toContain('<script>')
    })
  })

  test.describe('GET /api/todos', () => {
    test('returns 200 with empty array when no todos', async ({ request }) => {
      const res = await request.get(`${API_BASE}/todos`)

      expect(res.status()).toBe(200)
      const body = await res.json()
      expect(body).toEqual([])
    })

    test('returns todos with correct shape and order', async ({ request }) => {
      await request.post(`${API_BASE}/todos`, {
        data: { id: '550e8400-e29b-41d4-a716-446655440110', text: 'First' },
      })
      await request.post(`${API_BASE}/todos`, {
        data: { id: '550e8400-e29b-41d4-a716-446655440111', text: 'Second' },
      })

      const res = await request.get(`${API_BASE}/todos`)
      expect(res.status()).toBe(200)

      const body = await res.json()
      expect(body).toHaveLength(2)
      expect(body[0].text).toBe('First')
      expect(body[1].text).toBe('Second')

      for (const todo of body) {
        expect(todo).toHaveProperty('id')
        expect(todo).toHaveProperty('text')
        expect(todo).toHaveProperty('completed')
        expect(todo).toHaveProperty('createdAt')
        expect(todo).toHaveProperty('updatedAt')
        expect(todo).not.toHaveProperty('created_at')
        expect(todo).not.toHaveProperty('updated_at')
      }
    })
  })

  test.describe('PATCH /api/todos/:id', () => {
    const id = '550e8400-e29b-41d4-a716-446655440120'

    test.beforeEach(async ({ request }) => {
      await request.post(`${API_BASE}/todos`, {
        data: { id, text: 'Original' },
      })
    })

    test('updates text and returns 200 with full todo', async ({ request }) => {
      const res = await request.patch(`${API_BASE}/todos/${id}`, {
        data: { text: 'Updated' },
      })

      expect(res.status()).toBe(200)
      const body = await res.json()
      expect(body).toEqual(
        expect.objectContaining({
          id,
          text: 'Updated',
          completed: false,
        })
      )
      expect(body).toHaveProperty('createdAt')
      expect(body).toHaveProperty('updatedAt')
    })

    test('updates completed status', async ({ request }) => {
      const res = await request.patch(`${API_BASE}/todos/${id}`, {
        data: { completed: true },
      })

      expect(res.status()).toBe(200)
      const body = await res.json()
      expect(body.completed).toBe(true)
      expect(body.text).toBe('Original')
    })

    test('returns 404 for non-existent todo', async ({ request }) => {
      const res = await request.patch(
        `${API_BASE}/todos/550e8400-e29b-41d4-a716-446655440199`,
        { data: { text: 'Nope' } }
      )

      expect(res.status()).toBe(404)
      const body = await res.json()
      expect(body.error).toEqual(
        expect.objectContaining({
          code: 'NOT_FOUND',
          message: 'Todo not found',
        })
      )
    })

    test('returns 400 for invalid UUID in path', async ({ request }) => {
      const res = await request.patch(`${API_BASE}/todos/not-a-uuid`, {
        data: { text: 'Bad ID' },
      })

      expect(res.status()).toBe(400)
      const body = await res.json()
      expect(body.error).toHaveProperty('code', 'VALIDATION_ERROR')
    })

    test('returns 400 for empty text', async ({ request }) => {
      const res = await request.patch(`${API_BASE}/todos/${id}`, {
        data: { text: '' },
      })

      expect(res.status()).toBe(400)
      const body = await res.json()
      expect(body.error).toHaveProperty('code', 'VALIDATION_ERROR')
    })
  })

  test.describe('DELETE /api/todos/:id', () => {
    test('deletes a todo and returns 204', async ({ request }) => {
      const id = '550e8400-e29b-41d4-a716-446655440130'
      await request.post(`${API_BASE}/todos`, {
        data: { id, text: 'To delete' },
      })

      const res = await request.delete(`${API_BASE}/todos/${id}`)
      expect(res.status()).toBe(204)

      // Verify it's gone
      const getRes = await request.get(`${API_BASE}/todos`)
      const todos = await getRes.json()
      expect(todos.find((t: { id: string }) => t.id === id)).toBeUndefined()
    })

    test('returns 404 for non-existent todo', async ({ request }) => {
      const res = await request.delete(
        `${API_BASE}/todos/550e8400-e29b-41d4-a716-446655440199`
      )

      expect(res.status()).toBe(404)
      const body = await res.json()
      expect(body.error).toEqual(
        expect.objectContaining({
          code: 'NOT_FOUND',
          message: 'Todo not found',
        })
      )
    })

    test('returns 400 for invalid UUID', async ({ request }) => {
      const res = await request.delete(`${API_BASE}/todos/not-a-uuid`)

      expect(res.status()).toBe(400)
      const body = await res.json()
      expect(body.error).toHaveProperty('code', 'VALIDATION_ERROR')
    })
  })
})
