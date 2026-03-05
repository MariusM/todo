import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
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
    completed: false,
    createdAt: '2026-03-05T01:00:00.000Z',
    updatedAt: '2026-03-05T01:00:00.000Z',
  },
]

describe('TaskList', () => {
  it('renders loading indicator when isLoading is true', () => {
    render(<TaskList todos={[]} isLoading={true} />)
    expect(screen.getByText('Loading tasks…')).toBeInTheDocument()
  })

  it('renders EmptyState when no todos and not loading', () => {
    render(<TaskList todos={[]} isLoading={false} />)
    expect(screen.getByText('No tasks yet')).toBeInTheDocument()
  })

  it('renders todos in a list', () => {
    render(<TaskList todos={mockTodos} isLoading={false} />)
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
    expect(screen.getByText('Walk the dog')).toBeInTheDocument()
  })

  it('uses proper list semantics', () => {
    render(<TaskList todos={mockTodos} isLoading={false} />)
    expect(screen.getByRole('list', { name: 'Task list' })).toBeInTheDocument()
  })

  it('has aria-live for screen reader announcements', () => {
    render(<TaskList todos={mockTodos} isLoading={false} />)
    const container = screen.getByRole('list', { name: 'Task list' }).parentElement
    expect(container).toHaveAttribute('aria-live', 'polite')
  })

  it('does not render EmptyState when loading', () => {
    render(<TaskList todos={[]} isLoading={true} />)
    expect(screen.queryByText('No tasks yet')).not.toBeInTheDocument()
  })

  it('does not render loading when todos exist', () => {
    render(<TaskList todos={mockTodos} isLoading={false} />)
    expect(screen.queryByText('Loading tasks…')).not.toBeInTheDocument()
  })
})
