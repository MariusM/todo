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
    render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} />)
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('renders checkbox unchecked for active todo', () => {
    render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
  })

  it('renders checkbox checked for completed todo', () => {
    render(<TaskItem todo={completedTodo} onToggle={vi.fn()} onEdit={vi.fn()} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('calls onToggle with correct args when checkbox clicked', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    render(<TaskItem todo={activeTodo} onToggle={onToggle} onEdit={vi.fn()} />)
    await user.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith('1', true)
  })

  it('calls onToggle to uncheck a completed todo', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    render(<TaskItem todo={completedTodo} onToggle={onToggle} onEdit={vi.fn()} />)
    await user.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith('2', false)
  })

  it('applies strikethrough and muted color when completed', () => {
    render(<TaskItem todo={completedTodo} onToggle={vi.fn()} onEdit={vi.fn()} />)
    const text = screen.getByText('Walk the dog')
    expect(text).toHaveClass('line-through')
    expect(text).toHaveClass('text-completed-text')
  })

  it('does not apply strikethrough when active', () => {
    render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} />)
    const text = screen.getByText('Buy milk')
    expect(text).not.toHaveClass('line-through')
    expect(text).toHaveClass('text-text-primary')
  })

  it('has accessible label on checkbox', () => {
    render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAccessibleName(`Mark "Buy milk" as complete`)
  })

  it('has accessible label for completed todo', () => {
    render(<TaskItem todo={completedTodo} onToggle={vi.fn()} onEdit={vi.fn()} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAccessibleName(`Mark "Walk the dog" as incomplete`)
  })

  describe('inline editing', () => {
    it('enters edit mode when text is clicked, showing input with current text', async () => {
      const user = userEvent.setup()
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} />)
      await user.click(screen.getByText('Buy milk'))
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
      expect(input).toHaveValue('Buy milk')
    })

    it('saves and exits edit mode on Enter, calling onEdit with trimmed text exactly once', async () => {
      const onEdit = vi.fn()
      const user = userEvent.setup()
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={onEdit} />)
      await user.click(screen.getByText('Buy milk'))
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, 'Buy eggs{Enter}')
      expect(onEdit).toHaveBeenCalledWith('1', 'Buy eggs')
      expect(onEdit).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('cancels edit mode on Escape without calling onEdit', async () => {
      const onEdit = vi.fn()
      const user = userEvent.setup()
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={onEdit} />)
      await user.click(screen.getByText('Buy milk'))
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, 'Buy eggs{Escape}')
      expect(onEdit).not.toHaveBeenCalled()
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      expect(screen.getByText('Buy milk')).toBeInTheDocument()
    })

    it('saves on blur (same as Enter) exactly once', async () => {
      const onEdit = vi.fn()
      const user = userEvent.setup()
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={onEdit} />)
      await user.click(screen.getByText('Buy milk'))
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, 'Buy eggs')
      await user.tab()
      expect(onEdit).toHaveBeenCalledWith('1', 'Buy eggs')
      expect(onEdit).toHaveBeenCalledTimes(1)
    })

    it('reverts to original text when empty text is saved (no onEdit call)', async () => {
      const onEdit = vi.fn()
      const user = userEvent.setup()
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={onEdit} />)
      await user.click(screen.getByText('Buy milk'))
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.keyboard('{Enter}')
      expect(onEdit).not.toHaveBeenCalled()
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      expect(screen.getByText('Buy milk')).toBeInTheDocument()
    })

    it('does not call onEdit when text is unchanged', async () => {
      const onEdit = vi.fn()
      const user = userEvent.setup()
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={onEdit} />)
      await user.click(screen.getByText('Buy milk'))
      await user.keyboard('{Enter}')
      expect(onEdit).not.toHaveBeenCalled()
    })

    it('checkbox click does not trigger edit mode', async () => {
      const user = userEvent.setup()
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} />)
      await user.click(screen.getByRole('checkbox'))
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('completed tasks can enter edit mode', async () => {
      const user = userEvent.setup()
      render(<TaskItem todo={completedTodo} onToggle={vi.fn()} onEdit={vi.fn()} />)
      await user.click(screen.getByText('Walk the dog'))
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
      expect(input).toHaveValue('Walk the dog')
    })

    it('auto-focuses input when entering edit mode', async () => {
      const user = userEvent.setup()
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} />)
      await user.click(screen.getByText('Buy milk'))
      const input = screen.getByRole('textbox')
      expect(input).toHaveFocus()
    })

    it('enters edit mode via keyboard (Enter on text span)', async () => {
      const user = userEvent.setup()
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} />)
      const textSpan = screen.getByRole('button', { name: /Edit task: Buy milk/ })
      textSpan.focus()
      await user.keyboard('{Enter}')
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('does not call onEdit when Escape is pressed after editing text', async () => {
      const onEdit = vi.fn()
      const user = userEvent.setup()
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={onEdit} />)
      await user.click(screen.getByText('Buy milk'))
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, 'Buy eggs{Escape}')
      expect(onEdit).toHaveBeenCalledTimes(0)
    })
  })
})
