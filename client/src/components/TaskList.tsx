import { useState, useRef, useCallback, useEffect } from 'react'
import type { Todo } from '../types/todo'
import EmptyState from './EmptyState'
import TaskItem from './TaskItem'

interface TaskListProps {
  todos: Todo[]
  isLoading: boolean
  onToggle: (id: string, completed: boolean) => void
  onEdit: (id: string, text: string) => void
  onDelete: (id: string) => void
}

export default function TaskList({ todos, isLoading, onToggle, onEdit, onDelete }: TaskListProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const deletedIndexRef = useRef<number | null>(null)
  const hasLoadedRef = useRef(false)
  const prevTodosRef = useRef<Todo[]>([])
  const [announcement, setAnnouncement] = useState('')
  const repeatTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const newIds = new Set<string>()
  if (hasLoadedRef.current) {
    const prevIds = new Set(prevTodosRef.current.map((t) => t.id))
    for (const todo of todos) {
      if (!prevIds.has(todo.id)) {
        newIds.add(todo.id)
      }
    }
  }

  const announce = useCallback((message: string) => {
    clearTimeout(repeatTimerRef.current)
    setAnnouncement((prev) => {
      if (prev === message) {
        // Same message repeated — clear first, then re-set after a tick
        // so screen readers detect the DOM text change
        repeatTimerRef.current = setTimeout(() => setAnnouncement(message), 50)
        return ''
      }
      return message
    })
  }, [])

  useEffect(() => {
    return () => clearTimeout(repeatTimerRef.current)
  }, [])

  useEffect(() => {
    if (!hasLoadedRef.current) {
      if (!isLoading) hasLoadedRef.current = true
      prevTodosRef.current = todos
      return
    }

    const prevTodos = prevTodosRef.current
    const prevIds = new Set(prevTodos.map((t) => t.id))
    const currentIds = new Set(todos.map((t) => t.id))
    const prevById = new Map(prevTodos.map((t) => [t.id, t]))

    // Check for added todos
    for (const todo of todos) {
      if (!prevIds.has(todo.id)) {
        announce(`Task added: ${todo.text}`)
        prevTodosRef.current = todos
        return
      }
    }

    // Check for deleted todos
    for (const prev of prevTodos) {
      if (!currentIds.has(prev.id)) {
        announce(`Task deleted: ${prev.text}`)
        prevTodosRef.current = todos
        return
      }
    }

    // Check for completion status changes
    for (const todo of todos) {
      const prev = prevById.get(todo.id)
      if (prev && prev.completed !== todo.completed) {
        announce(
          todo.completed
            ? `Task completed: ${todo.text}`
            : `Task marked incomplete: ${todo.text}`
        )
        prevTodosRef.current = todos
        return
      }
    }

    prevTodosRef.current = todos
  }, [todos, isLoading, announce])

  const handleDelete = useCallback((id: string) => {
    const index = todos.findIndex((t) => t.id === id)
    deletedIndexRef.current = index
    onDelete(id)
  }, [todos, onDelete])

  useEffect(() => {
    if (deletedIndexRef.current === null) return
    const index = deletedIndexRef.current
    deletedIndexRef.current = null

    if (todos.length === 0) {
      const input = document.querySelector<HTMLInputElement>('input[aria-label="Add a new task"]')
      input?.focus()
      return
    }

    const ul = listRef.current
    if (!ul) return
    const items = ul.querySelectorAll('li')
    const targetIndex = index < todos.length ? index : todos.length - 1
    const targetItem = items[targetIndex]
    const focusable = targetItem?.querySelector<HTMLElement>('input[type="checkbox"]')
    focusable?.focus()
  }, [todos])

  return (
    <div>
      <div aria-live="polite" aria-atomic="true" className="sr-only" aria-busy={isLoading}>
        {announcement}
      </div>
      {isLoading ? (
        <p className="py-8 text-center text-sm text-text-muted">
          Loading tasks…
        </p>
      ) : todos.length === 0 ? (
        <EmptyState />
      ) : (
        <ul ref={listRef} role="list" aria-label="Task list" className="divide-y divide-border">
          {todos.map((todo) => (
            <TaskItem key={todo.id} todo={todo} onToggle={onToggle} onEdit={onEdit} onDelete={handleDelete} animateEntry={newIds.has(todo.id)} />
          ))}
        </ul>
      )}
    </div>
  )
}
