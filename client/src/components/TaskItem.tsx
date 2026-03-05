import type { Todo } from '../types/todo'

interface TaskItemProps {
  todo: Todo
  onToggle: (id: string, completed: boolean) => void
}

export default function TaskItem({ todo, onToggle }: TaskItemProps) {
  return (
    <li className="flex items-center gap-1 px-1 py-0.5">
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
