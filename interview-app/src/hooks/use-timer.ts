import { useState, useEffect, useRef, useCallback } from 'react'

// Countdown timer for per-question time limits
export function useTimer(duration: number, onExpire: () => void) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Ref to avoid stale closure in the interval callback
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    if (!running) return

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          setRunning(false)
          onExpireRef.current()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running])

  const start = useCallback(() => {
    setTimeLeft(duration)
    setRunning(true)
  }, [duration])

  const stop = useCallback(() => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  const reset = useCallback((newDuration?: number) => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    setTimeLeft(newDuration ?? duration)
  }, [duration])

  // Format as MM:SS
  const formatted = `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`
  const isWarning = timeLeft <= 10

  return { timeLeft, formatted, isWarning, running, start, stop, reset }
}
