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

  it('rolls back only the failed todo and adds error on API failure', async () => {
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

    // Should remove only the failed todo, keeping the original
    expect(result.current.todos).toHaveLength(1)
    expect(result.current.todos[0].id).toBe('server-uuid-1')
    expect(result.current.errors.length).toBeGreaterThan(0)
    expect(result.current.errors[0].message).toBe('Server error')

    vi.unstubAllGlobals()
  })

  it('optimistically updates a todo', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([mockTodo])
    vi.mocked(todosApi.updateTodo).mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useOptimisticTodos())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.updateTodo('server-uuid-1', { text: 'Updated milk' })
    })

    expect(result.current.todos[0].text).toBe('Updated milk')
    expect(result.current.todos[0].id).toBe('server-uuid-1')
  })

  it('rolls back update on API failure', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([mockTodo])
    vi.mocked(todosApi.updateTodo).mockRejectedValue(
      { error: { message: 'Update failed', code: 'INTERNAL_ERROR' } }
    )

    const { result } = renderHook(() => useOptimisticTodos())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      result.current.updateTodo('server-uuid-1', { text: 'Will fail' })
    })

    expect(result.current.todos[0].text).toBe('Buy milk')
    expect(result.current.errors.length).toBeGreaterThan(0)
    expect(result.current.errors[0].message).toBe('Update failed')
    expect(result.current.errors[0].code).toBe('UPDATE_ERROR')
  })

  it('optimistically removes a todo on delete', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([mockTodo])
    vi.mocked(todosApi.deleteTodo).mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useOptimisticTodos())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.todos).toHaveLength(1)

    act(() => {
      result.current.deleteTodo('server-uuid-1')
    })

    expect(result.current.todos).toHaveLength(0)
  })

  it('rolls back delete on API failure', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([mockTodo])
    vi.mocked(todosApi.deleteTodo).mockRejectedValue(
      { error: { message: 'Delete failed', code: 'INTERNAL_ERROR' } }
    )

    const { result } = renderHook(() => useOptimisticTodos())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      result.current.deleteTodo('server-uuid-1')
    })

    expect(result.current.todos).toHaveLength(1)
    expect(result.current.todos[0].id).toBe('server-uuid-1')
    expect(result.current.errors.length).toBeGreaterThan(0)
    expect(result.current.errors[0].message).toBe('Delete failed')
    expect(result.current.errors[0].code).toBe('DELETE_ERROR')
  })
})
