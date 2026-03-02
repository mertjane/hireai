import { Countdown } from '../Countdown'

interface Props {
  formatted: string
}

export function VerifiedScreen({ formatted }: Props) {
  return (
    <section className="flex min-h-screen w-full items-center justify-center p-8" role="main" aria-label="Verified and waiting">
      <div className="glass-card mx-auto w-full max-w-[640px] animate-slide-up text-center">
        <div className="mx-auto mb-5 inline-flex h-[72px] w-[72px] animate-scale-in items-center justify-center rounded-full border-2 border-success bg-success/15 text-2xl font-bold text-success" aria-hidden="true">
          &#10003;
        </div>
        <h1 className="mb-3 text-3xl font-bold">All Set!</h1>
        <p className="text-sm text-text-secondary">Your interview starts in:</p>
        <Countdown formatted={formatted} />
        <p className="mt-2 text-sm text-text-secondary">Stay on this page. It will begin automatically.</p>
        <p className="mt-4 text-xs text-text-secondary/60">Please do not close this tab.</p>
      </div>
    </section>
  )
}
