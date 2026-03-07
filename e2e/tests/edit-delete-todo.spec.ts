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

test.describe('Journey 3: Edit & Delete', () => {
  test('inline edit: click text, change, save with Enter', async ({ page }) => {
    // Create a task
    const input = page.getByLabel('Add a new task')
    await input.fill('Original text')
    await input.press('Enter')

    const taskSpan = page.getByRole('button', { name: 'Edit task: Original text' })
    await expect(taskSpan).toBeVisible()

    // Click on task text to activate inline edit
    await taskSpan.click()

    // Edit input should appear
    const editInput = page.getByLabel('Edit task: Original text')
    await expect(editInput).toBeVisible()
    await expect(editInput).toHaveAttribute('type', 'text')

    // Clear and type new text, then save
    await editInput.fill('Updated text')
    await editInput.press('Enter')

    // Verify updated text - the span reappears with new text
    await expect(page.getByRole('button', { name: 'Edit task: Updated text' })).toBeVisible({ timeout: 10000 })
  })

  test('delete removes task from the list', async ({ page }) => {
    // Create a task
    const input = page.getByLabel('Add a new task')
    await input.fill('Delete me')
    await input.press('Enter')

    await expect(page.getByRole('button', { name: 'Edit task: Delete me' })).toBeVisible()

    // Delete the task (has animation + API call)
    await page.getByLabel('Delete task: Delete me').click()

    // Wait for task removal (animation is 200ms + API call)
    await expect(page.getByRole('heading', { name: 'No tasks yet' })).toBeVisible({ timeout: 10000 })
  })

  test('list count updates correctly after operations', async ({ page }) => {
    const input = page.getByLabel('Add a new task')

    // Create two tasks
    await input.fill('Task one')
    await input.press('Enter')
    await expect(page.getByRole('button', { name: 'Edit task: Task one' })).toBeVisible()

    await input.fill('Task two')
    await input.press('Enter')
    await expect(page.getByRole('button', { name: 'Edit task: Task two' })).toBeVisible()

    // Verify both exist in the list
    const list = page.getByRole('list', { name: 'Task list' })
    await expect(list.getByRole('listitem')).toHaveCount(2)

    // Delete one
    await page.getByLabel('Delete task: Task one').click()

    // Verify count decreased (wait for animation)
    await expect(list.getByRole('listitem')).toHaveCount(1, { timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Edit task: Task two' })).toBeVisible()
  })
})
