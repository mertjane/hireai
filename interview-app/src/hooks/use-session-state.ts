import { useState, useCallback } from 'react'

// Persists state to sessionStorage so it survives page refreshes within the same tab
export function useSessionState<T>(key: string, initial: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(key)
      return stored !== null ? (JSON.parse(stored) as T) : initial
    } catch {
      return initial
    }
  })

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value
        try {
          sessionStorage.setItem(key, JSON.stringify(next))
        } catch {
          // sessionStorage might be full or unavailable — state still works in-memory
        }
        return next
      })
    },
    [key],
  )

  return [state, setValue]
}
