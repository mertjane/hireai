import { useEffect, useState } from 'react'
import { submitFeedback } from '../../lib/api'

const CONFETTI_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#a855f7']

interface Props {
  token?: string
  showFeedback?: boolean
}

export function CompletedScreen({ token, showFeedback = false }: Props) {
  const [confetti, setConfetti] = useState<{ id: number; left: string; color: string; delay: string }[]>([])
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [sending, setSending] = useState(false)

  // burst confetti on mount
  useEffect(() => {
    const pieces = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: `${Math.random() * 1.5}s`,
    }))
    setConfetti(pieces)
    const cleanup = setTimeout(() => setConfetti([]), 4000)
    return () => clearTimeout(cleanup)
  }, [])

  const handleRatingSubmit = async () => {
    if (rating === 0) return
    setSending(true)

    // send to backend — localStorage no longer needed since backend stores it
    if (token) {
      try {
        await submitFeedback(token, rating, comment.trim())
      } catch { /* endpoint might not exist yet on some deployments */ }
    }

    // mark as submitted so refresh won't re-show the form
    try { sessionStorage.setItem('feedbackSubmitted', 'true') } catch { /* ignore */ }

    setSending(false)
    setFeedbackSubmitted(true)
  }

  const activeRating = hoverRating || rating

  return (
    <>
      {confetti.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{ left: p.left, backgroundColor: p.color, animationDelay: p.delay }}
        />
      ))}

      <section className="flex min-h-screen w-full items-center justify-center p-8" role="main" aria-label="Interview complete">
        <div className="glass-card mx-auto w-full max-w-[640px] animate-slide-up text-center">
          <div className="mx-auto mb-5 inline-flex h-[72px] w-[72px] animate-scale-in items-center justify-center rounded-full border-2 border-success bg-success/15 text-2xl font-bold text-success">
            &#10003;
          </div>
          <h1 className="mb-3 text-3xl font-bold">Interview Complete</h1>
          <p>Thank you for completing your interview. The hiring team will review your responses.</p>
          <p className="mt-2 text-sm text-text-secondary">You may close this tab.</p>

          {/* feedback form — only shown right after completing, not on reload */}
          {showFeedback && (
          <div className="mt-8 border-t border-secondary/50 pt-6">
            {feedbackSubmitted ? (
              <p className="text-sm text-success">Thanks for your feedback!</p>
            ) : (
              <>
                <p className="mb-3 text-sm text-text-secondary">How was your experience?</p>
                <div className="mb-4 flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-2xl transition-transform hover:scale-110"
                      aria-label={`Rate ${star} out of 5`}
                    >
                      <span className={activeRating >= star ? 'text-warning' : 'text-secondary'}>
                        &#9733;
                      </span>
                    </button>
                  ))}
                </div>

                {/* optional comment and submit — visible once a star is picked */}
                {rating > 0 && (
                  <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Any additional comments? (optional)"
                      rows={3}
                      maxLength={500}
                      className="w-full resize-none rounded-lg border border-secondary bg-card p-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:outline-none"
                    />
                    <button
                      onClick={handleRatingSubmit}
                      disabled={sending}
                      className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
                    >
                      {sending ? 'Sending...' : 'Submit Feedback'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          )}
        </div>
      </section>
    </>
  )
}
