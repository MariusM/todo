import { useOptimisticTodos } from './hooks/useOptimisticTodos'
import TaskInput from './components/TaskInput'
import TaskList from './components/TaskList'

export default function App() {
  // errors and dismissError will be passed to ErrorBanner in Story 3.2
  const { todos, isLoading, errors: _errors, addTodo, updateTodo, deleteTodo, dismissError: _dismissError } = useOptimisticTodos()

  return (
    <div className="min-h-screen bg-surface-secondary">
      <main className="mx-auto max-w-[var(--max-content-width)] p-4">
        <h1 className="mb-6 text-xl font-bold text-text-primary">Todo</h1>
        <TaskInput onAddTodo={addTodo} />
        <div className="mt-4">
          <TaskList todos={todos} isLoading={isLoading} onToggle={(id, completed) => updateTodo(id, { completed })} onEdit={(id, text) => updateTodo(id, { text })} onDelete={deleteTodo} />
        </div>
      </main>
    </div>
  )
}
