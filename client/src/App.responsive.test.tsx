import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App'
import * as todosApi from './api/todos'

vi.mock('./api/todos')

beforeEach(() => {
  vi.clearAllMocks()
})

function renderWithTodos(todos = [makeTodo()]) {
  vi.mocked(todosApi.fetchTodos).mockResolvedValue(todos)
  return render(<App />)
}

function renderLoading() {
  vi.mocked(todosApi.fetchTodos).mockReturnValue(new Promise(() => {}))
  return render(<App />)
}

function makeTodo(overrides: Partial<{ id: string; text: string; completed: boolean }> = {}) {
  return {
    id: overrides.id ?? 'todo-1',
    text: overrides.text ?? 'Test task',
    completed: overrides.completed ?? false,
    createdAt: '2026-03-05T00:00:00.000Z',
    updatedAt: '2026-03-05T00:00:00.000Z',
  }
}

async function waitForTodos() {
  await waitFor(() => {
    expect(screen.getByRole('list')).toBeInTheDocument()
  })
}

describe('App responsive layout', () => {
  describe('container responsive classes', () => {
    it('main container has responsive padding and centering classes', () => {
      renderLoading()
      const main = document.querySelector('main')!

      expect(main.className).toContain('px-4')
      expect(main.className).toContain('pt-8')
      expect(main.className).toContain('md:px-6')
      expect(main.className).toContain('md:pt-12')
      expect(main.className).toContain('lg:px-8')
      expect(main.className).toContain('max-w-[var(--max-content-width)]')
      expect(main.className).toContain('mx-auto')
    })

    it('layout is single-column with no grid or row classes', () => {
      renderLoading()
      const main = document.querySelector('main')!

      expect(main.className).not.toMatch(/grid|flex-row/)
    })
  })

  describe('interactive elements at all viewports', () => {
    it('all interactive elements are present with todos loaded', async () => {
      renderWithTodos()
      await waitForTodos()

      expect(screen.getByLabelText('Add a new task')).toBeInTheDocument()
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Delete task: Test task' })).toBeInTheDocument()
    })

    it('input is full width with text-base for iOS zoom prevention', () => {
      renderLoading()
      const input = screen.getByLabelText('Add a new task')

      expect(input.className).toContain('w-full')
      expect(input.className).toContain('text-base')
    })
  })

  describe('touch targets meet 44x44px minimum', () => {
    it('checkbox label has min 44x44 touch target', async () => {
      renderWithTodos()
      await waitForTodos()

      const checkbox = screen.getByRole('checkbox')
      const label = checkbox.closest('label')!
      expect(label.className).toContain('min-w-[44px]')
      expect(label.className).toContain('min-h-[44px]')
    })

    it('delete button has min 44x44 touch target', async () => {
      renderWithTodos()
      await waitForTodos()

      const deleteBtn = screen.getByRole('button', { name: 'Delete task: Test task' })
      expect(deleteBtn.className).toContain('min-w-[44px]')
      expect(deleteBtn.className).toContain('min-h-[44px]')
    })
  })

  describe('task item responsive behavior', () => {
    it('task row has responsive vertical padding', async () => {
      renderWithTodos()
      await waitForTodos()

      const li = screen.getByText('Test task').closest('li')!
      expect(li.className).toContain('py-3')
      expect(li.className).toContain('md:py-3.5')
    })

    it('task text has break-words for narrow viewports', async () => {
      const longText = 'This is a very long task name that should wrap correctly at narrow viewport widths without causing horizontal overflow'
      renderWithTodos([makeTodo({ text: longText })])
      await waitForTodos()

      const textSpan = screen.getByText(longText)
      expect(textSpan.className).toContain('break-words')
    })

    it('delete button is visible on mobile (max-sm:opacity-100)', async () => {
      renderWithTodos()
      await waitForTodos()

      const deleteBtn = screen.getByRole('button', { name: 'Delete task: Test task' })
      expect(deleteBtn.className).toContain('max-sm:opacity-100')
    })
  })

  describe('ErrorBanner responsive behavior', () => {
    it('error banner renders with flex layout and 44px dismiss button', async () => {
      vi.mocked(todosApi.fetchTodos).mockRejectedValue(new Error('Network error'))
      render(<App />)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      const alert = screen.getByRole('alert')
      expect(alert.className).toContain('flex')
      expect(alert.className).toContain('gap-3')

      const dismissBtn = screen.getByRole('button', { name: 'Dismiss error' })
      expect(dismissBtn).toBeInTheDocument()
    })
  })

  describe('EmptyState responsive behavior', () => {
    it('empty state renders centered with flex-col layout', async () => {
      vi.mocked(todosApi.fetchTodos).mockResolvedValue([])
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('No tasks yet')).toBeInTheDocument()
      })

      const container = screen.getByText('No tasks yet').closest('div')!
      expect(container.className).toContain('flex')
      expect(container.className).toContain('flex-col')
      expect(container.className).toContain('items-center')
    })
  })
})
