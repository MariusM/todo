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
