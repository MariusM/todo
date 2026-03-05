import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import TaskItem from './TaskItem'
import type { Todo } from '../types/todo'

const activeTodo: Todo = {
  id: '1',
  text: 'Buy milk',
  completed: false,
  createdAt: '2026-03-05T00:00:00.000Z',
  updatedAt: '2026-03-05T00:00:00.000Z',
}

const completedTodo: Todo = {
  id: '2',
  text: 'Walk the dog',
  completed: true,
  createdAt: '2026-03-05T00:00:00.000Z',
  updatedAt: '2026-03-05T00:00:00.000Z',
}

describe('TaskItem', () => {
  it('renders todo text', () => {
    render(<TaskItem todo={activeTodo} onToggle={vi.fn()} />)
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('renders checkbox unchecked for active todo', () => {
    render(<TaskItem todo={activeTodo} onToggle={vi.fn()} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
  })

  it('renders checkbox checked for completed todo', () => {
    render(<TaskItem todo={completedTodo} onToggle={vi.fn()} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('calls onToggle with correct args when checkbox clicked', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    render(<TaskItem todo={activeTodo} onToggle={onToggle} />)
    await user.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith('1', true)
  })

  it('calls onToggle to uncheck a completed todo', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    render(<TaskItem todo={completedTodo} onToggle={onToggle} />)
    await user.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith('2', false)
  })

  it('applies strikethrough and muted color when completed', () => {
    render(<TaskItem todo={completedTodo} onToggle={vi.fn()} />)
    const text = screen.getByText('Walk the dog')
    expect(text).toHaveClass('line-through')
    expect(text).toHaveClass('text-completed-text')
  })

  it('does not apply strikethrough when active', () => {
    render(<TaskItem todo={activeTodo} onToggle={vi.fn()} />)
    const text = screen.getByText('Buy milk')
    expect(text).not.toHaveClass('line-through')
    expect(text).toHaveClass('text-text-primary')
  })

  it('has accessible label on checkbox', () => {
    render(<TaskItem todo={activeTodo} onToggle={vi.fn()} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAccessibleName(`Mark "Buy milk" as complete`)
  })

  it('has accessible label for completed todo', () => {
    render(<TaskItem todo={completedTodo} onToggle={vi.fn()} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAccessibleName(`Mark "Walk the dog" as incomplete`)
  })
})
