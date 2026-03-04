'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useInterviews } from '@/hooks/use-interviews'
import { useCandidates } from '@/hooks/use-candidates'
import { useJobs } from '@/hooks/use-jobs'
import { useAuth } from '@/hooks/use-auth'
import type { ReactNode } from 'react'

interface Activity {
  dot: string
  text: ReactNode
  time: string
  sortDate: number
}

// format how long ago something happened
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function RecentActivity() {
  const { company } = useAuth()
  const { interviews } = useInterviews()
  const { candidates } = useCandidates()
  const { jobs } = useJobs(company?.id ?? null)

  const activities = useMemo(() => {
    const items: Activity[] = []

    // build lookup maps for names
    const candidateMap = new Map(candidates.map((c) => [c.id, c]))
    const jobMap = new Map(jobs.map((j) => [j.id, j]))

    // generate activity entries from interviews
    for (const iv of interviews) {
      const c = candidateMap.get(iv.candidate_id)
      const j = jobMap.get(iv.job_id)
      const name = c ? `${c.first_name} ${c.last_name}` : 'A candidate'
      const jobTitle = j?.title ?? 'a position'

      if (iv.status === 'completed') {
        items.push({
          dot: 'bg-[#4ade80]',
          text: (
            <>
              <span className="text-white font-medium">{name}</span>
              {' completed interview for '}
              <span className="font-semibold">{jobTitle}</span>
            </>
          ),
          time: timeAgo(iv.scheduled_at),
          sortDate: new Date(iv.scheduled_at).getTime(),
        })
      } else if (iv.status === 'scheduled') {
        items.push({
          dot: 'bg-blue-400',
          text: (
            <>
              <span className="text-white font-medium">{name}</span>
              {' has a scheduled interview for '}
              <span className="font-semibold">{jobTitle}</span>
            </>
          ),
          time: timeAgo(iv.created_at),
          sortDate: new Date(iv.created_at).getTime(),
        })
      } else if (iv.status === 'cancelled') {
        items.push({
          dot: 'bg-gray-400',
          text: (
            <>
              {'Interview for '}
              <span className="text-white font-medium">{name}</span>
              {' was cancelled'}
            </>
          ),
          time: timeAgo(iv.created_at),
          sortDate: new Date(iv.created_at).getTime(),
        })
      } else if (iv.status === 'no_show') {
        items.push({
          dot: 'bg-red-400',
          text: (
            <>
              <span className="text-white font-medium">{name}</span>
              {' did not show up for '}
              <span className="font-semibold">{jobTitle}</span>
            </>
          ),
          time: timeAgo(iv.scheduled_at),
          sortDate: new Date(iv.scheduled_at).getTime(),
        })
      }
    }

    // add recent candidate applications
    for (const c of candidates) {
      const j = jobMap.get(c.job_id)
      items.push({
        dot: 'bg-blue-400',
        text: (
          <>
            {'New application from '}
            <span className="text-white font-medium">{c.first_name} {c.last_name}</span>
            {j ? <> for <span className="font-semibold">{j.title}</span></> : null}
          </>
        ),
        time: timeAgo(c.applied_at),
        sortDate: new Date(c.applied_at).getTime(),
      })
    }

    // sort newest first, take latest 6
    items.sort((a, b) => b.sortDate - a.sortDate)
    return items.slice(0, 6)
  }, [interviews, candidates, jobs])

  return (
    <div className="bg-[#0D1117] border border-white/5 rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold">Recent Activity</h2>
        <Link
          href="/dashboard/interviews"
          className="text-xs text-gray-500 hover:text-white transition-colors"
        >
          View all
        </Link>
      </div>
      {activities.length === 0 ? (
        <p className="text-sm text-gray-600 py-4">No activity yet.</p>
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
