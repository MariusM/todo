import { test, expect } from '@playwright/test'

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

test.describe('Journey 4: Error Recovery', () => {
  test('simulated API failure shows error banner and optimistic rollback', async ({ page }) => {
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

    // Verify error banner appears (wait for the failed fetch to trigger rollback)
    const errorBanner = page.getByRole('alert').first()
    await expect(errorBanner).toBeVisible({ timeout: 10000 })

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
})
