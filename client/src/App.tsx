import { useOptimisticTodos } from './hooks/useOptimisticTodos'
import TaskInput from './components/TaskInput'
import TaskList from './components/TaskList'
import ErrorBanner from './components/ErrorBanner'

export default function App() {
  const { todos, isLoading, errors, addTodo, updateTodo, deleteTodo, dismissError } = useOptimisticTodos()

  return (
    <div className="min-h-screen bg-surface-secondary">
      <main className="mx-auto max-w-[var(--max-content-width)] px-4 pt-8 md:px-6 md:pt-12 lg:px-8">
        <h1 className="mb-6 text-xl font-bold text-text-primary">Todo</h1>
        <TaskInput onAddTodo={addTodo} />
        {errors.length > 0 && <ErrorBanner errors={errors} onDismiss={dismissError} />}
        <div className="mt-4">
          <TaskList todos={todos} isLoading={isLoading} onToggle={(id, completed) => updateTodo(id, { completed })} onEdit={(id, text) => updateTodo(id, { text })} onDelete={deleteTodo} />
        </div>
      </main>
    </div>
  )
}
