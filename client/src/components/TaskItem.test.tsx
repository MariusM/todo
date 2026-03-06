import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
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
    render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('renders checkbox unchecked for active todo', () => {
    render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
  })

  it('renders checkbox checked for completed todo', () => {
    render(<TaskItem todo={completedTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('calls onToggle with correct args when checkbox clicked', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    render(<TaskItem todo={activeTodo} onToggle={onToggle} onEdit={vi.fn()} onDelete={vi.fn()} />)
    await user.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith('1', true)
  })

  it('calls onToggle to uncheck a completed todo', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    render(<TaskItem todo={completedTodo} onToggle={onToggle} onEdit={vi.fn()} onDelete={vi.fn()} />)
    await user.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith('2', false)
  })

  it('applies strikethrough and muted color when completed', () => {
    render(<TaskItem todo={completedTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    const text = screen.getByText('Walk the dog')
    expect(text).toHaveClass('line-through')
    expect(text).toHaveClass('text-completed-text')
  })

  it('completed task has dual visual indicators: line-through AND contrast-compliant color (AC #2)', () => {
    render(<TaskItem todo={completedTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    const text = screen.getByText('Walk the dog')
    // Dual indicator: color + strikethrough (not relying on color alone)
    expect(text).toHaveClass('text-completed-text')
    expect(text).toHaveClass('line-through')
  })

  it('completed text is visually distinct from active text', () => {
    const { rerender } = render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    const activeText = screen.getByText('Buy milk')
    expect(activeText).toHaveClass('text-text-primary')
    expect(activeText).not.toHaveClass('text-completed-text')

    rerender(<TaskItem todo={completedTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    const completedText = screen.getByText('Walk the dog')
    expect(completedText).toHaveClass('text-completed-text')
    expect(completedText).not.toHaveClass('text-text-primary')
  })

  it('does not apply strikethrough when active', () => {
    render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    const text = screen.getByText('Buy milk')
    expect(text).not.toHaveClass('line-through')
    expect(text).toHaveClass('text-text-primary')
  })

  it('has accessible label on checkbox', () => {
    render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAccessibleName(`Mark "Buy milk" as complete`)
  })

  it('has accessible label for completed todo', () => {
    render(<TaskItem todo={completedTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAccessibleName(`Mark "Walk the dog" as incomplete`)
  })

  it('checkbox checked state reflects active todo (unchecked for screen readers)', () => {
    render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.checked).toBe(false)
    expect(checkbox).not.toBeChecked()
  })

  it('checkbox checked state reflects completed todo (checked for screen readers)', () => {
    render(<TaskItem todo={completedTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.checked).toBe(true)
    expect(checkbox).toBeChecked()
  })

  describe('visual contrast & accessibility (AC #1, #4)', () => {
    it('checked checkbox uses accent fill color for contrast compliance (AC #4)', () => {
      render(<TaskItem todo={completedTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveClass('checked:bg-checkbox-fill')
      expect(checkbox).toHaveClass('checked:border-checkbox-fill')
    })

    it('text span is keyboard-accessible with role="button" and tabIndex=0', () => {
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
      const textSpan = screen.getByRole('button', { name: /Edit task/ })
      expect(textSpan.tagName).toBe('SPAN')
      expect(textSpan).toHaveAttribute('tabindex', '0')
    })

    it('tab order: checkbox -> task text -> delete button', async () => {
      const user = userEvent.setup()
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
      await user.tab()
      expect(screen.getByRole('checkbox')).toHaveFocus()
      await user.tab()
      expect(screen.getByRole('button', { name: /Edit task/ })).toHaveFocus()
      await user.tab()
      expect(screen.getByRole('button', { name: /Delete task/ })).toHaveFocus()
    })

    it('has task-enter animation class when animateEntry is true', () => {
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} animateEntry={true} />)
      const li = screen.getByRole('listitem')
      expect(li).toHaveClass('task-enter')
    })

    it('does not have task-enter class by default', () => {
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
      const li = screen.getByRole('listitem')
      expect(li).not.toHaveClass('task-enter')
    })
  })

  describe('inline editing', () => {
    it('enters edit mode when text is clicked, showing input with current text', async () => {
      const user = userEvent.setup()
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
      await user.click(screen.getByText('Buy milk'))
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
      expect(input).toHaveValue('Buy milk')
    })

    it('saves and exits edit mode on Enter, calling onEdit with trimmed text exactly once', async () => {
      const onEdit = vi.fn()
      const user = userEvent.setup()
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={onEdit} onDelete={vi.fn()} />)
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
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={onEdit} onDelete={vi.fn()} />)
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
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={onEdit} onDelete={vi.fn()} />)
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
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={onEdit} onDelete={vi.fn()} />)
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
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={onEdit} onDelete={vi.fn()} />)
      await user.click(screen.getByText('Buy milk'))
      await user.keyboard('{Enter}')
      expect(onEdit).not.toHaveBeenCalled()
    })

    it('checkbox click does not trigger edit mode', async () => {
      const user = userEvent.setup()
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
      await user.click(screen.getByRole('checkbox'))
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('completed tasks can enter edit mode', async () => {
      const user = userEvent.setup()
      render(<TaskItem todo={completedTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
      await user.click(screen.getByText('Walk the dog'))
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
      expect(input).toHaveValue('Walk the dog')
    })

    it('auto-focuses input when entering edit mode', async () => {
      const user = userEvent.setup()
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
      await user.click(screen.getByText('Buy milk'))
      const input = screen.getByRole('textbox')
      expect(input).toHaveFocus()
    })

    it('enters edit mode via keyboard (Enter on text span)', async () => {
      const user = userEvent.setup()
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
      const textSpan = screen.getByRole('button', { name: /Edit task: Buy milk/ })
      textSpan.focus()
      await user.keyboard('{Enter}')
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('Space key activates edit mode on text span', async () => {
      const user = userEvent.setup()
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
      const textSpan = screen.getByRole('button', { name: /Edit task/ })
      textSpan.focus()
      await user.keyboard(' ')
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('does not call onEdit when Escape is pressed after editing text', async () => {
      const onEdit = vi.fn()
      const user = userEvent.setup()
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={onEdit} onDelete={vi.fn()} />)
      await user.click(screen.getByText('Buy milk'))
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, 'Buy eggs{Escape}')
      expect(onEdit).toHaveBeenCalledTimes(0)
    })
  })

  describe('delete button', () => {
    it('renders a delete button with correct aria-label', () => {
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
      const deleteBtn = screen.getByRole('button', { name: 'Delete task: Buy milk' })
      expect(deleteBtn).toBeInTheDocument()
    })

    it('calls onDelete with todo id after exit animation', async () => {
      const onDelete = vi.fn()
      const user = userEvent.setup()
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={onDelete} />)
      const deleteBtn = screen.getByRole('button', { name: 'Delete task: Buy milk' })
      await user.click(deleteBtn)
      // Simulate animationend event since JSDOM doesn't run CSS animations
      const li = deleteBtn.closest('li')!
      li.dispatchEvent(new Event('animationend'))
      expect(onDelete).toHaveBeenCalledWith('1')
      expect(onDelete).toHaveBeenCalledTimes(1)
    })

    it('has correct aria-label for completed todo', () => {
      render(<TaskItem todo={completedTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
      const deleteBtn = screen.getByRole('button', { name: 'Delete task: Walk the dog' })
      expect(deleteBtn).toBeInTheDocument()
    })

    it('applies task-exit class when delete is clicked', async () => {
      const user = userEvent.setup()
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
      const deleteBtn = screen.getByRole('button', { name: 'Delete task: Buy milk' })
      await user.click(deleteBtn)
      const li = deleteBtn.closest('li')!
      expect(li).toHaveClass('task-exit')
    })

    it('has opacity-0 class by default (hidden until hover)', () => {
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
      const deleteBtn = screen.getByRole('button', { name: 'Delete task: Buy milk' })
      expect(deleteBtn).toHaveClass('opacity-0')
    })

    it('delete button has hover/focus error color class for contrast', () => {
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
      const deleteBtn = screen.getByRole('button', { name: 'Delete task: Buy milk' })
      expect(deleteBtn).toHaveClass('hover:text-error-text')
      expect(deleteBtn).toHaveClass('focus:text-error-text')
    })

    it('delete button has mobile-specific contrast-compliant color (AC #1)', () => {
      render(<TaskItem todo={activeTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
      const deleteBtn = screen.getByRole('button', { name: 'Delete task: Buy milk' })
      expect(deleteBtn).toHaveClass('max-sm:text-text-secondary')
    })
  })
})
