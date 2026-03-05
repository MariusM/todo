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

export function getAllTodos(db: Database.Database): Todo[] {
  const rows = db.prepare('SELECT * FROM todos ORDER BY created_at').all() as TodoRow[]
  return rows.map(toTodo)
}

export function getTodoById(db: Database.Database, id: string): Todo | undefined {
  const row = db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as TodoRow | undefined
  return row ? toTodo(row) : undefined
}

export function createTodo(db: Database.Database, id: string, text: string): Todo {
  db.prepare(
    "INSERT INTO todos (id, text, created_at, updated_at) VALUES (?, ?, datetime('now'), datetime('now'))"
  ).run(id, text)

  return getTodoById(db, id)!
}

export function updateTodo(
  db: Database.Database,
  id: string,
  fields: { text?: string; completed?: boolean }
): Todo | undefined {
  const setClauses: string[] = []
  const values: (string | number)[] = []

  if (fields.text !== undefined) {
    setClauses.push('text = ?')
    values.push(fields.text)
  }

  if (fields.completed !== undefined) {
    setClauses.push('completed = ?')
    values.push(fields.completed ? 1 : 0)
  }

  if (setClauses.length === 0) {
    return getTodoById(db, id)
  }

  setClauses.push("updated_at = datetime('now')")
  values.push(id)

  const result = db.prepare(
    `UPDATE todos SET ${setClauses.join(', ')} WHERE id = ?`
  ).run(...values)

  if (result.changes === 0) return undefined
  return getTodoById(db, id)
}

export function deleteTodo(db: Database.Database, id: string): boolean {
  const result = db.prepare('DELETE FROM todos WHERE id = ?').run(id)
  return result.changes > 0
}
