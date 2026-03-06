'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, User } from 'lucide-react'
import Link from 'next/link'
import { useCandidates } from '@/hooks/use-candidates'
import { formatDate } from '@/lib/date'
import { avatarColor } from '@/lib/colors'

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { candidates } = useCandidates()

  // Click outside to close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const recent = [...candidates]
    .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
    .slice(0, 5)

  const unreadCount = recent.length

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
      >
        <Bell className="w-4 h-4 hover:rotate-12 transition-transform duration-200" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
        )}
      </button>

      {/* Dropdown */}
      <div
        className={`absolute top-full right-0 mt-2 w-80 bg-[#0D1117] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden transition-all duration-200 ease-out origin-top-right ${
          open
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold bg-[#4ade80]/15 text-[#4ade80] px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>

        {/* Items */}
        <div className="max-h-72 overflow-y-auto">
          {recent.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-8">No notifications yet.</p>
          ) : (
            recent.map((c) => {
              const color = avatarColor(c.id)
              const initials = `${c.first_name[0]}${c.last_name[0]}`.toUpperCase()
              return (
                <div
                  key={c.id}
                  className="flex items-start gap-3 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5`}>
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-white font-medium leading-tight">
                      {c.first_name} {c.last_name}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">New application received</p>
                    <p className="text-[10px] text-gray-600 mt-1">{formatDate(c.applied_at)}</p>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] shrink-0 mt-1.5" />
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-white/5">
          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="text-xs text-[#4ade80] hover:text-[#22c55e] transition-colors font-medium"
          >
            View all notifications →
          </Link>
        </div>
      </div>
    </div>
  )
}
