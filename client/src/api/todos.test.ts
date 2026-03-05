import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchTodos, createTodo } from './todos'
import type { Todo, ApiError } from '../types/todo'

const mockTodo: Todo = {
  id: 'test-uuid-1',
  text: 'Buy milk',
  completed: false,
  createdAt: '2026-03-05T00:00:00.000Z',
  updatedAt: '2026-03-05T00:00:00.000Z',
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('fetchTodos', () => {
  it('returns an array of todos on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([mockTodo]), { status: 200 })
    )

    const todos = await fetchTodos()

    expect(todos).toEqual([mockTodo])
    expect(fetch).toHaveBeenCalledWith('/api/todos')
  })

  it('returns an empty array when no todos exist', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 })
    )

    const todos = await fetchTodos()

    expect(todos).toEqual([])
  })

  it('throws a typed ApiError on error response', async () => {
    const errorBody: ApiError = {
      error: { message: 'Internal error', code: 'INTERNAL_ERROR' },
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(errorBody), { status: 500 })
    )

    await expect(fetchTodos()).rejects.toEqual(errorBody)
  })

  it('throws on network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(fetchTodos()).rejects.toThrow('Failed to fetch')
  })
})

describe('createTodo', () => {
  it('returns the created todo on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockTodo), { status: 201 })
    )

    const result = await createTodo({ id: 'test-uuid-1', text: 'Buy milk' })

    expect(result).toEqual(mockTodo)
    expect(fetch).toHaveBeenCalledWith('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'test-uuid-1', text: 'Buy milk' }),
    })
  })

  it('throws a typed ApiError on validation error', async () => {
    const errorBody: ApiError = {
      error: { message: 'Text is required', code: 'VALIDATION_ERROR' },
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(errorBody), { status: 400 })
    )

    await expect(createTodo({ id: 'test-uuid-1', text: '' })).rejects.toEqual(errorBody)
  })

  it('throws on network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(createTodo({ id: 'test-uuid-1', text: 'Buy milk' })).rejects.toThrow(
      'Failed to fetch'
    )
  })
})
