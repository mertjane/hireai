interface Props {
  formatted: string
}

// Large monospace countdown display with individual digit boxes
export function Countdown({ formatted }: Props) {
  // Split "01:23:45" into characters so each digit gets its own styled box
  const chars = formatted.split('')

  return (
    <div className="my-5 flex items-center justify-center gap-1">
      {chars.map((char, i) => (
        <span
          key={i}
          className={
            char === ':'
              ? 'mx-1 text-3xl font-bold text-text-secondary sm:text-4xl'
              : 'inline-flex h-12 w-10 items-center justify-center rounded-lg bg-card font-mono text-3xl font-bold tracking-widest text-text-primary shadow-sm animate-glow sm:h-14 sm:w-12 sm:text-4xl'
          }
        >
          {char}
        </span>
      ))}
    </div>
  )
}
