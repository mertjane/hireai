export function LoadingScreen() {
  return (
    <section className="flex min-h-screen w-full items-center justify-center p-8" role="main" aria-label="Loading interview">
      <div className="glass-card mx-auto w-full max-w-[640px] animate-slide-up text-center">
        <div className="relative mx-auto mb-6 h-12 w-12" role="status" aria-label="Loading">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-card border-t-accent" />
          <div className="absolute inset-1 animate-spin rounded-full border-2 border-transparent border-b-accent/40" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
        </div>
        <p className="animate-pulse text-text-secondary">Loading your interview...</p>
      </div>
    </section>
  )
}
