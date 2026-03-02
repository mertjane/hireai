import { Countdown } from '../Countdown'
import { PinInput } from '../PinInput'

interface Props {
  formatted: string
  onPinComplete: (pin: string) => void
  pinError: string | null
  pinDisabled?: boolean
}

export function WaitingScreen({ formatted, onPinComplete, pinError, pinDisabled }: Props) {
  return (
    <section className="flex min-h-screen w-full items-center justify-center p-8" role="main" aria-label="Waiting room">
      <div className="mx-auto w-full max-w-[640px] animate-slide-up text-center">
        <h1 className="mb-3 text-3xl font-bold">Waiting Room</h1>
        <p className="text-sm text-text-secondary">Your interview starts in:</p>
        <Countdown formatted={formatted} />
        <div className="glass-card mt-6">
          <PinInput onComplete={onPinComplete} error={pinError} disabled={pinDisabled} />
        </div>
      </div>
    </section>
  )
}
