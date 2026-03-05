import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchTodos, createTodo, updateTodo as apiUpdateTodo, deleteTodo as apiDeleteTodo } from '../api/todos'
import type { Todo, UpdateTodoRequest } from '../types/todo'

export interface ErrorInfo {
  id: string
  message: string
  code: string
}

let nextErrorId = 0

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
  const todosRef = useRef(todos)
  todosRef.current = todos

  useEffect(() => {
    fetchTodos()
      .then((data) => {
        setTodos(data)
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load todos'
        setErrors((prev) => [...prev, { id: String(++nextErrorId), message, code: 'FETCH_ERROR' }])
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
      setErrors((prevErrors) => [...prevErrors, { id: String(++nextErrorId), message, code: 'CREATE_ERROR' }])
    })
  }, [])

  const updateTodo = useCallback((id: string, fields: UpdateTodoRequest) => {
    const original = todosRef.current.find((t) => t.id === id)
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
      setErrors((prev) => [...prev, { id: String(++nextErrorId), message, code: 'UPDATE_ERROR' }])
    })
  }, [])

  const removeTodo = useCallback((id: string) => {
    const currentTodos = todosRef.current
    const removed = currentTodos.find((t) => t.id === id)
    if (!removed) return

    setTodos((prev) => prev.filter((t) => t.id !== id))

    apiDeleteTodo(id).catch((err: unknown) => {
      setTodos((prev) => {
        const restored = [...prev]
        const insertAt = restored.findIndex((t) => t.createdAt > removed.createdAt)
        if (insertAt === -1) {
          restored.push(removed)
        } else {
          restored.splice(insertAt, 0, removed)
        }
        return restored
      })
      const message = extractErrorMessage(err, 'Failed to delete todo')
      setErrors((prev) => [...prev, { id: String(++nextErrorId), message, code: 'DELETE_ERROR' }])
    })
  }, [])

  const dismissError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id))
  }, [])

  return { todos, isLoading, errors, addTodo, updateTodo, deleteTodo: removeTodo, dismissError }
}
