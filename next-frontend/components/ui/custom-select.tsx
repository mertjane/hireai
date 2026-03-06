'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  // optional short text shown on the trigger button instead of full label
  shortLabel?: string
}

interface CustomSelectProps {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  className?: string
  size?: 'sm' | 'md'
  // allow dropdown panel to be wider than the trigger button
  dropdownFit?: boolean
}

// styled dropdown that replaces native <select> with a theme-matched panel
export default function CustomSelect({ value, options, onChange, className = '', size = 'md', dropdownFit = false }: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selected = options.find((o) => o.value === value)
  const isSmall = size === 'sm'
  // use shortLabel for the trigger if available
  const triggerText = selected?.shortLabel ?? selected?.label ?? ''

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 bg-[#0A0D12] border rounded-xl outline-none transition-colors cursor-pointer ${
          open ? 'border-white/20' : 'border-white/10 hover:border-white/15'
        } ${isSmall ? 'px-3 py-1.5 text-xs rounded-lg' : 'px-4 py-2.5 text-sm'}`}
      >
        <span className="text-gray-300 truncate">{triggerText}</span>
        <ChevronDown className={`shrink-0 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''} ${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
      </button>

      {/* dropdown panel */}
      {open && (
        <div className={`absolute z-50 left-0 mt-1 bg-[#0A0D12] border border-white/10 shadow-xl shadow-black/40 overflow-hidden overflow-y-auto max-h-60 ${
          dropdownFit ? 'min-w-full w-max' : 'right-0'
        } ${isSmall ? 'rounded-lg' : 'rounded-xl'}`}>
          {options.map((opt) => {
            const active = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full flex items-center justify-between gap-2 transition-colors whitespace-nowrap ${
                  active ? 'bg-white/[0.06] text-white' : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
                } ${isSmall ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'}`}
              >
                <span>{opt.label}</span>
                {active && <Check className={`shrink-0 text-[#4ade80] ${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
