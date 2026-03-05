import { useState, useEffect, useCallback } from 'react'
import { fetchTodos, createTodo, updateTodo as apiUpdateTodo, deleteTodo as apiDeleteTodo } from '../api/todos'
import type { Todo, UpdateTodoRequest } from '../types/todo'

export interface ErrorInfo {
  message: string
  code: string
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'error' in err) {
    return (err as { error: { message: string } }).error.message
  }
  return fallback
}

export function useOptimisticTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<ErrorInfo[]>([])

  useEffect(() => {
    fetchTodos()
      .then((data) => {
        setTodos(data)
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load todos'
        setErrors((prev) => [...prev, { message, code: 'FETCH_ERROR' }])
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const addTodo = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const newTodo: Todo = {
      id,
      text: trimmed,
      completed: false,
      createdAt: now,
      updatedAt: now,
    }

    setTodos((prev) => [...prev, newTodo])

    createTodo({ id, text: trimmed }).catch((err: unknown) => {
      setTodos((prev) => prev.filter((todo) => todo.id !== id))
      const message = extractErrorMessage(err, 'Failed to create todo')
      setErrors((prevErrors) => [...prevErrors, { message, code: 'CREATE_ERROR' }])
    })
  }, [])

  const updateTodo = useCallback((id: string, fields: UpdateTodoRequest) => {
    const original = todos.find((t) => t.id === id)
    if (!original) return

    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, ...fields, updatedAt: new Date().toISOString() } : t
      )
    )

    apiUpdateTodo(id, fields).catch((err: unknown) => {
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? original : t))
      )
      const message = extractErrorMessage(err, 'Failed to update todo')
      setErrors((prev) => [...prev, { message, code: 'UPDATE_ERROR' }])
    })
  }, [todos])

  const removeTodo = useCallback((id: string) => {
    const removed = todos.find((t) => t.id === id)
    if (!removed) return

    setTodos((prev) => prev.filter((t) => t.id !== id))

    apiDeleteTodo(id).catch((err: unknown) => {
      setTodos((prev) => [...prev, removed])
      const message = extractErrorMessage(err, 'Failed to delete todo')
      setErrors((prev) => [...prev, { message, code: 'DELETE_ERROR' }])
    })
  }, [todos])

  return { todos, isLoading, errors, addTodo, updateTodo, deleteTodo: removeTodo }
}
