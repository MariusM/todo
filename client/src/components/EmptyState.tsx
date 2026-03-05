export default function EmptyState() {
  return (
    <div className="flex flex-col items-center py-12">
      <svg
        role="img"
        aria-hidden="true"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-text-muted opacity-40"
      >
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M9 12l2 2 4-4" />
      </svg>
      <h2 className="mt-4 text-lg font-medium text-text-secondary">
        No tasks yet
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        Type a task above and press Enter to get started.
      </p>
    </div>
  )
}
