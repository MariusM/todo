import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
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
    render(<TaskList todos={[]} isLoading={true} onToggle={vi.fn()} />)
    expect(screen.getByText('Loading tasks…')).toBeInTheDocument()
  })

  it('renders EmptyState when no todos and not loading', () => {
    render(<TaskList todos={[]} isLoading={false} onToggle={vi.fn()} />)
    expect(screen.getByText('No tasks yet')).toBeInTheDocument()
  })

  it('renders todos in a list', () => {
    render(<TaskList todos={mockTodos} isLoading={false} onToggle={vi.fn()} />)
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
    expect(screen.getByText('Walk the dog')).toBeInTheDocument()
  })

  it('uses proper list semantics', () => {
    render(<TaskList todos={mockTodos} isLoading={false} onToggle={vi.fn()} />)
    expect(screen.getByRole('list', { name: 'Task list' })).toBeInTheDocument()
  })

  it('has aria-live for screen reader announcements', () => {
    const { container } = render(<TaskList todos={mockTodos} isLoading={false} onToggle={vi.fn()} />)
    const liveRegion = container.firstElementChild
    expect(liveRegion).toHaveAttribute('aria-live', 'polite')
  })

  it('does not render EmptyState when loading', () => {
    render(<TaskList todos={[]} isLoading={true} onToggle={vi.fn()} />)
    expect(screen.queryByText('No tasks yet')).not.toBeInTheDocument()
  })

  it('does not render loading when todos exist', () => {
    render(<TaskList todos={mockTodos} isLoading={false} onToggle={vi.fn()} />)
    expect(screen.queryByText('Loading tasks…')).not.toBeInTheDocument()
  })

  it('renders TaskItem components with checkboxes', () => {
    render(<TaskList todos={mockTodos} isLoading={false} onToggle={vi.fn()} />)
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(2)
  })

  it('passes onToggle to TaskItem components', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    render(<TaskList todos={mockTodos} isLoading={false} onToggle={onToggle} />)
    await user.click(screen.getAllByRole('checkbox')[0])
    expect(onToggle).toHaveBeenCalledWith('1', true)
  })
})
