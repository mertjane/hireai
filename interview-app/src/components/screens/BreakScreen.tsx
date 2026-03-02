import { useState, useEffect, useRef, useCallback } from 'react'

const BREAK_DURATION = 30

interface Props {
  nextIndex: number
  totalQuestions: number
  onComplete: () => void
}

export function BreakScreen({ nextIndex, totalQuestions, onComplete }: Props) {
  const [remaining, setRemaining] = useState(BREAK_DURATION)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          onCompleteRef.current()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const handleSkip = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    onCompleteRef.current()
  }, [])

  // Enter or Space to skip break
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleSkip()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleSkip])

  const pct = ((BREAK_DURATION - remaining) / BREAK_DURATION) * 100

  return (
    <section className="flex min-h-screen w-full items-center justify-center p-8" role="main" aria-label="Break between questions">
      <div className="glass-card mx-auto w-full max-w-[640px] animate-slide-up text-center">
        <h1 className="mb-3 text-3xl font-bold">Get ready for the next question</h1>
        <p className="mb-8 mt-4 text-base text-text-secondary">
          Next: Question {nextIndex + 1} / {totalQuestions}
        </p>

        <div className="mb-3 h-3 w-full overflow-hidden rounded-md bg-card">
          <div
            className="break-bar-fill h-full rounded-md bg-gradient-to-r from-accent to-success"
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="mb-6 font-mono text-3xl font-bold text-text-primary animate-pulse" aria-live="polite" aria-label={`${remaining} seconds remaining`}>
          {remaining}
        </p>

        <button
          onClick={handleSkip}
          className="rounded-lg border border-secondary bg-transparent px-6 py-2.5 text-sm text-text-secondary transition-colors hover:border-text-secondary hover:text-text-primary"
        >
          Skip — I'm Ready <span className="ml-1 text-xs opacity-60">(Enter)</span>
        </button>
      </div>
    </section>
  )
}
