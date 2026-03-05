import { Router } from 'express'
import { validateCreateTodo } from '../middleware/validate-todo.js'
import { AppError } from '../middleware/error-handler.js'
import type { createQueries } from '../db/queries.js'

function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function createTodoRoutes(queries: ReturnType<typeof createQueries>) {
  const router = Router()

  router.post('/api/todos', validateCreateTodo, (req, res) => {
    const { id, text } = req.body

    const existing = queries.getTodoById(id)
    if (existing) {
      throw new AppError('Todo with this ID already exists', 400, 'VALIDATION_ERROR')
    }

    const todo = queries.createTodo(id, sanitizeText(text.trim()))
    res.status(201).json(todo)
  })

  router.get('/api/todos', (_req, res) => {
    const todos = queries.getAllTodos()
    res.json(todos)
  })

  return router
}
