import type { Todo } from '../types/todo'
import EmptyState from './EmptyState'
import TaskItem from './TaskItem'

interface TaskListProps {
  todos: Todo[]
  isLoading: boolean
  onToggle: (id: string, completed: boolean) => void
}

export default function TaskList({ todos, isLoading, onToggle }: TaskListProps) {
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
            <TaskItem key={todo.id} todo={todo} onToggle={onToggle} />
          ))}
        </ul>
      )}
    </div>
  )
}
