'use client'

import { useMemo } from 'react'
import { useCandidates } from '@/hooks/use-candidates'
import { useInterviews } from '@/hooks/use-interviews'
import { formatDate } from '@/lib/date'

export default function RecentActivity() {
  const { candidates, isLoading: cLoading } = useCandidates()
  const { interviews, isLoading: iLoading } = useInterviews()
  const isLoading = cLoading || iLoading

  const activities = useMemo(() => {
    const items: { dot: string; text: React.ReactNode; time: string; ts: number }[] = []

    const recentCandidates = [...candidates]
      .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
      .slice(0, 3)

    for (const c of recentCandidates) {
      items.push({
        dot: 'bg-blue-400',
        text: (
          <>
            <span className="text-white font-medium">{c.first_name} {c.last_name}</span>
            {' applied for a position'}
          </>
        ),
        time: formatDate(c.applied_at),
        ts: new Date(c.applied_at).getTime(),
      })
    }

    const completedInterviews = interviews
      .filter((i) => i.status === 'completed')
      .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
      .slice(0, 2)

    for (const iv of completedInterviews) {
      items.push({
        dot: 'bg-[#4ade80]',
        text: <>Interview completed — AI score: <span className="text-white font-medium">{iv.final_score ?? 0}</span></>,
        time: formatDate(iv.scheduled_at),
        ts: new Date(iv.scheduled_at).getTime(),
      })
    }

    return items.sort((a, b) => b.ts - a.ts).slice(0, 5)
  }, [candidates, interviews])

  return (
    <div className="bg-[#0D1117] border border-white/5 rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold">Recent Activity</h2>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <p className="text-sm text-gray-600 py-4 text-center">No recent activity yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-white/5">
          {activities.map((item, i) => (
            <li key={i} className="flex items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
              <div className="flex items-start gap-3">
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${item.dot}`} />
                <p className="text-sm text-gray-400 leading-snug">{item.text}</p>
              </div>
              <span className="text-xs text-gray-600 shrink-0 mt-0.5">{item.time}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
