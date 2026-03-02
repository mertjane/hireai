export function TooLateScreen() {
  return (
    <section className="flex min-h-screen w-full items-center justify-center p-8" role="main" aria-label="Interview expired">
      <div className="glass-card mx-auto w-full max-w-[640px] animate-slide-up text-center">
        <div className="mx-auto mb-5 inline-flex h-[72px] w-[72px] animate-float items-center justify-center rounded-full border-2 border-error bg-error/15 text-2xl font-bold text-error" aria-hidden="true">
          !
        </div>
        <h1 className="mb-3 text-3xl font-bold">Interview Expired</h1>
        <p>This interview session has passed. Please contact the hiring team for a new link.</p>
      </div>
    </section>
  )
}
