import type { Todo } from '../types/todo'
import EmptyState from './EmptyState'

interface TaskListProps {
  todos: Todo[]
  isLoading: boolean
}

export default function TaskList({ todos, isLoading }: TaskListProps) {
  return (
    <div aria-live="polite">
      {isLoading ? (
        <p className="py-8 text-center text-sm text-text-muted">
          Loading tasks…
        </p>
      ) : todos.length === 0 ? (
        <EmptyState />
      ) : (
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
      )}
    </div>
  )
}
