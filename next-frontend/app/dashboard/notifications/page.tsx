'use client'

import { useMemo } from 'react'
import { useCandidates } from '@/hooks/use-candidates'
import { avatarColor } from '@/lib/colors'
import { formatDate } from '@/lib/date'

type Group = { label: string; items: ReturnType<typeof buildItems> }

function buildItems(candidates: ReturnType<typeof useCandidates>['candidates']) {
  return [...candidates]
    .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
    .map((c) => ({
      id: c.id,
      name: `${c.first_name} ${c.last_name}`,
      initials: `${c.first_name[0]}${c.last_name[0]}`.toUpperCase(),
      color: avatarColor(c.id),
      date: c.applied_at,
      email: c.email,
    }))
}

function groupByTime(items: ReturnType<typeof buildItems>): Group[] {
  const now = Date.now()
  const DAY = 86_400_000
  const WEEK = 7 * DAY

  const today: typeof items = []
  const thisWeek: typeof items = []
  const earlier: typeof items = []

  for (const item of items) {
    const age = now - new Date(item.date).getTime()
    if (age < DAY) today.push(item)
    else if (age < WEEK) thisWeek.push(item)
    else earlier.push(item)
  }

  const groups: Group[] = []
  if (today.length) groups.push({ label: 'Today', items: today })
  if (thisWeek.length) groups.push({ label: 'This Week', items: thisWeek })
  if (earlier.length) groups.push({ label: 'Earlier', items: earlier })
  return groups
}

export default function NotificationsPage() {
  const { candidates, isLoading } = useCandidates()

  const groups = useMemo(() => groupByTime(buildItems(candidates)), [candidates])

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h2 className="text-xl font-bold">Notifications</h2>
        <p className="text-muted-foreground text-sm mt-1">Recent activity across your hiring pipeline.</p>
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl flex items-center justify-center h-48 text-muted-foreground text-sm">
          No notifications yet.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold text-muted-foreground tracking-widest mb-2 px-1">
                {group.label.toUpperCase()}
              </p>
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {group.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 px-5 py-4 hover:bg-muted/40 transition-colors ${
                      idx !== group.items.length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center text-foreground text-[10px] font-bold shrink-0 mt-0.5`}>
                      {item.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-tight">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">New application received · {item.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
