import { describe, it, expect } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { validateCreateTodo } from './validate-todo.js'
import { AppError } from './error-handler.js'

function createMockReq(body: unknown): Request {
  return { body } as Request
}

const mockRes = {} as Response

function callMiddleware(body: unknown): { error?: AppError; nextCalled: boolean } {
  const result: { error?: AppError; nextCalled: boolean } = { nextCalled: false }
  const next: NextFunction = () => {
    result.nextCalled = true
  }

  try {
    validateCreateTodo(createMockReq(body), mockRes, next)
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
    const result = callMiddleware({ id: '550e8400-e29b-41d4-a716-446655440000', text: 'Buy milk' })
    expect(result.nextCalled).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('rejects missing id', () => {
    const result = callMiddleware({ text: 'Buy milk' })
    expectValidationError(result)
  })

  it('rejects invalid UUID format', () => {
    const result = callMiddleware({ id: 'not-a-uuid', text: 'Buy milk' })
    expectValidationError(result)
  })

  it('rejects non-string id', () => {
    const result = callMiddleware({ id: 123, text: 'Buy milk' })
    expectValidationError(result)
  })

  it('rejects empty text', () => {
    const result = callMiddleware({ id: '550e8400-e29b-41d4-a716-446655440000', text: '' })
    expectValidationError(result, 'Todo text cannot be empty')
  })

  it('rejects whitespace-only text', () => {
    const result = callMiddleware({ id: '550e8400-e29b-41d4-a716-446655440000', text: '   ' })
    expectValidationError(result, 'Todo text cannot be empty')
  })

  it('rejects missing text field', () => {
    const result = callMiddleware({ id: '550e8400-e29b-41d4-a716-446655440000' })
    expectValidationError(result)
  })

  it('rejects missing body fields entirely', () => {
    const result = callMiddleware({})
    expectValidationError(result)
  })
})
