import { describe, it, expect } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { validateCreateTodo, validateUpdateTodo, validateTodoId } from './validate-todo.js'
import { AppError } from './error-handler.js'

function createMockReq(body: unknown, params?: Record<string, string>): Request {
  return { body, params: params ?? {} } as unknown as Request
}

const mockRes = {} as Response

function callMiddleware(
  middleware: (req: Request, res: Response, next: NextFunction) => void,
  body: unknown,
  params?: Record<string, string>
): { error?: AppError; nextCalled: boolean } {
  const result: { error?: AppError; nextCalled: boolean } = { nextCalled: false }
  const next: NextFunction = () => {
    result.nextCalled = true
  }

  try {
    middleware(createMockReq(body, params), mockRes, next)
  } catch (err) {
    if (err instanceof AppError) {
      result.error = err
    } else {
      throw err
    }
  }

  return result
}

function expectValidationError(result: { error?: AppError; nextCalled: boolean }, message?: string) {
  expect(result.error).toBeDefined()
  expect(result.error).toBeInstanceOf(AppError)
  const error = result.error as AppError
  expect(error.statusCode).toBe(400)
  expect(error.code).toBe('VALIDATION_ERROR')
  if (message) {
    expect(error.message).toBe(message)
  }
}

describe('validateCreateTodo', () => {
  it('accepts valid UUID and non-empty text', () => {
    const result = callMiddleware(validateCreateTodo, { id: '550e8400-e29b-41d4-a716-446655440000', text: 'Buy milk' })
    expect(result.nextCalled).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('rejects missing id', () => {
    const result = callMiddleware(validateCreateTodo, { text: 'Buy milk' })
    expectValidationError(result)
  })

  it('rejects invalid UUID format', () => {
    const result = callMiddleware(validateCreateTodo, { id: 'not-a-uuid', text: 'Buy milk' })
    expectValidationError(result)
  })

  it('rejects non-string id', () => {
    const result = callMiddleware(validateCreateTodo, { id: 123, text: 'Buy milk' })
    expectValidationError(result)
  })

  it('rejects empty text', () => {
    const result = callMiddleware(validateCreateTodo, { id: '550e8400-e29b-41d4-a716-446655440000', text: '' })
    expectValidationError(result, 'Todo text cannot be empty')
  })

  it('rejects whitespace-only text', () => {
    const result = callMiddleware(validateCreateTodo, { id: '550e8400-e29b-41d4-a716-446655440000', text: '   ' })
    expectValidationError(result, 'Todo text cannot be empty')
  })

  it('rejects missing text field', () => {
    const result = callMiddleware(validateCreateTodo, { id: '550e8400-e29b-41d4-a716-446655440000' })
    expectValidationError(result)
  })

  it('rejects missing body fields entirely', () => {
    const result = callMiddleware(validateCreateTodo, {})
    expectValidationError(result)
  })
})

describe('validateTodoId', () => {
  it('accepts valid UUID in params', () => {
    const result = callMiddleware(validateTodoId, {}, { id: '550e8400-e29b-41d4-a716-446655440000' })
    expect(result.nextCalled).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('rejects invalid UUID format', () => {
    const result = callMiddleware(validateTodoId, {}, { id: 'not-a-uuid' })
    expectValidationError(result)
  })

  it('rejects missing id param', () => {
    const result = callMiddleware(validateTodoId, {}, {})
    expectValidationError(result)
  })
})

describe('validateUpdateTodo', () => {
  it('accepts valid text field', () => {
    const result = callMiddleware(validateUpdateTodo, { text: 'Updated text' })
    expect(result.nextCalled).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('accepts valid completed field', () => {
    const result = callMiddleware(validateUpdateTodo, { completed: true })
    expect(result.nextCalled).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('accepts both text and completed', () => {
    const result = callMiddleware(validateUpdateTodo, { text: 'Updated', completed: false })
    expect(result.nextCalled).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('rejects empty body (no fields)', () => {
    const result = callMiddleware(validateUpdateTodo, {})
    expectValidationError(result, 'At least one field (text or completed) is required')
  })

  it('rejects empty text', () => {
    const result = callMiddleware(validateUpdateTodo, { text: '' })
    expectValidationError(result, 'Todo text cannot be empty')
  })

  it('rejects whitespace-only text', () => {
    const result = callMiddleware(validateUpdateTodo, { text: '   ' })
    expectValidationError(result, 'Todo text cannot be empty')
  })

  it('rejects non-boolean completed', () => {
    const result = callMiddleware(validateUpdateTodo, { completed: 'yes' })
    expectValidationError(result, 'Completed must be a boolean')
  })

  it('rejects non-boolean completed (number)', () => {
    const result = callMiddleware(validateUpdateTodo, { completed: 1 })
    expectValidationError(result, 'Completed must be a boolean')
  })

  it('rejects non-string text', () => {
    const result = callMiddleware(validateUpdateTodo, { text: 123 })
    expectValidationError(result, 'Todo text cannot be empty')
  })

  it('rejects array body', () => {
    const result = callMiddleware(validateUpdateTodo, [{ text: 'test' }])
    expectValidationError(result, 'Request body is required')
  })

  it('rejects null body', () => {
    const result = callMiddleware(validateUpdateTodo, null)
    expectValidationError(result, 'Request body is required')
  })

  it('accepts text with tab and newline characters', () => {
    const result = callMiddleware(validateUpdateTodo, { text: 'line1\tindented\nline2' })
    expect(result.nextCalled).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('rejects text that is only tabs and newlines', () => {
    const result = callMiddleware(validateUpdateTodo, { text: '\t\n\r' })
    expectValidationError(result, 'Todo text cannot be empty')
  })
})

describe('validateTodoId edge cases', () => {
  it('rejects partial UUID (missing last section)', () => {
    const result = callMiddleware(validateTodoId, {}, { id: '550e8400-e29b-41d4-a716' })
    expectValidationError(result)
  })

  it('rejects UUID with extra characters', () => {
    const result = callMiddleware(validateTodoId, {}, { id: '550e8400-e29b-41d4-a716-446655440000-extra' })
    expectValidationError(result)
  })

  it('accepts uppercase UUID', () => {
    const result = callMiddleware(validateTodoId, {}, { id: '550E8400-E29B-41D4-A716-446655440000' })
    expect(result.nextCalled).toBe(true)
    expect(result.error).toBeUndefined()
  })
})
