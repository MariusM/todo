import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'

const DEFAULT_DB_PATH = './data/todos.db'

export function initDatabase(dbPath?: string): Database.Database {
  const resolvedPath = dbPath ?? process.env.DATABASE_PATH ?? DEFAULT_DB_PATH

  if (resolvedPath !== ':memory:') {
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true })
  }

  const db = new Database(resolvedPath)

  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  return db
}
