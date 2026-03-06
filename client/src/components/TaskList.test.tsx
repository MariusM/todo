import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
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

  it('has aria-live for screen reader announcements', () => {
    const { container } = render(<TaskList todos={mockTodos} isLoading={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    const liveRegion = container.firstElementChild
    expect(liveRegion).toHaveAttribute('aria-live', 'polite')
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
