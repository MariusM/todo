import { useState, useRef, useCallback } from 'react'
import type { ErrorInfo } from '../hooks/useOptimisticTodos'

const ERROR_MESSAGES: Record<string, string> = {
  CREATE_ERROR: "Adding that task didn't go through -- try again?",
  UPDATE_ERROR: "That didn't go through -- your task is safe. Try again?",
  DELETE_ERROR: "That didn't go through -- your task is still here.",
  FETCH_ERROR: "Can't reach the server right now. Check your connection and try again.",
}

interface ErrorBannerProps {
  errors: ErrorInfo[]
  onDismiss: (id: string) => void
}

export default function ErrorBanner({ errors, onDismiss }: ErrorBannerProps) {
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set())
  const bannerRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const handleDismiss = useCallback((id: string) => {
    setExitingIds((prev) => new Set(prev).add(id))
    const el = bannerRefs.current.get(id)
    let called = false
    const finish = () => {
      if (called) return
      called = true
      setExitingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      onDismiss(id)
    }
    if (el) {
      el.addEventListener('animationend', finish, { once: true })
      // Fallback in case animationend doesn't fire (e.g., prefers-reduced-motion)
      setTimeout(finish, 200)
    } else {
      onDismiss(id)
    }
  }, [onDismiss])

  if (errors.length === 0) return null

  return (
    <div className="mt-4 flex flex-col gap-2">
      {errors.map((error) => (
        <div
          key={error.id}
          ref={(el) => {
            if (el) bannerRefs.current.set(error.id, el)
            else bannerRefs.current.delete(error.id)
          }}
          role="alert"
          aria-atomic="true"
          className={`${exitingIds.has(error.id) ? 'banner-exit' : 'banner-enter'} flex items-center gap-3 rounded-lg border border-error-border bg-error-bg px-4 py-3 text-sm text-error-text`}
        >
          <span className="shrink-0" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </span>
          <span className="flex-1">{ERROR_MESSAGES[error.code] ?? error.message}</span>
          <button
            type="button"
            onClick={() => handleDismiss(error.id)}
            className="flex h-[44px] w-[44px] shrink-0 items-center justify-center text-error-text"
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  )
}
