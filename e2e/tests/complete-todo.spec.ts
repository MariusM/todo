import { test, expect } from '@playwright/test'
import { deleteAllTodos } from './fixtures'

test.beforeEach(async ({ page }) => {
  await deleteAllTodos()
  await page.goto('/')
})

test.describe('Journey 2: Task Completion', () => {
  test('marks task complete with visual distinction and persists on refresh', async ({ page }) => {
    // Create a task and wait for API to confirm
    const input = page.getByLabel('Add a new task')
    const createResponse = page.waitForResponse((r) => r.url().includes('/api/todos') && r.request().method() === 'POST')
    await input.fill('Complete me')
    await input.press('Enter')
    await createResponse

    const taskText = page.getByRole('button', { name: 'Edit task: Complete me' })
    await expect(taskText).toBeVisible()

    // Mark complete via checkbox and wait for PATCH
    const patchResponse = page.waitForResponse((r) => r.url().includes('/api/todos/') && r.request().method() === 'PATCH')
    const checkbox = page.getByLabel('Mark "Complete me" as complete')
    await checkbox.click()
    await patchResponse

    // Verify visual distinction (line-through class)
    await expect(taskText).toHaveClass(/line-through/)

    // Persist on refresh
    await page.reload()

    const taskTextAfterReload = page.getByRole('button', { name: 'Edit task: Complete me' })
    await expect(taskTextAfterReload).toBeVisible()
    await expect(taskTextAfterReload).toHaveClass(/line-through/)
  })

  test('toggles task back to active and visual change reverts', async ({ page }) => {
    // Create and complete a task
    const input = page.getByLabel('Add a new task')
    await input.fill('Toggle me')
    await input.press('Enter')

    const checkbox = page.getByLabel('Mark "Toggle me" as complete')
    const patchResponse1 = page.waitForResponse((r) => r.url().includes('/api/todos/') && r.request().method() === 'PATCH')
    await checkbox.click()
    await patchResponse1

    const taskText = page.getByRole('button', { name: 'Edit task: Toggle me' })
    await expect(taskText).toHaveClass(/line-through/)

    // Toggle back to active using click (not .check/.uncheck since the checkbox state already changed)
    const patchResponse2 = page.waitForResponse((r) => r.url().includes('/api/todos/') && r.request().method() === 'PATCH')
    const uncheckBox = page.getByLabel('Mark "Toggle me" as incomplete')
    await uncheckBox.click()
    await patchResponse2

    // Verify visual change reverts (no line-through)
    await expect(taskText).not.toHaveClass(/line-through/)
  })
})
