import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App'
import * as todosApi from './api/todos'

vi.mock('./api/todos')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('App', () => {
  it('renders the app heading', () => {
    vi.mocked(todosApi.fetchTodos).mockReturnValue(new Promise(() => {}))
    render(<App />)
    expect(screen.getByText('Todo')).toBeInTheDocument()
  })

  it('shows loading state then empty state', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([])

    render(<App />)

    // Initially loading
    expect(screen.getByText('Loading tasks…')).toBeInTheDocument()

    // Then empty state
    await waitFor(() => {
      expect(screen.getByText('No tasks yet')).toBeInTheDocument()
    })
  })

  it('shows todos after loading', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([
      {
        id: '1',
        text: 'Existing task',
        completed: false,
        createdAt: '2026-03-05T00:00:00.000Z',
        updatedAt: '2026-03-05T00:00:00.000Z',
      },
    ])

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Existing task')).toBeInTheDocument()
    })
  })

  it('adds a task optimistically on Enter', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([])
    vi.mocked(todosApi.createTodo).mockReturnValue(new Promise(() => {}))

    const mockRandomUUID = vi.fn().mockReturnValue('new-uuid-1')
    vi.stubGlobal('crypto', { randomUUID: mockRandomUUID })

    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('No tasks yet')).toBeInTheDocument()
    })

    const input = screen.getByLabelText('Add a new task')
    await user.type(input, 'Buy milk{Enter}')

    expect(screen.getByText('Buy milk')).toBeInTheDocument()
    expect(screen.queryByText('No tasks yet')).not.toBeInTheDocument()
    expect(input).toHaveValue('')
    expect(input).toHaveFocus()

    vi.unstubAllGlobals()
  })

  it('rolls back optimistic add on API failure', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([])

    let rejectCreate: (reason: unknown) => void
    vi.mocked(todosApi.createTodo).mockImplementation(
      () => new Promise((_resolve, reject) => { rejectCreate = reject })
    )

    const mockRandomUUID = vi.fn().mockReturnValue('fail-uuid-1')
    vi.stubGlobal('crypto', { randomUUID: mockRandomUUID })

    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('No tasks yet')).toBeInTheDocument()
    })

    const input = screen.getByLabelText('Add a new task')
    await user.type(input, 'Will fail{Enter}')

    // Task appears optimistically
    expect(screen.getByText('Will fail')).toBeInTheDocument()

    // Reject the API call
    await act(async () => {
      rejectCreate({ error: { message: 'Server error', code: 'INTERNAL_ERROR' } })
    })

    // After API rejection, task is rolled back
    await waitFor(() => {
      expect(screen.queryByText('Will fail')).not.toBeInTheDocument()
    })

    vi.unstubAllGlobals()
  })

  it('shows error banner with warm message after failed create', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([])

    let rejectCreate: (reason: unknown) => void
    vi.mocked(todosApi.createTodo).mockImplementation(
      () => new Promise((_resolve, reject) => { rejectCreate = reject })
    )

    const mockRandomUUID = vi.fn().mockReturnValue('err-uuid-1')
    vi.stubGlobal('crypto', { randomUUID: mockRandomUUID })

    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('No tasks yet')).toBeInTheDocument()
    })

    const input = screen.getByLabelText('Add a new task')
    await user.type(input, 'Will fail{Enter}')

    await act(async () => {
      rejectCreate({ error: { message: 'Server error', code: 'INTERNAL_ERROR' } })
    })

    // Error banner shows warm message, not raw error
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText("Adding that task didn't go through -- try again?")).toBeInTheDocument()
    })
    expect(screen.queryByText('Server error')).not.toBeInTheDocument()

    vi.unstubAllGlobals()
  })

  it('dismiss button removes the specific error banner', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([])

    let rejectCreate: (reason: unknown) => void
    vi.mocked(todosApi.createTodo).mockImplementation(
      () => new Promise((_resolve, reject) => { rejectCreate = reject })
    )

    const mockRandomUUID = vi.fn().mockReturnValue('err-uuid-2')
    vi.stubGlobal('crypto', { randomUUID: mockRandomUUID })

    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('No tasks yet')).toBeInTheDocument()
    })

    const input = screen.getByLabelText('Add a new task')
    await user.type(input, 'Fail task{Enter}')

    await act(async () => {
      rejectCreate({ error: { message: 'Server error', code: 'INTERNAL_ERROR' } })
    })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    // Click dismiss
    const dismissBtn = screen.getByRole('button', { name: 'Dismiss error' })
    await user.click(dismissBtn)

    // Banner should have exit animation class
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('banner-exit')

    // Fire animationend to complete dismiss
    alert.dispatchEvent(new Event('animationend'))

    // Banner is removed
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    vi.unstubAllGlobals()
  })

  it('error banner does not block task list interactions', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([
      {
        id: 'todo-1',
        text: 'Existing task',
        completed: false,
        createdAt: '2026-03-05T00:00:00.000Z',
        updatedAt: '2026-03-05T00:00:00.000Z',
      },
    ])

    let rejectCreate: (reason: unknown) => void
    vi.mocked(todosApi.createTodo).mockImplementation(
      () => new Promise((_resolve, reject) => { rejectCreate = reject })
    )
    vi.mocked(todosApi.updateTodo).mockResolvedValue({
      id: 'todo-1',
      text: 'Existing task',
      completed: true,
      createdAt: '2026-03-05T00:00:00.000Z',
      updatedAt: '2026-03-05T00:00:00.000Z',
    })

    const mockRandomUUID = vi.fn().mockReturnValue('err-uuid-3')
    vi.stubGlobal('crypto', { randomUUID: mockRandomUUID })

    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Existing task')).toBeInTheDocument()
    })

    // Trigger an error
    const input = screen.getByLabelText('Add a new task')
    await user.type(input, 'Fail task{Enter}')

    await act(async () => {
      rejectCreate({ error: { message: 'Server error', code: 'INTERNAL_ERROR' } })
    })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    // Can still interact with task list while banner is visible
    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)
    expect(checkbox).toBeChecked()
    expect(todosApi.updateTodo).toHaveBeenCalledWith('todo-1', { completed: true })
    expect(todosApi.updateTodo).toHaveBeenCalledTimes(1)

    vi.unstubAllGlobals()
  })

  it('multiple errors display multiple banners', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([
      {
        id: 'todo-1',
        text: 'Task one',
        completed: false,
        createdAt: '2026-03-05T00:00:00.000Z',
        updatedAt: '2026-03-05T00:00:00.000Z',
      },
    ])

    let rejectCreate1: (reason: unknown) => void
    let rejectCreate2: (reason: unknown) => void
    let callCount = 0
    vi.mocked(todosApi.createTodo).mockImplementation(
      () => new Promise((_resolve, reject) => {
        callCount++
        if (callCount === 1) rejectCreate1 = reject
        else rejectCreate2 = reject
      })
    )

    const mockRandomUUID = vi.fn()
      .mockReturnValueOnce('err-uuid-4')
      .mockReturnValueOnce('err-uuid-5')
    vi.stubGlobal('crypto', { randomUUID: mockRandomUUID })

    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Task one')).toBeInTheDocument()
    })

    const input = screen.getByLabelText('Add a new task')

    // First failed create
    await user.type(input, 'Fail 1{Enter}')
    await act(async () => {
      rejectCreate1({ error: { message: 'Error 1', code: 'INTERNAL_ERROR' } })
    })

    // Second failed create
    await user.type(input, 'Fail 2{Enter}')
    await act(async () => {
      rejectCreate2({ error: { message: 'Error 2', code: 'INTERNAL_ERROR' } })
    })

    // Should see two error banners with warm messages
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert')
      expect(alerts).toHaveLength(2)
    })
    // Both should display the warm CREATE_ERROR message
    const warmMessages = screen.getAllByText("Adding that task didn't go through -- try again?")
    expect(warmMessages).toHaveLength(2)

    vi.unstubAllGlobals()
  })

  it('toggles a task to completed via checkbox', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([
      {
        id: 'todo-1',
        text: 'Buy milk',
        completed: false,
        createdAt: '2026-03-05T00:00:00.000Z',
        updatedAt: '2026-03-05T00:00:00.000Z',
      },
    ])
    vi.mocked(todosApi.updateTodo).mockResolvedValue({
      id: 'todo-1',
      text: 'Buy milk',
      completed: true,
      createdAt: '2026-03-05T00:00:00.000Z',
      updatedAt: '2026-03-05T00:00:00.000Z',
    })

    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Buy milk')).toBeInTheDocument()
    })

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()

    await user.click(checkbox)

    expect(checkbox).toBeChecked()
    expect(todosApi.updateTodo).toHaveBeenCalledWith('todo-1', { completed: true })
  })

  it('rolls back toggle completion on API failure', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([
      {
        id: 'todo-1',
        text: 'Buy milk',
        completed: false,
        createdAt: '2026-03-05T00:00:00.000Z',
        updatedAt: '2026-03-05T00:00:00.000Z',
      },
    ])

    let rejectUpdate: (reason: unknown) => void
    vi.mocked(todosApi.updateTodo).mockImplementation(
      () => new Promise((_resolve, reject) => { rejectUpdate = reject })
    )

    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Buy milk')).toBeInTheDocument()
    })

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()

    // Toggle
    await user.click(checkbox)
    expect(checkbox).toBeChecked()

    // Reject the API call
    await act(async () => {
      rejectUpdate({ error: { message: 'Update failed', code: 'INTERNAL_ERROR' } })
    })

    // Checkbox reverts
    await waitFor(() => {
      expect(checkbox).not.toBeChecked()
    })
  })

  it('rolls back edit text on API failure', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([
      {
        id: 'todo-1',
        text: 'Buy milk',
        completed: false,
        createdAt: '2026-03-05T00:00:00.000Z',
        updatedAt: '2026-03-05T00:00:00.000Z',
      },
    ])

    let rejectUpdate: (reason: unknown) => void
    vi.mocked(todosApi.updateTodo).mockImplementation(
      () => new Promise((_resolve, reject) => { rejectUpdate = reject })
    )

    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Buy milk')).toBeInTheDocument()
    })

    // Enter edit mode
    const textSpan = screen.getByRole('button', { name: 'Edit task: Buy milk' })
    await user.click(textSpan)

    const editInput = screen.getByLabelText('Edit task: Buy milk')
    await user.clear(editInput)
    await user.type(editInput, 'Buy eggs{Enter}')

    // Text changed optimistically
    await waitFor(() => {
      expect(screen.getByText('Buy eggs')).toBeInTheDocument()
    })

    // Reject the API call
    await act(async () => {
      rejectUpdate({ error: { message: 'Update failed', code: 'INTERNAL_ERROR' } })
    })

    // Text reverts
    await waitFor(() => {
      expect(screen.getByText('Buy milk')).toBeInTheDocument()
    })
    expect(screen.queryByText('Buy eggs')).not.toBeInTheDocument()
  })

  it('rolls back delete on API failure - task reappears', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([
      {
        id: 'todo-1',
        text: 'Buy milk',
        completed: false,
        createdAt: '2026-03-05T00:00:00.000Z',
        updatedAt: '2026-03-05T00:00:00.000Z',
      },
    ])

    let rejectDelete: (reason: unknown) => void
    vi.mocked(todosApi.deleteTodo).mockImplementation(
      () => new Promise((_resolve, reject) => { rejectDelete = reject })
    )

    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Buy milk')).toBeInTheDocument()
    })

    const deleteBtn = screen.getByRole('button', { name: 'Delete task: Buy milk' })
    await user.click(deleteBtn)

    // Trigger animationend for the delete animation
    const li = deleteBtn.closest('li')!
    li.dispatchEvent(new Event('animationend'))

    // Task should be removed optimistically
    await waitFor(() => {
      expect(screen.queryByText('Buy milk')).not.toBeInTheDocument()
    })

    // Reject the API call
    await act(async () => {
      rejectDelete({ error: { message: 'Delete failed', code: 'INTERNAL_ERROR' } })
    })

    // Task reappears
    await waitFor(() => {
      expect(screen.getByText('Buy milk')).toBeInTheDocument()
    })
  })

  describe('keyboard navigation', () => {
    it('tab moves focus from input to first task checkbox', async () => {
      vi.mocked(todosApi.fetchTodos).mockResolvedValue([
        {
          id: 'todo-1',
          text: 'Buy milk',
          completed: false,
          createdAt: '2026-03-05T00:00:00.000Z',
          updatedAt: '2026-03-05T00:00:00.000Z',
        },
      ])

      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('Buy milk')).toBeInTheDocument()
      })

      const input = screen.getByLabelText('Add a new task')
      expect(input).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('checkbox')).toHaveFocus()
    })

    it('tab moves through full task: checkbox -> text -> delete', async () => {
      vi.mocked(todosApi.fetchTodos).mockResolvedValue([
        {
          id: 'todo-1',
          text: 'Buy milk',
          completed: false,
          createdAt: '2026-03-05T00:00:00.000Z',
          updatedAt: '2026-03-05T00:00:00.000Z',
        },
      ])

      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('Buy milk')).toBeInTheDocument()
      })

      // Tab from input to checkbox
      await user.tab()
      expect(screen.getByRole('checkbox')).toHaveFocus()

      // Tab to text span
      await user.tab()
      expect(screen.getByRole('button', { name: /Edit task/ })).toHaveFocus()

      // Tab to delete button
      await user.tab()
      expect(screen.getByRole('button', { name: /Delete task/ })).toHaveFocus()
    })

    it('tab moves from last element of task 1 to checkbox of task 2', async () => {
      vi.mocked(todosApi.fetchTodos).mockResolvedValue([
        {
          id: 'todo-1',
          text: 'Buy milk',
          completed: false,
          createdAt: '2026-03-05T00:00:00.000Z',
          updatedAt: '2026-03-05T00:00:00.000Z',
        },
        {
          id: 'todo-2',
          text: 'Walk the dog',
          completed: false,
          createdAt: '2026-03-05T01:00:00.000Z',
          updatedAt: '2026-03-05T01:00:00.000Z',
        },
      ])

      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('Walk the dog')).toBeInTheDocument()
      })

      // Tab from input through first task
      await user.tab() // checkbox 1
      await user.tab() // text 1
      await user.tab() // delete 1
      await user.tab() // checkbox 2

      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes[1]).toHaveFocus()
    })

    it('focus moves to input after deleting only task', async () => {
      vi.mocked(todosApi.fetchTodos).mockResolvedValue([
        {
          id: 'todo-1',
          text: 'Buy milk',
          completed: false,
          createdAt: '2026-03-05T00:00:00.000Z',
          updatedAt: '2026-03-05T00:00:00.000Z',
        },
      ])
      vi.mocked(todosApi.deleteTodo).mockResolvedValue(undefined)

      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('Buy milk')).toBeInTheDocument()
      })

      const deleteBtn = screen.getByRole('button', { name: 'Delete task: Buy milk' })
      await user.click(deleteBtn)
      const li = deleteBtn.closest('li')!
      li.dispatchEvent(new Event('animationend'))

      await waitFor(() => {
        expect(screen.queryByText('Buy milk')).not.toBeInTheDocument()
      })

      expect(screen.getByLabelText('Add a new task')).toHaveFocus()
    })
  })

  it('deletes a task and calls API', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([
      {
        id: 'todo-1',
        text: 'Buy milk',
        completed: false,
        createdAt: '2026-03-05T00:00:00.000Z',
        updatedAt: '2026-03-05T00:00:00.000Z',
      },
    ])
    vi.mocked(todosApi.deleteTodo).mockResolvedValue(undefined)

    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Buy milk')).toBeInTheDocument()
    })

    const deleteBtn = screen.getByRole('button', { name: 'Delete task: Buy milk' })
    await user.click(deleteBtn)

    // Simulate animationend
    const li = deleteBtn.closest('li')!
    li.dispatchEvent(new Event('animationend'))

    // Task should be removed optimistically
    await waitFor(() => {
      expect(screen.queryByText('Buy milk')).not.toBeInTheDocument()
    })
    expect(todosApi.deleteTodo).toHaveBeenCalledWith('todo-1')
    expect(todosApi.deleteTodo).toHaveBeenCalledTimes(1)
  })
})
