import { useRef, useCallback } from 'react'

interface Props {
  onComplete: (pin: string) => void
  error: string | null
  disabled?: boolean
}

// 6-digit PIN entry with auto-focus, backspace navigation, and paste support
export function PinInput({ onComplete, error, disabled }: Props) {
  const boxesRef = useRef<(HTMLInputElement | null)[]>([])

  const getPin = useCallback(() => {
    return boxesRef.current.map((b) => b?.value ?? '').join('')
  }, [])

  const handleInput = useCallback(
    (index: number, e: React.FormEvent<HTMLInputElement>) => {
      if (disabled) return
      const input = e.currentTarget
      const val = input.value.replace(/\D/g, '')
      input.value = val.slice(0, 1)

      // Move to next box on input
      if (val && index < 5) {
        boxesRef.current[index + 1]?.focus()
      }

      // Auto-submit when last digit entered
      if (index === 5 && val) {
        const pin = getPin()
        if (pin.length === 6) onComplete(pin)
      }
    },
    [onComplete, getPin, disabled],
  )

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Navigate back on backspace when current box is empty
    if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
      const prev = boxesRef.current[index - 1]
      if (prev) {
        prev.value = ''
        prev.focus()
      }
    }
  }, [])

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      if (disabled) return
      e.preventDefault()
      const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6)

      pasted.split('').forEach((char, idx) => {
        const box = boxesRef.current[idx]
        if (box) box.value = char
      })

      if (pasted.length === 6) {
        boxesRef.current[5]?.focus()
        onComplete(pasted)
      } else if (pasted.length > 0) {
        boxesRef.current[Math.min(pasted.length, 5)]?.focus()
      }
    },
    [onComplete, disabled],
  )

  return (
    <div className="mt-10">
      <p className="mb-4 text-sm text-text-secondary">Enter your 6-digit PIN to verify</p>
      <div className="flex justify-center gap-2.5">
        {Array.from({ length: 6 }, (_, i) => (
          <input
            key={i}
            ref={(el) => { boxesRef.current[i] = el }}
            type="text"
            maxLength={1}
            inputMode="numeric"
            autoComplete="off"
            disabled={disabled}
            className={`h-[60px] w-[50px] rounded-lg border-2 bg-card text-center text-2xl font-bold text-text-primary caret-accent outline-none transition-all duration-200 focus:border-accent focus:shadow-[0_0_12px_rgba(79,110,247,0.35)] ${
              error ? 'animate-shake border-error' : 'border-secondary'
            } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
            onInput={(e) => handleInput(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            autoFocus={i === 0}
          />
        ))}
      </div>
      <p className="mt-3 min-h-[1.2em] text-sm text-error">{error ?? ''}</p>
    </div>
  )
}
