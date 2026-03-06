import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, afterEach } from 'vitest'
import TaskList from './TaskList'
import type { Todo } from '../types/todo'

const mockTodos: Todo[] = [
  {
    id: '1',
    text: 'Buy milk',
    completed: false,
    createdAt: '2026-03-05T00:00:00.000Z',
    updatedAt: '2026-03-05T00:00:00.000Z',
  },
  {
    id: '2',
    text: 'Walk the dog',
    completed: true,
    createdAt: '2026-03-05T01:00:00.000Z',
    updatedAt: '2026-03-05T01:00:00.000Z',
  },
]

describe('TaskList', () => {
  it('renders loading indicator when isLoading is true', () => {
    render(<TaskList todos={[]} isLoading={true} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Loading tasks…')).toBeInTheDocument()
  })

  it('renders EmptyState when no todos and not loading', () => {
    render(<TaskList todos={[]} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('No tasks yet')).toBeInTheDocument()
  })

  it('renders todos in a list', () => {
    render(<TaskList todos={mockTodos} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
    expect(screen.getByText('Walk the dog')).toBeInTheDocument()
  })

  it('uses proper list semantics', () => {
    render(<TaskList todos={mockTodos} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByRole('list', { name: 'Task list' })).toBeInTheDocument()
  })

  it('has a visually-hidden live region with aria-live="polite"', () => {
    const { container } = render(<TaskList todos={mockTodos} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    const liveRegion = container.querySelector('[aria-live="polite"]')
    expect(liveRegion).toBeInTheDocument()
    expect(liveRegion).toHaveClass('sr-only')
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true')
  })

  it('live region has aria-busy="true" during loading', () => {
    const { container } = render(<TaskList todos={[]} isLoading={true} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    const liveRegion = container.querySelector('[aria-live="polite"]')
    expect(liveRegion).toHaveAttribute('aria-busy', 'true')
  })

  it('live region has aria-busy="false" when not loading', () => {
    const { container } = render(<TaskList todos={mockTodos} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    const liveRegion = container.querySelector('[aria-live="polite"]')
    expect(liveRegion).toHaveAttribute('aria-busy', 'false')
  })

  it('does not render EmptyState when loading', () => {
    render(<TaskList todos={[]} isLoading={true} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.queryByText('No tasks yet')).not.toBeInTheDocument()
  })

  it('does not render loading when todos exist', () => {
    render(<TaskList todos={mockTodos} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.queryByText('Loading tasks…')).not.toBeInTheDocument()
  })

  it('renders TaskItem components with checkboxes', () => {
    render(<TaskList todos={mockTodos} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(2)
  })

  it('passes onToggle to TaskItem components', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    render(<TaskList todos={mockTodos} isLoading={false} onToggle={onToggle} onEdit={vi.fn()} onDelete={vi.fn()} />)
    await user.click(screen.getAllByRole('checkbox')[0])
    expect(onToggle).toHaveBeenCalledWith('1', true)
  })

  it('passes onEdit to TaskItem components', async () => {
    const onEdit = vi.fn()
    const user = userEvent.setup()
    render(<TaskList todos={mockTodos} isLoading={false} onToggle={vi.fn()} onEdit={onEdit} onDelete={vi.fn()} />)
    await user.click(screen.getByText('Buy milk'))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'Buy eggs{Enter}')
    expect(onEdit).toHaveBeenCalledWith('1', 'Buy eggs')
  })

  it('passes onDelete to TaskItem components', async () => {
    const onDelete = vi.fn()
    const user = userEvent.setup()
    render(<TaskList todos={mockTodos} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={onDelete} />)
    const deleteBtns = screen.getAllByRole('button', { name: /Delete task/ })
    await user.click(deleteBtns[0])
    // Simulate animationend since JSDOM doesn't run CSS animations
    const li = deleteBtns[0].closest('li')!
    li.dispatchEvent(new Event('animationend'))
    expect(onDelete).toHaveBeenCalledWith('1')
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  describe('live region announcements', () => {
    it('announces when a task is added', () => {
      const { container, rerender } = render(
        <TaskList todos={mockTodos} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
      )
      const newTodo: Todo = {
        id: '3',
        text: 'Read a book',
        completed: false,
        createdAt: '2026-03-05T02:00:00.000Z',
        updatedAt: '2026-03-05T02:00:00.000Z',
      }
      rerender(
        <TaskList todos={[...mockTodos, newTodo]} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
      )
      const liveRegion = container.querySelector('[aria-live="polite"]')
      expect(liveRegion).toHaveTextContent('Task added: Read a book')
    })

    it('announces when a task is deleted', () => {
      const { container, rerender } = render(
        <TaskList todos={mockTodos} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
      )
      rerender(
        <TaskList todos={[mockTodos[1]]} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
      )
      const liveRegion = container.querySelector('[aria-live="polite"]')
      expect(liveRegion).toHaveTextContent('Task deleted: Buy milk')
    })

    it('announces when a task is completed', () => {
      const { container, rerender } = render(
        <TaskList todos={mockTodos} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
      )
      const updatedTodos = [
        { ...mockTodos[0], completed: true },
        mockTodos[1],
      ]
      rerender(
        <TaskList todos={updatedTodos} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
      )
      const liveRegion = container.querySelector('[aria-live="polite"]')
      expect(liveRegion).toHaveTextContent('Task completed: Buy milk')
    })

    it('announces when a task is marked incomplete', () => {
      const { container, rerender } = render(
        <TaskList todos={mockTodos} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
      )
      const updatedTodos = [
        mockTodos[0],
        { ...mockTodos[1], completed: false },
      ]
      rerender(
        <TaskList todos={updatedTodos} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
      )
      const liveRegion = container.querySelector('[aria-live="polite"]')
      expect(liveRegion).toHaveTextContent('Task marked incomplete: Walk the dog')
    })

    it('does not announce on initial load', () => {
      const { container } = render(
        <TaskList todos={mockTodos} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
      )
      const liveRegion = container.querySelector('[aria-live="polite"]')
      expect(liveRegion).toHaveTextContent('')
    })

    it('re-announces when identical announcement is repeated', () => {
      vi.useFakeTimers()
      try {
        const todo3: Todo = {
          id: '3',
          text: 'Buy milk',
          completed: false,
          createdAt: '2026-03-05T02:00:00.000Z',
          updatedAt: '2026-03-05T02:00:00.000Z',
        }
        const todo4: Todo = {
          id: '4',
          text: 'Buy milk',
          completed: false,
          createdAt: '2026-03-05T03:00:00.000Z',
          updatedAt: '2026-03-05T03:00:00.000Z',
        }
        const { container, rerender } = render(
          <TaskList todos={mockTodos} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
        )
        const liveRegion = container.querySelector('[aria-live="polite"]')

        // First add: "Task added: Buy milk"
        rerender(
          <TaskList todos={[...mockTodos, todo3]} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
        )
        expect(liveRegion).toHaveTextContent('Task added: Buy milk')

        // Second add with same name: clears first, then re-sets after timeout
        rerender(
          <TaskList todos={[...mockTodos, todo3, todo4]} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
        )
        // Immediately after, the live region is cleared to force DOM change
        expect(liveRegion).toHaveTextContent('')

        // After timeout, the announcement is re-set
        act(() => { vi.advanceTimersByTime(50) })
        expect(liveRegion).toHaveTextContent('Task added: Buy milk')
      } finally {
        vi.useRealTimers()
      }
    })
  })

  describe('focus management after deletion', () => {
    it('focuses next task checkbox after deleting first task', async () => {
      const user = userEvent.setup()
      const onDelete = vi.fn()
      const { rerender } = render(
        <TaskList todos={mockTodos} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={onDelete} />
      )
      const deleteBtns = screen.getAllByRole('button', { name: /Delete task/ })
      await user.click(deleteBtns[0])
      const li = deleteBtns[0].closest('li')!
      li.dispatchEvent(new Event('animationend'))
      // Re-render with first item removed (simulating optimistic update)
      rerender(
        <TaskList todos={[mockTodos[1]]} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={onDelete} />
      )
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveFocus()
    })

    it('focuses input when only task is deleted', async () => {
      const singleTodo: Todo[] = [mockTodos[0]]
      const user = userEvent.setup()
      const onDelete = vi.fn()
      const { rerender } = render(
        <TaskList todos={singleTodo} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={onDelete} />
      )

      // Add TaskInput to DOM for focus target
      const input = document.createElement('input')
      input.setAttribute('aria-label', 'Add a new task')
      document.body.appendChild(input)

      const deleteBtns = screen.getAllByRole('button', { name: /Delete task/ })
      await user.click(deleteBtns[0])
      const li = deleteBtns[0].closest('li')!
      li.dispatchEvent(new Event('animationend'))

      rerender(
        <TaskList todos={[]} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={onDelete} />
      )

      expect(input).toHaveFocus()
      document.body.removeChild(input)
    })

    it('focuses previous task checkbox after deleting last task', async () => {
      const user = userEvent.setup()
      const onDelete = vi.fn()
      const { rerender } = render(
        <TaskList todos={mockTodos} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={onDelete} />
      )
      const deleteBtns = screen.getAllByRole('button', { name: /Delete task/ })
      await user.click(deleteBtns[1])
      const li = deleteBtns[1].closest('li')!
      li.dispatchEvent(new Event('animationend'))
      // Re-render with last item removed
      rerender(
        <TaskList todos={[mockTodos[0]]} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={onDelete} />
      )
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveFocus()
    })
  })
})
