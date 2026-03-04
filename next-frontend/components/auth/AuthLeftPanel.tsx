'use client'

import { useEffect, useState } from 'react'
import { Mic } from 'lucide-react'

const PHRASES = ['scale.', 'speed.', 'confidence.', 'precision.', 'ease.']

function TypewriterWord() {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const current = PHRASES[phraseIndex]

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setDisplayText(current.slice(0, displayText.length + 1))
        if (displayText.length + 1 === current.length) {
          setTimeout(() => setIsDeleting(true), 1600)
        }
      } else {
        setDisplayText(current.slice(0, displayText.length - 1))
        if (displayText.length - 1 === 0) {
          setIsDeleting(false)
          setPhraseIndex((i) => (i + 1) % PHRASES.length)
        }
      }
    }, isDeleting ? 40 : 80)

    return () => clearTimeout(timeout)
  }, [displayText, isDeleting, phraseIndex])

  return (
    <span className="text-[#4ade80] underline underline-offset-4 decoration-[#4ade80]/60">
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

const STATS = [
  { value: '4x', label: 'FASTER HIRING' },
  { value: '80%', label: 'TIME SAVED' },
  { value: '100%', label: 'BIAS-REDUCED' },
]

export default function AuthLeftPanel() {
  return (
    <div className="flex-1 flex flex-col justify-between p-12 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#4ade80] rounded-xl flex items-center justify-center">
            <Mic className="w-5 h-5 text-[#0A0D12]" />
          </div>
          <span className="text-xl font-semibold tracking-tight">
            Hire<span className="text-[#4ade80]">AI</span>
          </span>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 w-fit bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] shrink-0" />
          <span className="text-[#4ade80] text-xs tracking-widest font-medium">
            AI-POWERED HIRING PLATFORM
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-5xl font-bold leading-tight mt-20">
          Hire smarter.
          Interview at{" "}
          <TypewriterWord />
        </h1>

        {/* Subtext */}
        <p className="text-gray-400 text-[15px] leading-relaxed max-w-2xl">
          Automate your first-round interviews with voice-driven AI. Set your questions, define
          your timers, and let candidates respond on their own time — you review what matters.
        </p>

        {/* Stats */}
        <div className="flex gap-12">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="text-gray-500 text-xs tracking-widest mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonial */}
      <div className="relative z-10 bg-white/5 border border-white/10 rounded-2xl p-6 max-w-full">
        
        <p className="text-gray-300 text-sm leading-relaxed mb-5">
          "We reduced our screening time from three weeks to four days. The AI transcripts give us
          exactly what we need to make informed decisions."
        </p>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#4ade80] flex items-center justify-center text-[#0A0D12] text-xs font-bold shrink-0">
            SR
          </div>
          <div>
            <div className="text-sm font-medium">Sarah Reynolds</div>
            <div className="text-gray-500 text-xs">Head of Talent, FinCo Group</div>
          </div>
        </div>
      </div>
    </div>
  )
}
