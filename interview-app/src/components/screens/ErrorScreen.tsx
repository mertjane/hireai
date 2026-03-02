interface Props {
  message: string
}

export function ErrorScreen({ message }: Props) {
  return (
    <section className="flex min-h-screen w-full items-center justify-center p-8" role="main" aria-label="Error">
      <div className="glass-card mx-auto w-full max-w-[640px] animate-slide-up text-center">
        <div className="mx-auto mb-5 inline-flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-error bg-error/15 text-2xl font-bold text-error" aria-hidden="true">
          !
        </div>
        <h1 className="mb-3 text-3xl font-bold">Something went wrong</h1>
        <p className="mb-6" role="alert">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg border border-accent bg-card px-7 py-2.5 font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
        >
          Try Again
        </button>
      </div>
    </section>
  )
}
