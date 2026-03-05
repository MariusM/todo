import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type Database from 'better-sqlite3'
import { initDatabase } from './init.js'
import {
  getAllTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
} from './queries.js'

describe('Database queries', () => {
  let db: Database.Database

  beforeEach(() => {
    db = initDatabase(':memory:')
  })

  afterEach(() => {
    db.close()
  })

  describe('createTodo', () => {
    it('creates a todo and returns it with camelCase fields', () => {
      const todo = createTodo(db, '550e8400-e29b-41d4-a716-446655440000', 'Buy groceries')

      expect(todo.id).toBe('550e8400-e29b-41d4-a716-446655440000')
      expect(todo.text).toBe('Buy groceries')
      expect(todo.completed).toBe(false)
      expect(todo.createdAt).toBeDefined()
      expect(todo.updatedAt).toBeDefined()
    })
  })

  describe('getAllTodos', () => {
    it('returns empty array when no todos exist', () => {
      const todos = getAllTodos(db)
      expect(todos).toEqual([])
    })

    it('returns all todos ordered by created_at', () => {
      createTodo(db, 'id-1', 'First')
      createTodo(db, 'id-2', 'Second')

      const todos = getAllTodos(db)
      expect(todos).toHaveLength(2)
      expect(todos[0].text).toBe('First')
      expect(todos[1].text).toBe('Second')
    })

    it('returns todos with camelCase fields', () => {
      createTodo(db, 'id-1', 'Test')
      const todos = getAllTodos(db)

      expect(todos[0]).toHaveProperty('createdAt')
      expect(todos[0]).toHaveProperty('updatedAt')
      expect(todos[0]).not.toHaveProperty('created_at')
      expect(todos[0]).not.toHaveProperty('updated_at')
    })
  })

  describe('getTodoById', () => {
    it('returns a todo by id', () => {
      createTodo(db, 'id-1', 'Test')
      const todo = getTodoById(db, 'id-1')

      expect(todo).not.toBeUndefined()
      expect(todo!.id).toBe('id-1')
      expect(todo!.text).toBe('Test')
    })

    it('returns undefined for non-existent id', () => {
      const todo = getTodoById(db, 'non-existent')
      expect(todo).toBeUndefined()
    })
  })

  describe('updateTodo', () => {
    it('updates text field', () => {
      createTodo(db, 'id-1', 'Original')
      const updated = updateTodo(db, 'id-1', { text: 'Updated' })

      expect(updated).not.toBeUndefined()
      expect(updated!.text).toBe('Updated')
    })

    it('updates completed field', () => {
      createTodo(db, 'id-1', 'Test')
      const updated = updateTodo(db, 'id-1', { completed: true })

      expect(updated!.completed).toBe(true)
    })

    it('updates updated_at timestamp', () => {
      createTodo(db, 'id-1', 'Test')
      const original = getTodoById(db, 'id-1')

      const updated = updateTodo(db, 'id-1', { text: 'Changed' })
      expect(updated!.updatedAt).toBeDefined()
    })

    it('returns undefined for non-existent id', () => {
      const result = updateTodo(db, 'non-existent', { text: 'Test' })
      expect(result).toBeUndefined()
    })
  })

  describe('deleteTodo', () => {
    it('deletes a todo and returns true', () => {
      createTodo(db, 'id-1', 'Test')
      const result = deleteTodo(db, 'id-1')

      expect(result).toBe(true)
      expect(getTodoById(db, 'id-1')).toBeUndefined()
    })

    it('returns false for non-existent id', () => {
      const result = deleteTodo(db, 'non-existent')
      expect(result).toBe(false)
    })
  })
})
