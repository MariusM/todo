import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App'
import * as todosApi from './api/todos'

vi.mock('./api/todos')

beforeEach(() => {
  vi.clearAllMocks()
})

const LONG_TEXT = 'This is a very long task name that should wrap correctly at narrow viewport widths without causing horizontal overflow or layout issues'

describe('App responsive layout', () => {
  it('main container has responsive padding classes', () => {
    vi.mocked(todosApi.fetchTodos).mockReturnValue(new Promise(() => {}))
    const { container } = render(<App />)

    const main = container.querySelector('main')!
    // Mobile-first padding
    expect(main.className).toContain('px-4')
    expect(main.className).toContain('pt-8')
    // Tablet breakpoint
    expect(main.className).toContain('md:px-6')
    expect(main.className).toContain('md:pt-12')
    // Desktop breakpoint
    expect(main.className).toContain('lg:px-8')
  })

  it('main container has max-width and centering classes', () => {
    vi.mocked(todosApi.fetchTodos).mockReturnValue(new Promise(() => {}))
    const { container } = render(<App />)

    const main = container.querySelector('main')!
    expect(main.className).toContain('max-w-[var(--max-content-width)]')
    expect(main.className).toContain('mx-auto')
  })

  it('all interactive elements are present and functional with todos loaded', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([
      {
        id: 'todo-1',
        text: 'Test task',
        completed: false,
        createdAt: '2026-03-05T00:00:00.000Z',
        updatedAt: '2026-03-05T00:00:00.000Z',
      },
    ])

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Test task')).toBeInTheDocument()
    })

    // Input is present
    expect(screen.getByLabelText('Add a new task')).toBeInTheDocument()
    // Checkbox is present
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    // Delete button is present
    expect(screen.getByRole('button', { name: 'Delete task: Test task' })).toBeInTheDocument()
  })

  it('task text wraps correctly for long text', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([
      {
        id: 'todo-long',
        text: LONG_TEXT,
        completed: false,
        createdAt: '2026-03-05T00:00:00.000Z',
        updatedAt: '2026-03-05T00:00:00.000Z',
      },
    ])

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(LONG_TEXT)).toBeInTheDocument()
    })

    const textSpan = screen.getByText(LONG_TEXT)
    expect(textSpan.className).toContain('break-words')
  })

  it('delete button is visible on mobile (has max-sm:opacity-100)', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([
      {
        id: 'todo-1',
        text: 'Mobile task',
        completed: false,
        createdAt: '2026-03-05T00:00:00.000Z',
        updatedAt: '2026-03-05T00:00:00.000Z',
      },
    ])

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Mobile task')).toBeInTheDocument()
    })

    const deleteBtn = screen.getByRole('button', { name: 'Delete task: Mobile task' })
    expect(deleteBtn.className).toContain('max-sm:opacity-100')
  })

  it('task item has responsive vertical padding classes', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([
      {
        id: 'todo-1',
        text: 'Padded task',
        completed: false,
        createdAt: '2026-03-05T00:00:00.000Z',
        updatedAt: '2026-03-05T00:00:00.000Z',
      },
    ])

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Padded task')).toBeInTheDocument()
    })

    const li = screen.getByText('Padded task').closest('li')!
    expect(li.className).toContain('py-3')
    expect(li.className).toContain('md:py-3.5')
  })

  it('checkbox has minimum 44x44px touch target', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([
      {
        id: 'todo-1',
        text: 'Touch target task',
        completed: false,
        createdAt: '2026-03-05T00:00:00.000Z',
        updatedAt: '2026-03-05T00:00:00.000Z',
      },
    ])

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Touch target task')).toBeInTheDocument()
    })

    const checkbox = screen.getByRole('checkbox')
    const label = checkbox.closest('label')!
    expect(label.className).toContain('min-w-[44px]')
    expect(label.className).toContain('min-h-[44px]')
  })

  it('delete button has minimum 44x44px touch target', async () => {
    vi.mocked(todosApi.fetchTodos).mockResolvedValue([
      {
        id: 'todo-1',
        text: 'Delete target task',
        completed: false,
        createdAt: '2026-03-05T00:00:00.000Z',
        updatedAt: '2026-03-05T00:00:00.000Z',
      },
    ])

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Delete target task')).toBeInTheDocument()
    })

    const deleteBtn = screen.getByRole('button', { name: 'Delete task: Delete target task' })
    expect(deleteBtn.className).toContain('min-w-[44px]')
    expect(deleteBtn.className).toContain('min-h-[44px]')
  })

  it('input is full width at all breakpoints', () => {
    vi.mocked(todosApi.fetchTodos).mockReturnValue(new Promise(() => {}))
    render(<App />)

    const input = screen.getByLabelText('Add a new task')
    expect(input.className).toContain('w-full')
  })

  it('input has text-base for 16px font (prevents iOS zoom)', () => {
    vi.mocked(todosApi.fetchTodos).mockReturnValue(new Promise(() => {}))
    render(<App />)

    const input = screen.getByLabelText('Add a new task')
    expect(input.className).toContain('text-base')
  })
})
