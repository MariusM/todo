import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import TaskInput from './TaskInput'

describe('TaskInput', () => {
  it('renders input with placeholder text', () => {
    render(<TaskInput onAddTodo={vi.fn()} />)
    expect(
      screen.getByPlaceholderText('What needs to be done?')
    ).toBeInTheDocument()
  })

  it('has accessible label', () => {
    render(<TaskInput onAddTodo={vi.fn()} />)
    expect(screen.getByLabelText('Add a new task')).toBeInTheDocument()
  })

  it('auto-focuses on mount', () => {
    render(<TaskInput onAddTodo={vi.fn()} />)
    expect(screen.getByLabelText('Add a new task')).toHaveFocus()
  })

  it('calls onAddTodo with trimmed text on Enter', async () => {
    const onAddTodo = vi.fn()
    const user = userEvent.setup()
    render(<TaskInput onAddTodo={onAddTodo} />)

    const input = screen.getByLabelText('Add a new task')
    await user.type(input, 'Buy milk{Enter}')

    expect(onAddTodo).toHaveBeenCalledWith('Buy milk')
  })

  it('clears input after submit', async () => {
    const user = userEvent.setup()
    render(<TaskInput onAddTodo={vi.fn()} />)

    const input = screen.getByLabelText('Add a new task')
    await user.type(input, 'Buy milk{Enter}')

    expect(input).toHaveValue('')
  })

  it('retains focus after submit', async () => {
    const user = userEvent.setup()
    render(<TaskInput onAddTodo={vi.fn()} />)

    const input = screen.getByLabelText('Add a new task')
    await user.type(input, 'Buy milk{Enter}')

    expect(input).toHaveFocus()
  })

  it('does nothing on Enter with empty input', async () => {
    const onAddTodo = vi.fn()
    const user = userEvent.setup()
    render(<TaskInput onAddTodo={onAddTodo} />)

    const input = screen.getByLabelText('Add a new task')
    await user.type(input, '{Enter}')

    expect(onAddTodo).not.toHaveBeenCalled()
  })

  it('does nothing on Enter with whitespace-only input', async () => {
    const onAddTodo = vi.fn()
    const user = userEvent.setup()
    render(<TaskInput onAddTodo={onAddTodo} />)

    const input = screen.getByLabelText('Add a new task')
    await user.type(input, '   {Enter}')

    expect(onAddTodo).not.toHaveBeenCalled()
  })
})
