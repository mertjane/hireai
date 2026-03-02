import { useState, useRef, useEffect } from 'react'

// small floating webcam preview so candidates can see themselves during the interview
export function CameraPreview() {
  const [enabled, setEnabled] = useState(false)
  const [error, setError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!enabled) {
      // stop the stream when toggled off
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      return
    }

    let cancelled = false

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch {
        setError(true)
        setEnabled(false)
      }
    }

    startCamera()

    return () => {
      cancelled = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [enabled])

  return (
    <>
      {/* toggle button in the bottom-left */}
      <button
        onClick={() => { setEnabled(!enabled); setError(false) }}
        aria-label={enabled ? 'Hide camera' : 'Show camera'}
        className="fixed bottom-4 left-4 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-secondary bg-card text-text-secondary transition-all hover:text-text-primary hover:border-text-secondary"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {enabled ? (
            // camera-off icon
            <>
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h6l2 3h3a2 2 0 0 1 2 2v9.34" />
            </>
          ) : (
            // camera icon
            <>
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </>
          )}
        </svg>
      </button>

      {/* floating video preview */}
      {enabled && (
        <div className="fixed bottom-16 left-4 z-50 overflow-hidden rounded-xl border border-secondary shadow-lg">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-32 w-44 bg-card object-cover"
          />
        </div>
      )}

      {/* brief error message */}
      {error && (
        <div className="fixed bottom-16 left-4 z-50 rounded-lg border border-error bg-error/15 px-3 py-2 text-xs text-error">
          Camera unavailable
        </div>
      )}
    </>
  )
}
