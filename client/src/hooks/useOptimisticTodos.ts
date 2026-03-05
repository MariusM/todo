import { useState, useEffect, useCallback } from 'react'
import { fetchTodos, createTodo } from '../api/todos'
import type { Todo } from '../types/todo'

export interface ErrorInfo {
  message: string
  code: string
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
    if (!text.trim()) return

    const id = crypto.randomUUID()
    const newTodo: Todo = {
      id,
      text,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setTodos((prev) => {
      const snapshot = prev
      createTodo({ id, text }).catch((err: unknown) => {
        setTodos(snapshot)
        const message =
          err && typeof err === 'object' && 'error' in err
            ? (err as { error: { message: string } }).error.message
            : 'Failed to create todo'
        setErrors((prevErrors) => [...prevErrors, { message, code: 'CREATE_ERROR' }])
      })
      return [...prev, newTodo]
    })
  }, [])

  return { todos, isLoading, errors, addTodo }
}
