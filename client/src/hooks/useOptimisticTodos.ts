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
      const message =
        err && typeof err === 'object' && 'error' in err
          ? (err as { error: { message: string } }).error.message
          : 'Failed to create todo'
      setErrors((prevErrors) => [...prevErrors, { message, code: 'CREATE_ERROR' }])
    })
  }, [])

  return { todos, isLoading, errors, addTodo }
}
