// circular progress ring showing interview score with color coding
export default function ScoreRing({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const r = size === 'sm' ? 10 : 14
  const dim = size === 'sm' ? 24 : 36
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(score, 100) / 100) * circ
  const color = score >= 70 ? '#4ade80' : score >= 50 ? '#facc15' : '#f87171'
  return (
    <div className="relative shrink-0" style={{ width: dim, height: dim }}>
      <svg viewBox={`0 0 ${dim} ${dim}`} className="w-full h-full -rotate-90">
        <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="currentColor" strokeWidth={size === 'sm' ? 2 : 3} className="text-border opacity-60" />
        <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke={color} strokeWidth={size === 'sm' ? 2 : 3}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center font-bold text-foreground ${size === 'sm' ? 'text-[8px]' : 'text-[10px]'}`}>
        {score}
      </span>
    </div>
  )
}
