import type { Question } from '../types'

interface Props {
  questions: Question[]
  currentIndex: number
  candidateName?: string
}

// fixed top bar with candidate name on left, step circles centered
export function StepperBar({ questions, currentIndex, candidateName }: Props) {
  return (
    <div className="fixed left-0 right-0 top-0 z-40 border-b border-secondary bg-primary/80 backdrop-blur-sm">
      <div className="relative flex items-center justify-center px-4 py-3">
        {/* name pinned to the true left edge of the full-width bar */}
        {candidateName && (
          <span className="absolute left-4 text-xs font-medium text-text-primary">
            {candidateName}
          </span>
        )}

        {/* step circles centered across the full viewport width */}
        <div className="flex items-center gap-1">
          {questions.map((q, i) => {
            const answered = !!q.q_answer
            const isCurrent = i === currentIndex

            return (
              <div key={q.id} className="flex items-center">
                {i > 0 && (
                  <div
                    className={`mx-0.5 h-px w-4 transition-colors sm:w-8 ${
                      i <= currentIndex ? 'bg-accent' : 'bg-secondary'
                    }`}
                  />
                )}
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all sm:h-8 sm:w-8 sm:text-sm ${
                    answered
                      ? 'bg-success text-white'
                      : isCurrent
                      ? 'border-2 border-accent bg-accent/15 text-accent'
                      : 'border border-secondary bg-card text-text-secondary'
                  }`}
                  aria-label={`Question ${i + 1}${answered ? ' (answered)' : isCurrent ? ' (current)' : ''}`}
                >
                  {answered ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
