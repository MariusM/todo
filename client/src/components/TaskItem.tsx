import type { Todo } from '../types/todo'

interface TaskItemProps {
  todo: Todo
  onToggle: (id: string, completed: boolean) => void
}

export default function TaskItem({ todo, onToggle }: TaskItemProps) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id, !todo.completed)}
        className="h-5 w-5 appearance-none rounded border-2 border-border
                   checked:bg-checkbox-fill checked:border-checkbox-fill
                   transition-all duration-200 cursor-pointer
                   relative shrink-0"
        aria-label={`Mark "${todo.text}" as ${todo.completed ? 'incomplete' : 'complete'}`}
      />
      <span className={`transition-all duration-200 ${
        todo.completed
          ? 'line-through text-completed-text'
          : 'text-text-primary'
      }`}>
        {todo.text}
      </span>
    </li>
  )
}
