import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useOptimisticTodos } from './useOptimisticTodos'
import * as todosApi from '../api/todos'
import type { Todo } from '../types/todo'

vi.mock('../api/todos')

const mockTodo: Todo = {
  id: 'server-uuid-1',
  text: 'Buy milk',
  completed: false,
  createdAt: '2026-03-05T00:00:00.000Z',
  updatedAt: '2026-03-05T00:00:00.000Z',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useOptimisticTodos', () => {
  it('starts with loading true and empty todos', () => {
    vi.mocked(todosApi.fetchTodos).mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useOptimisticTodos())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.todos).toEqual([])
  })

  it('fetches todos on mount and sets loading to false', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([mockTodo])

    const { result } = renderHook(() => useOptimisticTodos())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.todos).toEqual([mockTodo])
    expect(todosApi.fetchTodos).toHaveBeenCalled()
  })

  it('sets loading to false even when fetch fails', async () => {
    vi.mocked(todosApi.fetchTodos).mockRejectedValue(
      new Error('Network error')
    )

    const { result } = renderHook(() => useOptimisticTodos())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.todos).toEqual([])
    expect(result.current.errors.length).toBe(1)
  })

  it('optimistically adds a todo before API responds', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([])
    vi.mocked(todosApi.createTodo).mockReturnValue(new Promise(() => {}))

    const mockRandomUUID = vi.fn().mockReturnValue('client-uuid-1')
    vi.stubGlobal('crypto', { randomUUID: mockRandomUUID })

    const { result } = renderHook(() => useOptimisticTodos())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.addTodo('New task')
    })

    expect(result.current.todos).toHaveLength(1)
    expect(result.current.todos[0].text).toBe('New task')
    expect(result.current.todos[0].id).toBe('client-uuid-1')

    vi.unstubAllGlobals()
  })

  it('silently ignores empty text', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([])

    const { result } = renderHook(() => useOptimisticTodos())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.addTodo('')
    })

    expect(result.current.todos).toHaveLength(0)
    expect(todosApi.createTodo).not.toHaveBeenCalled()
  })

  it('silently ignores whitespace-only text', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([])

    const { result } = renderHook(() => useOptimisticTodos())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.addTodo('   ')
    })

    expect(result.current.todos).toHaveLength(0)
    expect(todosApi.createTodo).not.toHaveBeenCalled()
  })

  it('rolls back and adds error on API failure', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([mockTodo])
    vi.mocked(todosApi.createTodo).mockRejectedValue(
      { error: { message: 'Server error', code: 'INTERNAL_ERROR' } }
    )

    const mockRandomUUID = vi.fn().mockReturnValue('client-uuid-2')
    vi.stubGlobal('crypto', { randomUUID: mockRandomUUID })

    const { result } = renderHook(() => useOptimisticTodos())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.todos).toHaveLength(1)

    await act(async () => {
      result.current.addTodo('Will fail')
    })

    // Should rollback to original todos (just mockTodo)
    expect(result.current.todos).toHaveLength(1)
    expect(result.current.todos[0].id).toBe('server-uuid-1')
    expect(result.current.errors.length).toBeGreaterThan(0)

    vi.unstubAllGlobals()
  })
})
