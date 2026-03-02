import { useState, useEffect, useRef } from 'react'

// Counts down to a target date — used for the waiting/verified screen countdown
export function useCountdown(targetDate: string | null) {
  const [secondsLeft, setSecondsLeft] = useState<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!targetDate) return

    const tick = () => {
      const diff = Math.floor((new Date(targetDate).getTime() - Date.now()) / 1000)
      setSecondsLeft(diff)
    }

    tick()
    intervalRef.current = setInterval(tick, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [targetDate])

  // Format as HH:MM:SS
  const formatted = (() => {
    if (secondsLeft <= 0) return '00:00:00'
    const h = String(Math.floor(secondsLeft / 3600)).padStart(2, '0')
    const m = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0')
    const s = String(secondsLeft % 60).padStart(2, '0')
    return `${h}:${m}:${s}`
  })()

  const isReady = secondsLeft <= 0
  // More than 10 minutes past start
  const isTooLate = secondsLeft < -600

  return { secondsLeft, formatted, isReady, isTooLate }
}
