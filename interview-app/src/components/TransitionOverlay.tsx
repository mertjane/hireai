interface Props {
  text: string
  visible: boolean
}

// full-screen overlay shown briefly between questions
export function TransitionOverlay({ text, visible }: Props) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-primary" aria-live="assertive">
      <p className="animate-scale-in text-3xl font-bold text-accent drop-shadow-[0_0_12px_rgb(var(--color-accent)/0.5)] sm:text-4xl">
        {text}
      </p>
    </div>
  )
}
