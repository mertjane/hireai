interface Props {
  scheduledAt: string
}

export function TooEarlyScreen({ scheduledAt }: Props) {
  const dateStr = new Date(scheduledAt).toLocaleString(undefined, {
    dateStyle: 'full',
    timeStyle: 'short',
  })

  return (
    <section className="flex min-h-screen w-full items-center justify-center p-8" role="main" aria-label="Interview not yet available">
      <div className="glass-card mx-auto w-full max-w-[640px] animate-slide-up text-center">
        <div className="mx-auto mb-5 inline-flex h-[72px] w-[72px] animate-float items-center justify-center rounded-full border-2 border-accent bg-accent/15 text-2xl font-bold text-accent" aria-hidden="true">
          &#9201;
        </div>
        <h1 className="mb-3 text-3xl font-bold">You're early!</h1>
        <p>Your interview is scheduled for:</p>
        <p className="my-4 text-xl font-semibold text-accent">{dateStr}</p>
        <p className="mt-2 text-sm text-text-secondary">Please come back closer to your scheduled time.</p>
      </div>
    </section>
  )
}
