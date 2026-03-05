import type Database from 'better-sqlite3'
import type { Todo } from '../types/todo.js'

interface TodoRow {
  id: string
  text: string
  completed: number
  created_at: string
  updated_at: string
}

function toTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    text: row.text,
    completed: row.completed === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function createQueries(db: Database.Database) {
  const stmts = {
    getAll: db.prepare('SELECT * FROM todos ORDER BY created_at'),
    getById: db.prepare('SELECT * FROM todos WHERE id = ?'),
    create: db.prepare(
      "INSERT INTO todos (id, text, created_at, updated_at) VALUES (?, ?, datetime('now'), datetime('now'))"
    ),
    delete: db.prepare('DELETE FROM todos WHERE id = ?'),
    updateText: db.prepare(
      "UPDATE todos SET text = ?, updated_at = datetime('now') WHERE id = ?"
    ),
    updateCompleted: db.prepare(
      "UPDATE todos SET completed = ?, updated_at = datetime('now') WHERE id = ?"
    ),
    updateBoth: db.prepare(
      "UPDATE todos SET text = ?, completed = ?, updated_at = datetime('now') WHERE id = ?"
    ),
  }

  function getAllTodos(): Todo[] {
    const rows = stmts.getAll.all() as TodoRow[]
    return rows.map(toTodo)
  }

  function getTodoById(id: string): Todo | undefined {
    const row = stmts.getById.get(id) as TodoRow | undefined
    return row ? toTodo(row) : undefined
  }

  function createTodo(id: string, text: string): Todo {
    stmts.create.run(id, text)

    const todo = getTodoById(id)
    if (!todo) {
      throw new Error(`Failed to read back created todo with id ${id}`)
    }
    return todo
  }

  function updateTodo(
    id: string,
    fields: { text?: string; completed?: boolean }
  ): Todo | undefined {
    const hasText = fields.text !== undefined
    const hasCompleted = fields.completed !== undefined

    if (!hasText && !hasCompleted) {
      return getTodoById(id)
    }

    let result: Database.RunResult

    if (hasText && hasCompleted) {
      result = stmts.updateBoth.run(fields.text, fields.completed ? 1 : 0, id)
    } else if (hasText) {
      result = stmts.updateText.run(fields.text, id)
    } else {
      result = stmts.updateCompleted.run(fields.completed ? 1 : 0, id)
    }

    if (result.changes === 0) return undefined
    return getTodoById(id)
  }

  function deleteTodo(id: string): boolean {
    const result = stmts.delete.run(id)
    return result.changes > 0
  }

  return { getAllTodos, getTodoById, createTodo, updateTodo, deleteTodo }
}
