import { useState } from 'react'
import { submitHelpRequest } from '../lib/api'

interface Props {
  token?: string
}

// floating help button that emails the hiring team when a candidate needs assistance
export function HelpButton({ token }: Props) {
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [requestCount, setRequestCount] = useState(0)

  const handleSubmit = async () => {
    if (!message.trim() || !token || sending) return
    setSending(true)
    setError('')

    try {
      await submitHelpRequest(token, message.trim())
      setSent(true)
      setMessage('')
      setRequestCount((c) => c + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send. Try again.')
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    // reset sent state so they can send another message next time
    setTimeout(() => { setSent(false); setError('') }, 300)
  }

  // hide the button entirely after 3 requests to match backend limit
  if (requestCount >= 3) return null

  return (
    <>
      {/* trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-transform hover:scale-105"
        aria-label="Get help"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>

      {/* popup overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-6" role="dialog" aria-modal="true" aria-label="Help form">
          {/* backdrop */}
          <div className="fixed inset-0 bg-black/40" onClick={handleClose} />

          {/* form card */}
          <div className="relative w-full max-w-xs animate-slide-up rounded-xl border border-secondary bg-primary p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Need help?</h3>
              <button onClick={handleClose} className="text-text-secondary hover:text-text-primary" aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {sent ? (
              <p className="text-sm text-success">Your message has been sent. The hiring team will follow up.</p>
            ) : (
              <>
                <p className="mb-3 text-xs text-text-secondary">
                  Describe your issue and the hiring team will be notified via email.
                </p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. My microphone stopped working..."
                  rows={3}
                  maxLength={500}
                  className="mb-3 w-full resize-none rounded-lg border border-secondary bg-card p-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:outline-none"
                />
                {error && (
                  <p className="mb-2 text-xs text-error">{error}</p>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={!message.trim() || sending}
                  className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
