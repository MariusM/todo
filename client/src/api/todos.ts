import type { Todo, CreateTodoRequest, ApiError } from '../types/todo'

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json()) as ApiError
    throw body
  }
  return response.json() as Promise<T>
}

export async function fetchTodos(): Promise<Todo[]> {
  const response = await fetch('/api/todos')
  return handleResponse<Todo[]>(response)
}

export async function createTodo(request: CreateTodoRequest): Promise<Todo> {
  const response = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  return handleResponse<Todo>(response)
}
