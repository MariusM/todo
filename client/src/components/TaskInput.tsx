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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const trimmed = text.trim()
    if (!trimmed) return

    onAddTodo(trimmed)
    setText('')
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Add task">
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What needs to be done?"
        aria-label="Add a new task"
        className="w-full rounded border border-border bg-surface px-3 py-2.5 text-base text-text-primary"
      />
    </form>
  )
}
