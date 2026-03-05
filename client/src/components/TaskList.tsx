import { useRef, useCallback, useEffect } from 'react'
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
  const prevTodoIdsRef = useRef<Set<string>>(new Set())

  const newIds = new Set<string>()
  if (hasLoadedRef.current) {
    for (const todo of todos) {
      if (!prevTodoIdsRef.current.has(todo.id)) {
        newIds.add(todo.id)
      }
    }
  }

  useEffect(() => {
    if (!isLoading) hasLoadedRef.current = true
    prevTodoIdsRef.current = new Set(todos.map((t) => t.id))
  })

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
    <div aria-live="polite">
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
