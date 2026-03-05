import fs from 'fs'
import path from 'path'
import os from 'os'
import { describe, it, expect, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { initDatabase } from './init.js'

describe('Database initialization', () => {
  let db: Database.Database

  afterEach(() => {
    if (db) db.close()
  })

  it('creates the todos table with correct columns', () => {
    db = initDatabase(':memory:')

    const tableInfo = db.pragma('table_info(todos)') as Array<{
      name: string
      type: string
      notnull: number
      dflt_value: string | null
      pk: number
    }>

    const columns = tableInfo.map((col) => col.name)
    expect(columns).toEqual(['id', 'text', 'completed', 'created_at', 'updated_at'])

    const idCol = tableInfo.find((c) => c.name === 'id')!
    expect(idCol.type).toBe('TEXT')
    expect(idCol.pk).toBe(1)

    const textCol = tableInfo.find((c) => c.name === 'text')!
    expect(textCol.type).toBe('TEXT')
    expect(textCol.notnull).toBe(1)

    const completedCol = tableInfo.find((c) => c.name === 'completed')!
    expect(completedCol.type).toBe('INTEGER')
    expect(completedCol.notnull).toBe(1)
    expect(completedCol.dflt_value).toBe('0')

    const createdAtCol = tableInfo.find((c) => c.name === 'created_at')!
    expect(createdAtCol.type).toBe('TEXT')
    expect(createdAtCol.notnull).toBe(1)

    const updatedAtCol = tableInfo.find((c) => c.name === 'updated_at')!
    expect(updatedAtCol.type).toBe('TEXT')
    expect(updatedAtCol.notnull).toBe(1)
  })

  it('is idempotent — running init twice on the same database does not error', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'todo-idempotent-'))
    const dbPath = path.join(tmpDir, 'idempotent.db')

    db = initDatabase(dbPath)
    const db2 = initDatabase(dbPath)
    db2.close()

    // Verify table still exists and is functional
    const rows = db.prepare('SELECT * FROM todos').all()
    expect(rows).toEqual([])

    fs.rmSync(tmpDir, { recursive: true })
  })

  it('enables WAL mode for file-based databases', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'todo-wal-'))
    const dbPath = path.join(tmpDir, 'wal-test.db')

    db = initDatabase(dbPath)
    const journalMode = db.pragma('journal_mode') as Array<{ journal_mode: string }>
    expect(journalMode[0].journal_mode).toBe('wal')

    db.close()
    fs.rmSync(tmpDir, { recursive: true })
  })

  it('creates data directory when using file path', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'todo-test-'))
    const dbPath = path.join(tmpDir, 'subdir', 'test.db')

    db = initDatabase(dbPath)
    expect(fs.existsSync(path.dirname(dbPath))).toBe(true)

    db.close()
    fs.rmSync(tmpDir, { recursive: true })
  })
})
