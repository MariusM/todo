import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import EmptyState from './EmptyState'

describe('EmptyState', () => {
  it('renders the heading text', () => {
    render(<EmptyState />)
    expect(screen.getByText('No tasks yet')).toBeInTheDocument()
  })

  it('renders the instruction text', () => {
    render(<EmptyState />)
    expect(
      screen.getByText('Type a task above and press Enter to get started.')
    ).toBeInTheDocument()
  })

  it('renders a muted checkbox icon', () => {
    render(<EmptyState />)
    const icon = screen.getByRole('img', { hidden: true })
    expect(icon).toBeInTheDocument()
  })
})
