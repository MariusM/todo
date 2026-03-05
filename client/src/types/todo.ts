export interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: string  // ISO 8601
  updatedAt: string  // ISO 8601
}

export interface CreateTodoRequest {
  id: string   // UUID generated client-side
  text: string
}

export interface UpdateTodoRequest {
  text?: string
  completed?: boolean
}

export interface ApiError {
  error: {
    message: string
    code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INTERNAL_ERROR'
  }
}
