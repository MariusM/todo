import { useState, useRef, useEffect, useCallback } from 'react'
import type { Todo } from '../types/todo'

interface TaskItemProps {
  todo: Todo
  onToggle: (id: string, completed: boolean) => void
  onEdit: (id: string, text: string) => void
  onDelete: (id: string) => void
  animateEntry?: boolean
}

export default function TaskItem({ todo, onToggle, onEdit, onDelete, animateEntry = false }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [isExiting, setIsExiting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const liRef = useRef<HTMLLIElement>(null)
  const skipBlurRef = useRef(false)

  const handleDelete = useCallback(() => {
    setIsExiting(true)
    const el = liRef.current
    let called = false
    const handler = () => {
      if (called) return
      called = true
      onDelete(todo.id)
    }
    if (el) {
      el.addEventListener('animationend', handler, { once: true })
      // Fallback in case animationend doesn't fire (e.g., prefers-reduced-motion)
      setTimeout(handler, 200)
    } else {
      onDelete(todo.id)
    }
  }, [onDelete, todo.id])

  const handleTextClick = () => {
    setIsEditing(true)
    setEditText(todo.text)
  }

  const handleSave = () => {
    const trimmed = editText.trim()
    if (trimmed && trimmed !== todo.text) {
      onEdit(todo.id, trimmed)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { skipBlurRef.current = true; handleSave() }
    if (e.key === 'Escape') { skipBlurRef.current = true; handleCancel() }
  }

  const handleBlur = () => {
    if (skipBlurRef.current) { skipBlurRef.current = false; return }
    handleSave()
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      const len = inputRef.current.value.length
      inputRef.current.setSelectionRange(len, len)
    }
  }, [isEditing])

  return (
    <li ref={liRef} className={`group flex items-center gap-1 px-1 py-3 md:py-3.5 ${animateEntry ? 'task-enter' : ''} ${isExiting ? 'task-exit' : ''}`}>
      <label className="flex items-center justify-center min-w-[44px] min-h-[44px] cursor-pointer shrink-0">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id, !todo.completed)}
          className="h-5 w-5 appearance-none rounded border-2 border-border
                     checked:bg-checkbox-fill checked:border-checkbox-fill
                     transition-all duration-200 cursor-pointer
                     relative"
          aria-label={`Mark "${todo.text}" as ${todo.completed ? 'incomplete' : 'complete'}`}
        />
      </label>
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="flex-1 px-2 py-1 bg-surface border border-border rounded
                     text-text-primary focus-visible:border-border-focus
                     transition-colors duration-150"
          aria-label={`Edit task: ${todo.text}`}
        />
      ) : (
        <span
          onClick={handleTextClick}
          className={`flex-1 cursor-text break-words px-2 py-1 border border-transparent rounded transition-all duration-200 ${
            todo.completed
              ? 'line-through text-completed-text'
              : 'text-text-primary'
          }`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTextClick() } }}
          aria-label={`Edit task: ${todo.text}`}
        >
          {todo.text}
        </span>
      )}
      <button
        onClick={handleDelete}
        className="flex items-center justify-center min-w-[44px] min-h-[44px] shrink-0
                   text-border hover:text-error-text focus:text-error-text
                   opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
                   max-sm:opacity-100 max-sm:text-text-secondary
                   transition-colors duration-fast cursor-pointer"
        aria-label={`Delete task: ${todo.text}`}
      >
        &times;
      </button>
    </li>
  )
}
