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

  it('renders decorative SVG with aria-hidden and no contradictory role', () => {
    const { container } = render(<EmptyState />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).not.toHaveAttribute('role')
  })

  it('heading is h2 level for correct page hierarchy', () => {
    render(<EmptyState />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('No tasks yet')
  })

  it('heading and description use contrast-compliant secondary text color', () => {
    render(<EmptyState />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveClass('text-text-secondary')
    const description = screen.getByText('Type a task above and press Enter to get started.')
    expect(description).toHaveClass('text-text-secondary')
  })

  it('instruction text is readable by screen readers', () => {
    const { container } = render(<EmptyState />)
    const instruction = screen.getByText('Type a task above and press Enter to get started.')
    expect(instruction).toBeVisible()
    // Verify no aria-hidden on instruction or its ancestors within the component
    let el: HTMLElement | null = instruction
    const root = container.firstElementChild
    while (el && el !== root) {
      expect(el).not.toHaveAttribute('aria-hidden')
      el = el.parentElement
    }
  })
})
