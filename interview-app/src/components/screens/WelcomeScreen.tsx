interface Props {
  questionCount: number
  estimatedMinutes?: number
  candidateName?: string
  companyName?: string
  jobTitle?: string
  onContinue: () => void
}

// pre-interview instructions so candidates know what to expect
export function WelcomeScreen({ questionCount, estimatedMinutes, candidateName, companyName, jobTitle, onContinue }: Props) {
  return (
    <section className="flex min-h-screen w-full items-center justify-center p-8" role="main" aria-label="Interview welcome">
      <div className="glass-card mx-auto w-full max-w-[640px] animate-slide-up">
        {/* personalized greeting if the backend returns candidate info */}
        <h1 className="mb-2 text-3xl font-bold">
          {candidateName ? `Welcome, ${candidateName}` : 'Welcome'}
        </h1>

        {(companyName || jobTitle) && (
          <p className="mb-6 text-text-secondary">
            {companyName && jobTitle
              ? `${companyName} — ${jobTitle} Interview`
              : companyName || jobTitle}
          </p>
        )}

        {/* what to expect */}
        <div className="mb-6 space-y-4">
          <h2 className="text-lg font-semibold">Before we start</h2>

          <div className="space-y-3 text-sm text-text-secondary">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">1</span>
              <p>You will answer <strong className="text-text-primary">{questionCount} question{questionCount !== 1 ? 's' : ''}</strong>{estimatedMinutes ? ` (~${estimatedMinutes} min)` : ''}. Each question has its own time limit.</p>
            </div>

            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">2</span>
              <p>Questions are read aloud and your answer is recorded via <strong className="text-text-primary">microphone</strong>. Allow mic access when prompted.</p>
            </div>

            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">3</span>
              <p>Find a <strong className="text-text-primary">quiet environment</strong>. Background noise can affect transcription accuracy.</p>
            </div>

            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">4</span>
              <p>Use <strong className="text-text-primary">Google Chrome</strong> for the best experience. Other browsers may not support speech recognition.</p>
            </div>
          </div>
        </div>

        <button
          onClick={onContinue}
          className="w-full rounded-lg bg-accent px-8 py-3 font-semibold text-white transition-colors hover:bg-accent-hover"
          autoFocus
        >
          Continue
        </button>
      </div>
    </section>
  )
}
