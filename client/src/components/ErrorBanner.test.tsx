import { render, screen, fireEvent } from '@testing-library/react'
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
      { id: 'e1', message: 'Error 1', code: 'CREATE_ERROR' },
      { id: 'e2', message: 'Error 2', code: 'UPDATE_ERROR' },
      { id: 'e3', message: 'Error 3', code: 'DELETE_ERROR' },
    ]
    render(<ErrorBanner errors={errors} onDismiss={vi.fn()} />)
    const alerts = screen.getAllByRole('alert')
    expect(alerts).toHaveLength(3)
  })

  it('displays correct warm message for CREATE_ERROR', () => {
    const errors: ErrorInfo[] = [{ id: 'e1', message: 'raw error', code: 'CREATE_ERROR' }]
    render(<ErrorBanner errors={errors} onDismiss={vi.fn()} />)
    expect(screen.getByText("Adding that task didn't go through -- try again?")).toBeInTheDocument()
    expect(screen.queryByText('raw error')).not.toBeInTheDocument()
  })

  it('displays correct warm message for UPDATE_ERROR', () => {
    const errors: ErrorInfo[] = [{ id: 'e1', message: 'raw error', code: 'UPDATE_ERROR' }]
    render(<ErrorBanner errors={errors} onDismiss={vi.fn()} />)
    expect(screen.getByText("That didn't go through -- your task is safe. Try again?")).toBeInTheDocument()
  })

  it('displays correct warm message for DELETE_ERROR', () => {
    const errors: ErrorInfo[] = [{ id: 'e1', message: 'raw error', code: 'DELETE_ERROR' }]
    render(<ErrorBanner errors={errors} onDismiss={vi.fn()} />)
    expect(screen.getByText("That didn't go through -- your task is still here.")).toBeInTheDocument()
  })

  it('displays correct warm message for FETCH_ERROR', () => {
    const errors: ErrorInfo[] = [{ id: 'e1', message: 'raw error', code: 'FETCH_ERROR' }]
    render(<ErrorBanner errors={errors} onDismiss={vi.fn()} />)
    expect(screen.getByText("Can't reach the server right now. Check your connection and try again.")).toBeInTheDocument()
  })

  it('applies banner-exit class and calls onDismiss after animationend', async () => {
    const onDismiss = vi.fn()
    const errors: ErrorInfo[] = [
      { id: 'e1', message: 'Error 1', code: 'CREATE_ERROR' },
      { id: 'e2', message: 'Error 2', code: 'UPDATE_ERROR' },
    ]
    const user = userEvent.setup()
    render(<ErrorBanner errors={errors} onDismiss={onDismiss} />)

    const dismissButtons = screen.getAllByRole('button', { name: 'Dismiss error' })
    expect(dismissButtons).toHaveLength(2)

    await user.click(dismissButtons[1])

    // Banner should have exit animation class
    const alerts = screen.getAllByRole('alert')
    expect(alerts[1]).toHaveClass('banner-exit')
    expect(alerts[1]).not.toHaveClass('banner-enter')

    // onDismiss not called yet (waiting for animation)
    expect(onDismiss).not.toHaveBeenCalled()

    // Fire animationend
    alerts[1].dispatchEvent(new Event('animationend'))

    expect(onDismiss).toHaveBeenCalledWith('e2')
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('each banner has role="alert" attribute', () => {
    const errors: ErrorInfo[] = [
      { id: 'e1', message: 'Error 1', code: 'CREATE_ERROR' },
      { id: 'e2', message: 'Error 2', code: 'DELETE_ERROR' },
    ]
    render(<ErrorBanner errors={errors} onDismiss={vi.fn()} />)
    const alerts = screen.getAllByRole('alert')
    expect(alerts).toHaveLength(2)
    alerts.forEach((alert) => {
      expect(alert).toHaveAttribute('role', 'alert')
    })
  })

  it('dismiss button has aria-label="Dismiss error"', () => {
    const errors: ErrorInfo[] = [{ id: 'e1', message: 'Error', code: 'CREATE_ERROR' }]
    render(<ErrorBanner errors={errors} onDismiss={vi.fn()} />)
    const button = screen.getByRole('button', { name: 'Dismiss error' })
    expect(button).toHaveAttribute('aria-label', 'Dismiss error')
  })

  it('falls back to raw error.message for unknown error codes', () => {
    const errors: ErrorInfo[] = [{ id: 'e1', message: 'Some unknown error happened', code: 'UNKNOWN_CODE' }]
    render(<ErrorBanner errors={errors} onDismiss={vi.fn()} />)
    expect(screen.getByText('Some unknown error happened')).toBeInTheDocument()
  })

  it('dismiss button is keyboard accessible via Enter', async () => {
    const onDismiss = vi.fn()
    const errors: ErrorInfo[] = [{ id: 'e1', message: 'Error', code: 'CREATE_ERROR' }]
    const user = userEvent.setup()
    render(<ErrorBanner errors={errors} onDismiss={onDismiss} />)

    const button = screen.getByRole('button', { name: 'Dismiss error' })
    button.focus()
    await user.keyboard('{Enter}')

    // Fire animationend to complete dismiss
    const alert = screen.getByRole('alert')
    alert.dispatchEvent(new Event('animationend'))

    expect(onDismiss).toHaveBeenCalledWith('e1')
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('dismiss button is keyboard accessible via Space', async () => {
    const onDismiss = vi.fn()
    const errors: ErrorInfo[] = [{ id: 'e1', message: 'Error', code: 'CREATE_ERROR' }]
    const user = userEvent.setup()
    render(<ErrorBanner errors={errors} onDismiss={onDismiss} />)

    const button = screen.getByRole('button', { name: 'Dismiss error' })
    button.focus()
    await user.keyboard(' ')

    // Fire animationend to complete dismiss
    const alert = screen.getByRole('alert')
    alert.dispatchEvent(new Event('animationend'))

    expect(onDismiss).toHaveBeenCalledWith('e1')
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('calls onDismiss via timeout fallback when animationend does not fire', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    const errors: ErrorInfo[] = [{ id: 'e1', message: 'Error', code: 'CREATE_ERROR' }]
    render(<ErrorBanner errors={errors} onDismiss={onDismiss} />)

    const button = screen.getByRole('button', { name: 'Dismiss error' })
    fireEvent.click(button)

    expect(onDismiss).not.toHaveBeenCalled()

    // Advance past timeout fallback (no animationend fired)
    vi.advanceTimersByTime(200)

    expect(onDismiss).toHaveBeenCalledWith('e1')
    expect(onDismiss).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })
})
