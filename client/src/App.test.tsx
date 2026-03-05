import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
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
