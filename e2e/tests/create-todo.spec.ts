import { test, expect } from '@playwright/test'
import { deleteAllTodos } from './fixtures'

test.beforeEach(async ({ page }) => {
  await deleteAllTodos()
  await page.goto('/')
})

test.describe('Journey 1: First Visit', () => {
  test('displays empty state when no tasks exist', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'No tasks yet' })).toBeVisible()
  })

  test('creates a task via input and shows it in the list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'No tasks yet' })).toBeVisible()

    const input = page.getByLabel('Add a new task')
    await input.fill('Buy groceries')
    await input.press('Enter')

    await expect(page.getByRole('button', { name: 'Edit task: Buy groceries' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'No tasks yet' })).not.toBeVisible()
  })

  test('task persists after page refresh', async ({ page }) => {
    const input = page.getByLabel('Add a new task')
    const createResponse = page.waitForResponse(
      (r) => r.url().includes('/api/todos') && r.request().method() === 'POST' && r.status() === 201
    )
    await input.fill('Persistent task')
    await input.press('Enter')
    await createResponse

    await expect(page.getByRole('button', { name: 'Edit task: Persistent task' })).toBeVisible()

    await page.reload()

    await expect(page.getByRole('button', { name: 'Edit task: Persistent task' })).toBeVisible()
  })
})
