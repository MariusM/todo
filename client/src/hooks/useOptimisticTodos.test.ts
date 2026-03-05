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
    expect(result.current.errors).toHaveLength(1)
    expect(result.current.errors[0]).toEqual({ message: 'Network error', code: 'FETCH_ERROR' })
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

  it('dismissError removes the error at given index', async () => {
    vi.mocked(todosApi.fetchTodos).mockRejectedValue(
      new Error('Network error')
    )

    const { result } = renderHook(() => useOptimisticTodos())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.errors).toHaveLength(1)

    act(() => {
      result.current.dismissError(0)
    })

    expect(result.current.errors).toHaveLength(0)
  })

  it('dismissError removes only the error at specified index', async () => {
    // Create two errors: fetch error + create error
    vi.mocked(todosApi.fetchTodos).mockRejectedValue(
      new Error('Fetch failed')
    )

    const { result } = renderHook(() => useOptimisticTodos())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Add a second error by triggering a failed create
    vi.mocked(todosApi.createTodo).mockRejectedValue(
      { error: { message: 'Create failed', code: 'INTERNAL_ERROR' } }
    )
    const mockRandomUUID = vi.fn().mockReturnValue('dismiss-uuid-1')
    vi.stubGlobal('crypto', { randomUUID: mockRandomUUID })

    await act(async () => {
      result.current.addTodo('Will fail')
    })

    expect(result.current.errors).toHaveLength(2)
    expect(result.current.errors[0].message).toBe('Fetch failed')
    expect(result.current.errors[1].message).toBe('Create failed')

    // Dismiss the first error
    act(() => {
      result.current.dismissError(0)
    })

    expect(result.current.errors).toHaveLength(1)
    expect(result.current.errors[0].message).toBe('Create failed')

    vi.unstubAllGlobals()
  })

  it('rolls back completion toggle on API failure', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([mockTodo])
    vi.mocked(todosApi.updateTodo).mockRejectedValue(
      { error: { message: 'Toggle failed', code: 'INTERNAL_ERROR' } }
    )

    const { result } = renderHook(() => useOptimisticTodos())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.todos[0].completed).toBe(false)

    await act(async () => {
      result.current.updateTodo('server-uuid-1', { completed: true })
    })

    // Should revert to original completed state
    expect(result.current.todos[0].completed).toBe(false)
    expect(result.current.errors).toHaveLength(1)
    expect(result.current.errors[0].code).toBe('UPDATE_ERROR')
  })

  it('adds error with correct code and message for each failure type', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([mockTodo])

    // Test CREATE_ERROR
    vi.mocked(todosApi.createTodo).mockRejectedValue(
      { error: { message: 'Create server error', code: 'INTERNAL_ERROR' } }
    )
    const mockRandomUUID = vi.fn().mockReturnValue('err-uuid-1')
    vi.stubGlobal('crypto', { randomUUID: mockRandomUUID })

    const { result } = renderHook(() => useOptimisticTodos())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      result.current.addTodo('Will fail')
    })

    expect(result.current.errors[0]).toEqual({ message: 'Create server error', code: 'CREATE_ERROR' })

    // Test UPDATE_ERROR
    vi.mocked(todosApi.updateTodo).mockRejectedValue(
      { error: { message: 'Update server error', code: 'INTERNAL_ERROR' } }
    )

    await act(async () => {
      result.current.updateTodo('server-uuid-1', { text: 'Fail' })
    })

    expect(result.current.errors[1]).toEqual({ message: 'Update server error', code: 'UPDATE_ERROR' })

    // Test DELETE_ERROR
    vi.mocked(todosApi.deleteTodo).mockRejectedValue(
      { error: { message: 'Delete server error', code: 'INTERNAL_ERROR' } }
    )

    await act(async () => {
      result.current.deleteTodo('server-uuid-1')
    })

    expect(result.current.errors[2]).toEqual({ message: 'Delete server error', code: 'DELETE_ERROR' })

    vi.unstubAllGlobals()
  })

  it('rolls back delete to original position on API failure', async () => {
    const todo1: Todo = { id: 'id-1', text: 'First', completed: false, createdAt: '2026-03-05T00:00:00.000Z', updatedAt: '2026-03-05T00:00:00.000Z' }
    const todo2: Todo = { id: 'id-2', text: 'Second', completed: false, createdAt: '2026-03-05T00:01:00.000Z', updatedAt: '2026-03-05T00:01:00.000Z' }
    const todo3: Todo = { id: 'id-3', text: 'Third', completed: false, createdAt: '2026-03-05T00:02:00.000Z', updatedAt: '2026-03-05T00:02:00.000Z' }

    vi.mocked(todosApi.fetchTodos).mockResolvedValue([todo1, todo2, todo3])
    vi.mocked(todosApi.deleteTodo).mockRejectedValue(
      { error: { message: 'Delete failed', code: 'INTERNAL_ERROR' } }
    )

    const { result } = renderHook(() => useOptimisticTodos())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.todos).toHaveLength(3)

    // Delete the middle item
    await act(async () => {
      result.current.deleteTodo('id-2')
    })

    // After rollback, item should be back at original position (index 1)
    expect(result.current.todos).toHaveLength(3)
    expect(result.current.todos[0].id).toBe('id-1')
    expect(result.current.todos[1].id).toBe('id-2')
    expect(result.current.todos[2].id).toBe('id-3')
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

  it('concurrent create + toggle: only failed create rolls back, toggle persists', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([mockTodo])

    let rejectCreate: (reason: unknown) => void
    vi.mocked(todosApi.createTodo).mockImplementation(
      () => new Promise((_resolve, reject) => { rejectCreate = reject })
    )
    vi.mocked(todosApi.updateTodo).mockResolvedValue({
      ...mockTodo,
      completed: true,
      updatedAt: '2026-03-05T01:00:00.000Z',
    })

    const mockRandomUUID = vi.fn().mockReturnValue('concurrent-uuid-1')
    vi.stubGlobal('crypto', { randomUUID: mockRandomUUID })

    const { result } = renderHook(() => useOptimisticTodos())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Fire create and toggle concurrently
    act(() => {
      result.current.addTodo('New task')
      result.current.updateTodo('server-uuid-1', { completed: true })
    })

    // Both changes applied optimistically
    expect(result.current.todos).toHaveLength(2)
    expect(result.current.todos[0].completed).toBe(true)

    // Fail the create
    await act(async () => {
      rejectCreate({ error: { message: 'Create failed', code: 'INTERNAL_ERROR' } })
    })

    // Create rolled back, but toggle persists
    expect(result.current.todos).toHaveLength(1)
    expect(result.current.todos[0].id).toBe('server-uuid-1')
    expect(result.current.todos[0].completed).toBe(true)
    expect(result.current.errors).toHaveLength(1)
    expect(result.current.errors[0].code).toBe('CREATE_ERROR')

    vi.unstubAllGlobals()
  })

  it('concurrent updates: only the failed update rolls back, other persists', async () => {
    const todo1: Todo = { id: 'id-a', text: 'Alpha', completed: false, createdAt: '2026-03-05T00:00:00.000Z', updatedAt: '2026-03-05T00:00:00.000Z' }
    const todo2: Todo = { id: 'id-b', text: 'Beta', completed: false, createdAt: '2026-03-05T00:01:00.000Z', updatedAt: '2026-03-05T00:01:00.000Z' }

    vi.mocked(todosApi.fetchTodos).mockResolvedValue([todo1, todo2])

    let rejectFirstUpdate: (reason: unknown) => void
    let callCount = 0
    vi.mocked(todosApi.updateTodo).mockImplementation(
      () => {
        callCount++
        if (callCount === 1) {
          return new Promise((_resolve, reject) => { rejectFirstUpdate = reject })
        }
        return Promise.resolve({ ...todo2, text: 'Beta updated', updatedAt: '2026-03-05T01:00:00.000Z' })
      }
    )

    const { result } = renderHook(() => useOptimisticTodos())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Fire two updates concurrently
    act(() => {
      result.current.updateTodo('id-a', { text: 'Alpha updated' })
      result.current.updateTodo('id-b', { text: 'Beta updated' })
    })

    // Both applied optimistically
    expect(result.current.todos[0].text).toBe('Alpha updated')
    expect(result.current.todos[1].text).toBe('Beta updated')

    // Fail the first update
    await act(async () => {
      rejectFirstUpdate({ error: { message: 'Update failed', code: 'INTERNAL_ERROR' } })
    })

    // First rolls back, second persists
    expect(result.current.todos[0].text).toBe('Alpha')
    expect(result.current.todos[1].text).toBe('Beta updated')
    expect(result.current.errors).toHaveLength(1)
    expect(result.current.errors[0].code).toBe('UPDATE_ERROR')
  })
})
