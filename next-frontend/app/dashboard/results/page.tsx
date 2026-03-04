'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, Download } from 'lucide-react'
import { useJobs } from '@/hooks/use-jobs'
import { useAuth } from '@/hooks/use-auth'
import { useInterviews } from '@/hooks/use-interviews'
import { useCandidates } from '@/hooks/use-candidates'
import { avatarColor } from '@/lib/colors'
import { formatDate } from '@/lib/date'
import type { Interview } from '@/types/interview'
import type { Candidate } from '@/types/candidate'

const ALL = 'all'

function ScoreRing({ score }: { score: number }) {
  const r = 14
  const circumference = 2 * Math.PI * r
  const offset = circumference - (Math.min(score, 100) / 100) * circumference
  const color = score >= 70 ? '#4ade80' : score >= 50 ? '#facc15' : '#f87171'
  return (
    <div className="relative w-10 h-10 shrink-0">
      <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90">
        <circle cx="16" cy="16" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle
          cx="16" cy="16" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
        {score}%
      </span>
    </div>
  )
}

function StatCard({ value, label, color }: { value: string | number; label: string; color?: string }) {
  return (
    <div className="bg-[#0D1117] border border-white/5 rounded-2xl p-5 flex-1">
      <div className={`text-2xl font-bold ${color ?? 'text-white'}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}

function getResultStatus(score: number): { label: string; dot: string; text: string } {
  if (score >= 70) return { label: 'SHORTLISTED', dot: 'bg-[#4ade80]', text: 'text-[#4ade80]' }
  if (score >= 40) return { label: 'UNDER REVIEW', dot: 'bg-amber-400', text: 'text-amber-400' }
  return { label: 'REVIEW', dot: 'bg-gray-400', text: 'text-gray-400' }
}


export default function ResultsPage() {
  const { company } = useAuth()
  const { jobs } = useJobs(company?.id ?? null)
  const [selectedJob, setSelectedJob] = useState<string>(ALL)

  const { interviews, isLoading } = useInterviews(selectedJob === ALL ? undefined : selectedJob)
  const { candidates } = useCandidates(selectedJob === ALL ? undefined : selectedJob)

  const selectedJobTitle = useMemo(
    () => jobs.find((j) => j.id === selectedJob)?.title ?? null,
    [jobs, selectedJob]
  )

  // Build candidate lookup
  const candidateMap = useMemo(() => {
    const map: Record<string, Candidate> = {}
    for (const c of candidates) map[c.id] = c
    return map
  }, [candidates])

  const completed = useMemo(() => interviews.filter((i) => i.status === 'completed'), [interviews])
  const inProgress = useMemo(() => interviews.filter((i) => i.status === 'scheduled'), [interviews])
  const noShow = useMemo(() => interviews.filter((i) => i.status === 'no_show'), [interviews])
  const avgScore = useMemo(() => {
    if (completed.length === 0) return 0
    const sum = completed.reduce((acc, i) => acc + (i.final_score ?? 0), 0)
    return Math.round(sum / completed.length)
  }, [completed])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">Results and Scores</h2>
          <p className="text-gray-500 text-sm mt-1">
            {selectedJobTitle ? `${selectedJobTitle} — ` : ''}interview outcomes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="appearance-none bg-[#0D1117] border border-white/10 rounded-xl px-4 pr-8 py-2.5 text-sm text-gray-300 outline-none focus:border-white/20 cursor-pointer"
            >
              <option value={ALL}>All Jobs</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border border-white/10 text-gray-300 hover:border-white/20 hover:text-white transition-colors">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <StatCard value={completed.length} label="Completed" />
        <StatCard value={inProgress.length} label="In Progress" />
        <StatCard value={`${avgScore}%`} label="Avg. AI Score" color="text-[#4ade80]" />
        <StatCard value={`${interviews[0]?.duration_minutes ?? 0}m`} label="Avg. Duration" />
        <StatCard value={noShow.length} label="No Show" color="text-red-400" />
      </div>

      {/* Table */}
      <div className="bg-[#0D1117] border border-white/5 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_2fr_1fr] px-5 py-3 border-b border-white/5">
          {['CANDIDATE', 'COMPLETED', 'DURATION', 'AI SCORE', 'Q1 ANSWER PREVIEW', 'STATUS'].map((h) => (
            <span key={h} className="text-[10px] font-semibold text-gray-500 tracking-widest">{h}</span>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_2fr_1fr] px-5 py-4 border-b border-white/5 gap-4">
                {Array.from({ length: 6 }).map((__, j) => (
                  <div key={j} className="h-4 bg-white/5 rounded animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        ) : completed.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
            No completed interviews yet.
          </div>
        ) : (
          <div className="flex flex-col">
            {completed.map((interview) => {
              const candidate = candidateMap[interview.candidate_id]
              const fullName = candidate ? `${candidate.first_name} ${candidate.last_name}` : 'Unknown'
              const initials = candidate
                ? `${candidate.first_name[0]}${candidate.last_name[0]}`.toUpperCase()
                : '??'
              const color = avatarColor(interview.candidate_id)
              const st = getResultStatus(interview.final_score ?? 0)

              return (
                <div
                  key={interview.id}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_2fr_1fr] items-center px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  {/* Candidate */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white leading-tight truncate">{fullName}</p>
                      {candidate && <p className="text-xs text-gray-500 truncate">{candidate.email}</p>}
                    </div>
                  </div>

                  {/* Completed date */}
                  <span className="text-sm text-gray-400">{formatDate(interview.scheduled_at)}</span>

                  {/* Duration */}
                  <span className="text-sm text-gray-400">{interview.duration_minutes}m</span>

                  {/* AI Score */}
                  <div className="flex items-center gap-2.5">
                    <ScoreRing score={interview.final_score ?? 0} />
                    <span className="text-sm font-medium text-white">{interview.final_score ?? 0}%</span>
                  </div>

                  {/* Q1 Answer Preview */}
                  <span className="text-xs text-gray-500 truncate pr-4">
                    — awaiting sync —
                  </span>

                  {/* Status */}
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${st.text} w-fit`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
