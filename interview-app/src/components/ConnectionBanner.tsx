import { useState, useEffect } from 'react'

// Shows a fixed banner when the browser goes offline, and a brief success message on reconnect
export function ConnectionBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showReconnected, setShowReconnected] = useState(false)
  // Track if we were ever offline so we only show "back online" after an actual disconnect
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (wasOffline) {
        setShowReconnected(true)
        // Hide the success banner after 3 seconds
        setTimeout(() => setShowReconnected(false), 3000)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
      setShowReconnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])

  // Nothing to show when online and no reconnection message
  if (isOnline && !showReconnected) return null

  return (
    <div
      className={`fixed left-0 right-0 top-0 z-[100] animate-slide-up px-4 py-2.5 text-center text-sm font-medium ${
        isOnline
          ? 'bg-success/90 text-white'
          : 'bg-warning/90 text-primary'
      }`}
    >
      {isOnline
        ? 'Back online — syncing your answers.'
        : 'You are offline. Answers will be saved and sent when reconnected.'}
    </div>
  )
}
