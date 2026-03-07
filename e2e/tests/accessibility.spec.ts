import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const API_URL = 'http://localhost:3001/api/todos'

async function deleteAllTodos() {
  const res = await fetch(API_URL)
  const todos = await res.json()
  for (const todo of todos) {
    await fetch(`${API_URL}/${todo.id}`, { method: 'DELETE' })
  }
}

test.beforeEach(async ({ page }) => {
  await deleteAllTodos()
  await page.goto('/')
})

test.describe('Journey 5: Accessibility', () => {
  test('keyboard navigation: Tab through interactive elements', async ({ page }) => {
    // Create a task so interactive elements are present
    const input = page.getByLabel('Add a new task')
    await input.fill('Keyboard test')
    await input.press('Enter')
    await expect(page.getByRole('button', { name: 'Edit task: Keyboard test' })).toBeVisible()

    // Click input to ensure it's focused
    await input.click()
    await expect(input).toBeFocused()

    // Tab through task elements — verify we can reach them all via keyboard
    // The checkbox is wrapped in a label, so Tab focuses the label's interactive child
    await page.keyboard.press('Tab')

    // Check what got focused — might be the label or the checkbox
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName)
    const focusedType = await page.evaluate(() => (document.activeElement as HTMLInputElement)?.type)

    // The checkbox input should be focused (inside the label)
    expect(focusedTag).toBe('INPUT')
    expect(focusedType).toBe('checkbox')

    // Tab to task text span (role="button", tabIndex=0)
    await page.keyboard.press('Tab')
    const taskText = page.getByRole('button', { name: 'Edit task: Keyboard test' })
    await expect(taskText).toBeFocused()

    // Tab to delete button
    await page.keyboard.press('Tab')
    const deleteButton = page.getByLabel('Delete task: Keyboard test')
    await expect(deleteButton).toBeFocused()
  })

  test('Enter submits new task from input', async ({ page }) => {
    const input = page.getByLabel('Add a new task')
    await input.fill('Enter test')
    await input.press('Enter')

    await expect(page.getByRole('button', { name: 'Edit task: Enter test' })).toBeVisible()
  })

  test('Escape cancels inline edit', async ({ page }) => {
    // Create a task
    const input = page.getByLabel('Add a new task')
    await input.fill('Escape test')
    await input.press('Enter')
    const taskSpan = page.getByRole('button', { name: 'Edit task: Escape test' })
    await expect(taskSpan).toBeVisible()

    // Click to activate inline edit
    await taskSpan.click()

    const editInput = page.getByLabel('Edit task: Escape test')
    await expect(editInput).toBeVisible()

    // Type something different
    await editInput.fill('Changed text')

    // Press Escape to cancel
    await editInput.press('Escape')

    // Original text should remain
    await expect(page.getByRole('button', { name: 'Edit task: Escape test' })).toBeVisible()
  })

  test('axe-core audit passes with zero critical violations', async ({ page }) => {
    // Create a task to have content on the page
    const input = page.getByLabel('Add a new task')
    await input.fill('Axe test task')
    await input.press('Enter')
    await expect(page.getByRole('button', { name: 'Edit task: Axe test task' })).toBeVisible()

    // Run axe-core audit
    const results = await new AxeBuilder({ page }).analyze()
    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical'
    )
    expect(criticalViolations).toHaveLength(0)
  })
})
