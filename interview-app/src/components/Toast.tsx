import { useEffect, useState } from 'react'

interface Props {
  message: string
  type?: 'warning' | 'info' | 'success'
  duration?: number
  onDismiss?: () => void
}

// brief notification that appears at the bottom and auto-hides
export function Toast({ message, type = 'warning', duration = 4000, onDismiss }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onDismiss?.()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onDismiss])

  if (!visible) return null

  const colorMap = {
    warning: 'border-warning bg-warning/15 text-warning',
    info: 'border-accent bg-accent/15 text-accent',
    success: 'border-success bg-success/15 text-success',
  }

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-slide-up rounded-lg border px-5 py-3 text-sm font-medium shadow-lg ${colorMap[type]}`}
      role="alert"
    >
      {message}
    </div>
  )
}
