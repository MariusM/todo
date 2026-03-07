import { test, expect } from '@playwright/test'
import { deleteAllTodos } from './fixtures'

test.beforeEach(async ({ page }) => {
  await deleteAllTodos()
  await page.goto('/')
})

test.describe('Journey 4: Error Recovery', () => {
  test('POST failure: error banner, optimistic rollback, and recovery', async ({ page }) => {
    // Create a task first (with working API)
    const input = page.getByLabel('Add a new task')
    const createOk = page.waitForResponse((r) => r.url().includes('/api/todos') && r.request().method() === 'POST' && r.status() === 201)
    await input.fill('Existing task')
    await input.press('Enter')
    await createOk
    await expect(page.getByRole('button', { name: 'Edit task: Existing task' })).toBeVisible()

    // Intercept API calls to simulate 500 failure on POST
    await page.route('**/api/todos', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'Server error', code: 'INTERNAL_ERROR' } }),
        })
      }
      return route.continue()
    })

    // Try to create a task (should fail and rollback)
    await input.fill('Failing task')
    await input.press('Enter')

    // Verify error banner appears with correct message
    const errorBanner = page.getByRole('alert').first()
    await expect(errorBanner).toBeVisible({ timeout: 10000 })
    await expect(errorBanner).toContainText("didn't go through")

    // The optimistic task should be rolled back (not in the list)
    await expect(page.getByRole('button', { name: 'Edit task: Failing task' })).not.toBeVisible({ timeout: 5000 })

    // Remove the route intercept to restore normal API
    await page.unroute('**/api/todos')

    // Dismiss the error banner
    await page.getByLabel('Dismiss error').first().click()

    // Verify recovery: create a task successfully
    const createOk2 = page.waitForResponse((r) => r.url().includes('/api/todos') && r.request().method() === 'POST' && r.status() === 201)
    await input.fill('Recovery task')
    await input.press('Enter')
    await createOk2
    await expect(page.getByRole('button', { name: 'Edit task: Recovery task' })).toBeVisible()
  })

  test('PATCH failure: toggle rollback and error banner', async ({ page }) => {
    // Create a task
    const input = page.getByLabel('Add a new task')
    const createOk = page.waitForResponse((r) => r.url().includes('/api/todos') && r.request().method() === 'POST' && r.status() === 201)
    await input.fill('Patch fail task')
    await input.press('Enter')
    await createOk
    await expect(page.getByRole('button', { name: 'Edit task: Patch fail task' })).toBeVisible()

    // Intercept PATCH to simulate failure
    await page.route('**/api/todos/*', (route) => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'Server error', code: 'INTERNAL_ERROR' } }),
        })
      }
      return route.continue()
    })

    // Try to toggle complete (should fail and rollback)
    const checkbox = page.getByLabel('Mark "Patch fail task" as complete')
    await checkbox.click()

    // Optimistic UI shows line-through briefly, then should rollback
    const taskText = page.getByRole('button', { name: 'Edit task: Patch fail task' })
    await expect(taskText).not.toHaveClass(/line-through/, { timeout: 10000 })

    // Verify error banner appears
    const errorBanner = page.getByRole('alert').first()
    await expect(errorBanner).toBeVisible()
    await expect(errorBanner).toContainText("didn't go through")

    // Cleanup
    await page.unroute('**/api/todos/*')
    await page.getByLabel('Dismiss error').first().click()
  })

  test('DELETE failure: task restored and error banner', async ({ page }) => {
    // Create a task
    const input = page.getByLabel('Add a new task')
    const createOk = page.waitForResponse((r) => r.url().includes('/api/todos') && r.request().method() === 'POST' && r.status() === 201)
    await input.fill('Delete fail task')
    await input.press('Enter')
    await createOk
    await expect(page.getByRole('button', { name: 'Edit task: Delete fail task' })).toBeVisible()

    // Intercept DELETE to simulate failure
    await page.route('**/api/todos/*', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'Server error', code: 'INTERNAL_ERROR' } }),
        })
      }
      return route.continue()
    })

    // Try to delete (should fail and restore)
    await page.getByLabel('Delete task: Delete fail task').click()

    // Task should be restored after rollback
    await expect(page.getByRole('button', { name: 'Edit task: Delete fail task' })).toBeVisible({ timeout: 10000 })

    // Verify error banner appears
    const errorBanner = page.getByRole('alert').first()
    await expect(errorBanner).toBeVisible()
    await expect(errorBanner).toContainText("didn't go through")

    // Cleanup
    await page.unroute('**/api/todos/*')
    await page.getByLabel('Dismiss error').first().click()
  })
})
