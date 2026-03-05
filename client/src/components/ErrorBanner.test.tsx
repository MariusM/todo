import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ErrorBanner from './ErrorBanner'
import type { ErrorInfo } from '../hooks/useOptimisticTodos'

describe('ErrorBanner', () => {
  it('renders nothing when errors array is empty', () => {
    const { container } = render(<ErrorBanner errors={[]} onDismiss={vi.fn()} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders one banner per error when multiple errors exist', () => {
    const errors: ErrorInfo[] = [
      { message: 'Error 1', code: 'CREATE_ERROR' },
      { message: 'Error 2', code: 'UPDATE_ERROR' },
      { message: 'Error 3', code: 'DELETE_ERROR' },
    ]
    render(<ErrorBanner errors={errors} onDismiss={vi.fn()} />)
    const alerts = screen.getAllByRole('alert')
    expect(alerts).toHaveLength(3)
  })

  it('displays correct warm message for CREATE_ERROR', () => {
    const errors: ErrorInfo[] = [{ message: 'raw error', code: 'CREATE_ERROR' }]
    render(<ErrorBanner errors={errors} onDismiss={vi.fn()} />)
    expect(screen.getByText("Adding that task didn't go through -- try again?")).toBeInTheDocument()
    expect(screen.queryByText('raw error')).not.toBeInTheDocument()
  })

  it('displays correct warm message for UPDATE_ERROR', () => {
    const errors: ErrorInfo[] = [{ message: 'raw error', code: 'UPDATE_ERROR' }]
    render(<ErrorBanner errors={errors} onDismiss={vi.fn()} />)
    expect(screen.getByText("That didn't go through -- your task is safe. Try again?")).toBeInTheDocument()
  })

  it('displays correct warm message for DELETE_ERROR', () => {
    const errors: ErrorInfo[] = [{ message: 'raw error', code: 'DELETE_ERROR' }]
    render(<ErrorBanner errors={errors} onDismiss={vi.fn()} />)
    expect(screen.getByText("That didn't go through -- your task is still here.")).toBeInTheDocument()
  })

  it('displays correct warm message for FETCH_ERROR', () => {
    const errors: ErrorInfo[] = [{ message: 'raw error', code: 'FETCH_ERROR' }]
    render(<ErrorBanner errors={errors} onDismiss={vi.fn()} />)
    expect(screen.getByText("Can't reach the server right now. Check your connection and try again.")).toBeInTheDocument()
  })

  it('calls onDismiss with correct index when dismiss button clicked', async () => {
    const onDismiss = vi.fn()
    const errors: ErrorInfo[] = [
      { message: 'Error 1', code: 'CREATE_ERROR' },
      { message: 'Error 2', code: 'UPDATE_ERROR' },
    ]
    const user = userEvent.setup()
    render(<ErrorBanner errors={errors} onDismiss={onDismiss} />)

    const dismissButtons = screen.getAllByRole('button', { name: 'Dismiss error' })
    expect(dismissButtons).toHaveLength(2)

    await user.click(dismissButtons[1])
    expect(onDismiss).toHaveBeenCalledWith(1)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('each banner has role="alert" attribute', () => {
    const errors: ErrorInfo[] = [
      { message: 'Error 1', code: 'CREATE_ERROR' },
      { message: 'Error 2', code: 'DELETE_ERROR' },
    ]
    render(<ErrorBanner errors={errors} onDismiss={vi.fn()} />)
    const alerts = screen.getAllByRole('alert')
    expect(alerts).toHaveLength(2)
    alerts.forEach((alert) => {
      expect(alert).toHaveAttribute('role', 'alert')
    })
  })

  it('dismiss button has aria-label="Dismiss error"', () => {
    const errors: ErrorInfo[] = [{ message: 'Error', code: 'CREATE_ERROR' }]
    render(<ErrorBanner errors={errors} onDismiss={vi.fn()} />)
    const button = screen.getByRole('button', { name: 'Dismiss error' })
    expect(button).toHaveAttribute('aria-label', 'Dismiss error')
  })

  it('falls back to raw error.message for unknown error codes', () => {
    const errors: ErrorInfo[] = [{ message: 'Some unknown error happened', code: 'UNKNOWN_CODE' }]
    render(<ErrorBanner errors={errors} onDismiss={vi.fn()} />)
    expect(screen.getByText('Some unknown error happened')).toBeInTheDocument()
  })

  it('dismiss button is keyboard accessible via Enter', async () => {
    const onDismiss = vi.fn()
    const errors: ErrorInfo[] = [{ message: 'Error', code: 'CREATE_ERROR' }]
    const user = userEvent.setup()
    render(<ErrorBanner errors={errors} onDismiss={onDismiss} />)

    const button = screen.getByRole('button', { name: 'Dismiss error' })
    button.focus()
    await user.keyboard('{Enter}')
    expect(onDismiss).toHaveBeenCalledWith(0)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('dismiss button is keyboard accessible via Space', async () => {
    const onDismiss = vi.fn()
    const errors: ErrorInfo[] = [{ message: 'Error', code: 'CREATE_ERROR' }]
    const user = userEvent.setup()
    render(<ErrorBanner errors={errors} onDismiss={onDismiss} />)

    const button = screen.getByRole('button', { name: 'Dismiss error' })
    button.focus()
    await user.keyboard(' ')
    expect(onDismiss).toHaveBeenCalledWith(0)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
