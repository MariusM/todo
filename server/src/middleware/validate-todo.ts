import { AppError } from './error-handler.js'
import type { Request, Response, NextFunction } from 'express'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function validateCreateTodo(req: Request, _res: Response, next: NextFunction): void {
  const { id, text } = req.body

  if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
    throw new AppError('Invalid or missing todo ID', 400, 'VALIDATION_ERROR')
  }

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new AppError('Todo text cannot be empty', 400, 'VALIDATION_ERROR')
  }

  next()
}

export function validateTodoId(req: Request, _res: Response, next: NextFunction): void {
  const { id } = req.params

  if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
    throw new AppError('Invalid todo ID format', 400, 'VALIDATION_ERROR')
  }

  next()
}

export function validateUpdateTodo(req: Request, _res: Response, next: NextFunction): void {
  const { text, completed } = req.body

  const hasText = text !== undefined
  const hasCompleted = completed !== undefined

  if (!hasText && !hasCompleted) {
    throw new AppError('At least one field (text or completed) is required', 400, 'VALIDATION_ERROR')
  }

  if (hasText) {
    if (typeof text !== 'string' || text.trim().length === 0) {
      throw new AppError('Todo text cannot be empty', 400, 'VALIDATION_ERROR')
    }
  }

  if (hasCompleted) {
    if (typeof completed !== 'boolean') {
      throw new AppError('Completed must be a boolean', 400, 'VALIDATION_ERROR')
    }
  }

  next()
}
