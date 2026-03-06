import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type Database from 'better-sqlite3'
import { initDatabase } from './init.js'
import { createQueries } from './queries.js'

describe('Database queries', () => {
  let db: Database.Database
  let queries: ReturnType<typeof createQueries>

  beforeEach(() => {
    db = initDatabase(':memory:')
    queries = createQueries(db)
  })

  afterEach(() => {
    db.close()
  })

  describe('createTodo', () => {
    it('creates a todo and returns it with camelCase fields', () => {
      const todo = queries.createTodo('550e8400-e29b-41d4-a716-446655440000', 'Buy groceries')

      expect(todo.id).toBe('550e8400-e29b-41d4-a716-446655440000')
      expect(todo.text).toBe('Buy groceries')
      expect(todo.completed).toBe(false)
      expect(todo.createdAt).toBeDefined()
      expect(todo.updatedAt).toBeDefined()
    })
  })

  describe('getAllTodos', () => {
    it('returns empty array when no todos exist', () => {
      const todos = queries.getAllTodos()
      expect(todos).toEqual([])
    })

    it('returns all todos ordered by created_at', () => {
      queries.createTodo('id-1', 'First')
      queries.createTodo('id-2', 'Second')

      const todos = queries.getAllTodos()
      expect(todos).toHaveLength(2)
      expect(todos[0].text).toBe('First')
      expect(todos[1].text).toBe('Second')
    })

    it('returns todos with camelCase fields', () => {
      queries.createTodo('id-1', 'Test')
      const todos = queries.getAllTodos()

      expect(todos[0]).toHaveProperty('createdAt')
      expect(todos[0]).toHaveProperty('updatedAt')
      expect(todos[0]).not.toHaveProperty('created_at')
      expect(todos[0]).not.toHaveProperty('updated_at')
    })
  })

  describe('getTodoById', () => {
    it('returns a todo by id', () => {
      queries.createTodo('id-1', 'Test')
      const todo = queries.getTodoById('id-1')

      expect(todo).not.toBeUndefined()
      expect(todo!.id).toBe('id-1')
      expect(todo!.text).toBe('Test')
    })

    it('returns undefined for non-existent id', () => {
      const todo = queries.getTodoById('non-existent')
      expect(todo).toBeUndefined()
    })
  })

  describe('updateTodo', () => {
    it('updates text field', () => {
      queries.createTodo('id-1', 'Original')
      const updated = queries.updateTodo('id-1', { text: 'Updated' })

      expect(updated).not.toBeUndefined()
      expect(updated!.text).toBe('Updated')
    })

    it('updates completed field', () => {
      queries.createTodo('id-1', 'Test')
      const updated = queries.updateTodo('id-1', { completed: true })

      expect(updated!.completed).toBe(true)
    })

    it('updates both text and completed simultaneously', () => {
      queries.createTodo('id-1', 'Original')
      const updated = queries.updateTodo('id-1', { text: 'Changed', completed: true })

      expect(updated!.text).toBe('Changed')
      expect(updated!.completed).toBe(true)
    })

    it('sets updated_at to a valid timestamp on update', () => {
      queries.createTodo('id-1', 'Test')

      const updated = queries.updateTodo('id-1', { text: 'Changed' })

      expect(updated!.updatedAt).toBeDefined()
      expect(new Date(updated!.updatedAt).toISOString()).toContain(
        new Date().toISOString().slice(0, 10)
      )
    })

    it('returns existing todo when no fields provided', () => {
      queries.createTodo('id-1', 'Test')
      const result = queries.updateTodo('id-1', {})

      expect(result).not.toBeUndefined()
      expect(result!.text).toBe('Test')
    })

    it('returns undefined for non-existent id', () => {
      const result = queries.updateTodo('non-existent', { text: 'Test' })
      expect(result).toBeUndefined()
    })
  })

  describe('deleteTodo', () => {
    it('deletes a todo and returns true', () => {
      queries.createTodo('id-1', 'Test')
      const result = queries.deleteTodo('id-1')

      expect(result).toBe(true)
      expect(queries.getTodoById('id-1')).toBeUndefined()
    })

    it('returns false for non-existent id', () => {
      const result = queries.deleteTodo('non-existent')
      expect(result).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('handles emoji text correctly', () => {
      const todo = queries.createTodo('id-emoji', '🎉 Party time! 🥳')
      expect(todo.text).toBe('🎉 Party time! 🥳')

      const fetched = queries.getTodoById('id-emoji')
      expect(fetched!.text).toBe('🎉 Party time! 🥳')
    })

    it('handles unicode characters correctly', () => {
      const todo = queries.createTodo('id-unicode', '日本語テスト résumé café')
      expect(todo.text).toBe('日本語テスト résumé café')
    })

    it('handles very long text', () => {
      const longText = 'A'.repeat(10000)
      const todo = queries.createTodo('id-long', longText)
      expect(todo.text).toBe(longText)
      expect(todo.text.length).toBe(10000)
    })

    it('correctly converts completed boolean from DB integer', () => {
      queries.createTodo('id-bool', 'Boolean test')
      const uncompleted = queries.getTodoById('id-bool')
      expect(uncompleted!.completed).toBe(false)
      expect(typeof uncompleted!.completed).toBe('boolean')

      queries.updateTodo('id-bool', { completed: true })
      const completed = queries.getTodoById('id-bool')
      expect(completed!.completed).toBe(true)
      expect(typeof completed!.completed).toBe('boolean')

      queries.updateTodo('id-bool', { completed: false })
      const uncompleted2 = queries.getTodoById('id-bool')
      expect(uncompleted2!.completed).toBe(false)
      expect(typeof uncompleted2!.completed).toBe('boolean')
    })
  })
})
