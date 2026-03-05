import { useState, useRef, useEffect } from 'react'

interface TaskInputProps {
  onAddTodo: (text: string) => void
}

export default function TaskInput({ onAddTodo }: TaskInputProps) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return

    const trimmed = text.trim()
    if (!trimmed) return

    onAddTodo(trimmed)
    setText('')
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="What needs to be done?"
      aria-label="Add a new task"
      className="w-full rounded border border-border bg-surface px-3 py-2.5 text-base text-text-primary outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2"
    />
  )
}
