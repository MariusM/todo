import type { Todo } from '../types/todo'
import EmptyState from './EmptyState'

interface TaskListProps {
  todos: Todo[]
  isLoading: boolean
}

export default function TaskList({ todos, isLoading }: TaskListProps) {
  if (isLoading) {
    return (
      <p className="py-8 text-center text-sm text-text-muted">
        Loading tasks…
      </p>
    )
  }

  if (todos.length === 0) {
    return <EmptyState />
  }

  return (
    <div aria-live="polite">
      <ul role="list" aria-label="Task list" className="divide-y divide-border">
        {todos.map((todo) => (
          <li key={todo.id} className="flex items-center gap-3 px-3 py-3">
            <input
              type="checkbox"
              checked={todo.completed}
              readOnly
              aria-label={`Task: ${todo.text}`}
              className="h-4 w-4 rounded border-border text-checkbox-fill"
            />
            <span className="text-text-primary">{todo.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
