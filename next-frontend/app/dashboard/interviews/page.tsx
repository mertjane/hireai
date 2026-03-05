'use client'

import { useState, useMemo, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronDown, ChevronUp, Copy, Check, XCircle, ExternalLink, Search, Star, Download } from 'lucide-react'
import { useJobs } from '@/hooks/use-jobs'
import { useAuth } from '@/hooks/use-auth'
import { useInterviews } from '@/hooks/use-interviews'
import { useCandidates } from '@/hooks/use-candidates'
import { apiInstance } from '@/services/config/axios.config'
import { avatarColor } from '@/lib/colors'
import { formatDate } from '@/lib/date'
import InterviewDetailPanel from '@/components/layout/dashboard/InterviewDetailPanel'
import type { Interview, InterviewStatus } from '@/types/interview'
import type { Candidate } from '@/types/candidate'
import type { Job } from '@/types/job'

const ALL = 'all'

// status tabs at the top of the table
const TABS: { key: typeof ALL | InterviewStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'no_show', label: 'No Show' },
]

// visual config for each status
const STATUS_STYLES: Record<InterviewStatus, { dot: string; text: string; label: string }> = {
  scheduled:  { dot: 'bg-blue-400',   text: 'text-blue-400',   label: 'SCHEDULED' },
  completed:  { dot: 'bg-[#4ade80]',  text: 'text-[#4ade80]',  label: 'COMPLETED' },
  cancelled:  { dot: 'bg-gray-400',   text: 'text-gray-400',   label: 'CANCELLED' },
  no_show:    { dot: 'bg-red-400',    text: 'text-red-400',    label: 'NO SHOW' },
}

// score ring used for completed interviews
function ScoreRing({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const r = size === 'sm' ? 10 : 14
  const dim = size === 'sm' ? 24 : 36
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(score, 100) / 100) * circ
  const color = score >= 70 ? '#4ade80' : score >= 50 ? '#facc15' : '#f87171'
  return (
    <div className="relative shrink-0" style={{ width: dim, height: dim }}>
      <svg viewBox={`0 0 ${dim} ${dim}`} className="w-full h-full -rotate-90">
        <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={size === 'sm' ? 2 : 3} />
        <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke={color} strokeWidth={size === 'sm' ? 2 : 3}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center font-bold text-white ${size === 'sm' ? 'text-[8px]' : 'text-[10px]'}`}>
        {score}
      </span>
    </div>
  )
}

function StatCard({ value, label, color }: { value: string | number; label: string; color?: string }) {
  return (
    <div className="bg-[#0D1117] border border-white/5 rounded-2xl px-4 py-3 flex-1 min-w-0">
      <div className={`text-xl font-bold ${color ?? 'text-white'}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}

// up/down arrows — active direction highlighted in green
function SortIcon({ dir, size = 'sm' }: { dir: 'asc' | 'desc' | 'none'; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'
  return (
    <span className="inline-flex flex-col -space-y-1.5">
      <ChevronUp className={`${cls} ${dir === 'asc' ? 'text-[#4ade80]' : 'text-gray-600'}`} />
      <ChevronDown className={`${cls} ${dir === 'desc' ? 'text-[#4ade80]' : 'text-gray-600'}`} />
    </span>
  )
}

function InterviewsContent() {
  const { company } = useAuth()
  const { jobs } = useJobs(company?.id ?? null)
  const { interviews, isLoading, mutate } = useInterviews()
  const { candidates } = useCandidates()

  const [statusTab, setStatusTab] = useState<typeof ALL | InterviewStatus>(ALL)
  const [jobFilter, setJobFilter] = useState(ALL)
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)
  const [detailInterview, setDetailInterview] = useState<Interview | null>(null)
  const [sortNewest, setSortNewest] = useState(true)
  const [sortByScore, setSortByScore] = useState<'none' | 'desc' | 'asc'>('none')

  // derive date sort direction for the icon indicator
  const dateSortDir: 'asc' | 'desc' | 'none' = sortByScore !== 'none' ? 'none' : (sortNewest ? 'desc' : 'asc')

  // auto-select an interview when navigating with ?selected=id (e.g. after editing)
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('selected')
  useEffect(() => {
    if (!selectedId || isLoading || interviews.length === 0) return
    const match = interviews.find((iv) => iv.id === selectedId)
    if (match) setDetailInterview(match)
  }, [selectedId, isLoading, interviews])

  // lookup maps for candidate and job names
  const candidateMap = useMemo(() => {
    const m: Record<string, Candidate> = {}
    for (const c of candidates) m[c.id] = c
    return m
  }, [candidates])

  const jobMap = useMemo(() => {
    const m: Record<string, Job> = {}
    for (const j of jobs) m[j.id] = j
    return m
  }, [jobs])

  // filter and sort interviews by active tab, job, search, and date order
  const filtered = useMemo(() => {
    const list = interviews.filter((iv) => {
      if (statusTab !== ALL && iv.status !== statusTab) return false
      if (jobFilter !== ALL && iv.job_id !== jobFilter) return false
      if (search) {
        const c = candidateMap[iv.candidate_id]
        const name = c ? `${c.first_name} ${c.last_name}`.toLowerCase() : ''
        if (!name.includes(search.toLowerCase())) return false
      }
      return true
    })
    // sort by score if toggled, otherwise by scheduled date
    if (sortByScore !== 'none') {
      list.sort((a, b) => sortByScore === 'desc' ? b.final_score - a.final_score : a.final_score - b.final_score)
    } else {
      list.sort((a, b) => {
        const diff = new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        return sortNewest ? -diff : diff
      })
    }
    return list
  }, [interviews, statusTab, jobFilter, search, candidateMap, sortNewest, sortByScore])

  // stats computed from all interviews (not filtered)
  const stats = useMemo(() => {
    const total = interviews.length
    const scheduled = interviews.filter((i) => i.status === 'scheduled').length
    const completed = interviews.filter((i) => i.status === 'completed').length
    const noShow = interviews.filter((i) => i.status === 'no_show').length
    const completedWithScore = interviews.filter((i) => i.status === 'completed' && i.final_score > 0)
    const avgScore = completedWithScore.length > 0
      ? Math.round(completedWithScore.reduce((s, i) => s + i.final_score, 0) / completedWithScore.length)
      : 0
    return { total, scheduled, completed, noShow, avgScore }
  }, [interviews])

  // tab counts for badges
  const tabCounts = useMemo(() => ({
    all: interviews.length,
    scheduled: stats.scheduled,
    completed: stats.completed,
    cancelled: interviews.filter((i) => i.status === 'cancelled').length,
    no_show: stats.noShow,
  }), [interviews, stats])

  // build the interview link that candidates use
  const getInterviewUrl = useCallback((token: string) => {
    const base = process.env.NEXT_PUBLIC_INTERVIEW_APP_URL || 'https://interview.borasozer.com'
    return `${base}?token=${token}`
  }, [])

  // copy interview link to clipboard
  const handleCopy = useCallback(async (id: string, token: string) => {
    await navigator.clipboard.writeText(getInterviewUrl(token))
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [getInterviewUrl])

  // cancel a scheduled interview via the backend
  const handleCancel = useCallback(async (id: string) => {
    if (cancellingId) return
    setCancellingId(id)
    try {
      await apiInstance.delete(`/interviews/${id}`)
      mutate()
    } catch {
      // silently fail — user will see the status unchanged
    } finally {
      setCancellingId(null)
    }
  }, [cancellingId, mutate])

  // export filtered interviews as a CSV file
  const handleExportCSV = useCallback(() => {
    const header = 'Candidate,Email,Position,Scheduled,Duration (min),Score,Status'
    const rows = filtered.map((iv) => {
      const c = candidateMap[iv.candidate_id]
      const j = jobMap[iv.job_id]
      const name = c ? `${c.first_name} ${c.last_name}` : 'Unknown'
      const email = c?.email ?? ''
      const position = j?.title ?? ''
      const date = new Date(iv.scheduled_at).toLocaleDateString()
      const score = iv.final_score > 0 ? iv.final_score : iv.status === 'completed' ? 'Not scored' : ''
      return `"${name}","${email}","${position}","${date}",${iv.duration_minutes},"${score}","${iv.status}"`
    })
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'interviews.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [filtered, candidateMap, jobMap])

  // true when a detail panel is visible on the right
  const isSplit = detailInterview !== null

  // shared filter/tabs UI used in both full and split modes
  const filtersUI = (
    <>
      {/* search + job filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search candidates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0D1117] border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-white/15 transition-colors"
          />
        </div>
        <div className="relative shrink-0">
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="appearance-none bg-[#0D1117] border border-white/5 rounded-xl px-4 pr-8 py-2.5 text-sm text-gray-300 outline-none focus:border-white/15 cursor-pointer"
          >
            <option value={ALL}>All Jobs</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* status tabs */}
      <div className="flex gap-1 bg-[#0D1117] border border-white/5 rounded-xl p-1 w-fit">
        {TABS.map((tab) => {
          const active = statusTab === tab.key
          const count = tabCounts[tab.key]
          return (
            <button
              key={tab.key}
              onClick={() => setStatusTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                active ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  active ? 'bg-white/10 text-gray-300' : 'bg-white/5 text-gray-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </>
  )

  // compact row for split mode — just avatar, name, score/status
  const renderCompactRow = (iv: Interview) => {
    const candidate = candidateMap[iv.candidate_id]
    const fullName = candidate ? `${candidate.first_name} ${candidate.last_name}` : 'Unknown'
    const initials = candidate
      ? `${candidate.first_name[0]}${candidate.last_name[0]}`.toUpperCase()
      : '??'
    const color = avatarColor(iv.candidate_id)
    const st = STATUS_STYLES[iv.status]
    const isSelected = detailInterview?.id === iv.id
    const hasScore = iv.status === 'completed' && iv.final_score > 0

    // short date like "4 Mar"
    const shortDate = new Date(iv.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

    return (
      <div
        key={iv.id}
        onClick={() => setDetailInterview(iv)}
        className={`grid grid-cols-[1fr_52px_44px] items-center px-3 py-2.5 cursor-pointer transition-colors border-l-2 ${
          isSelected
            ? 'bg-white/[0.04] border-l-[#4ade80]'
            : 'hover:bg-white/[0.02] border-l-transparent'
        }`}
      >
        {/* name + status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white leading-tight truncate">{fullName}</p>
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${st.text} mt-0.5`}>
              <span className={`w-1 h-1 rounded-full ${st.dot}`} />
              {st.label}
            </span>
          </div>
        </div>
        {/* date */}
        <span className="text-[10px] text-gray-500">{shortDate}</span>
        {/* score */}
        <div className="flex justify-end">
          {hasScore ? (
            <ScoreRing score={iv.final_score} size="sm" />
          ) : iv.feedback_rating != null ? (
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          ) : null}
        </div>
      </div>
    )
  }

  // full table row for non-split mode — all columns
  const renderFullRow = (iv: Interview) => {
    const candidate = candidateMap[iv.candidate_id]
    const job = jobMap[iv.job_id]
    const fullName = candidate ? `${candidate.first_name} ${candidate.last_name}` : 'Unknown'
    const initials = candidate
      ? `${candidate.first_name[0]}${candidate.last_name[0]}`.toUpperCase()
      : '??'
    const color = avatarColor(iv.candidate_id)
    const st = STATUS_STYLES[iv.status]
    const hasScore = iv.status === 'completed' && iv.final_score > 0

    return (
      <div
        key={iv.id}
        onClick={() => setDetailInterview(iv)}
        className="group grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_0.7fr_72px] items-center px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        {/* candidate */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white leading-tight truncate">{fullName}</p>
            {candidate && <p className="text-xs text-gray-500 truncate">{candidate.email}</p>}
          </div>
        </div>

        {/* position */}
        <span className="text-sm text-gray-400 truncate">{job?.title ?? '—'}</span>

        {/* scheduled date */}
        <span className="text-sm text-gray-400">{formatDate(iv.scheduled_at)}</span>

        {/* duration */}
        <span className="text-sm text-gray-400">{iv.duration_minutes}m</span>

        {/* score — show ring for scored, label for unscored completed, dash otherwise */}
        <div className="flex items-center gap-2">
          {hasScore ? (
            <>
              <ScoreRing score={iv.final_score} />
              <span className="text-sm font-medium text-white">{iv.final_score}%</span>
            </>
          ) : iv.status === 'completed' ? (
            <span className="text-[10px] font-semibold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">Not scored</span>
          ) : (
            <span className="text-xs text-gray-600">—</span>
          )}
        </div>

        {/* status — fixed column */}
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${st.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {st.label}
          </span>
          {/* show a star if candidate left feedback */}
          {iv.feedback_rating != null && (
            <span title={`Feedback: ${iv.feedback_rating}/5`}>
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            </span>
          )}
        </div>

        {/* actions — separate fixed column, visible on hover */}
        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          {iv.status === 'scheduled' && !iv.token_revoke && (
            <button
              onClick={(e) => { e.stopPropagation(); handleCopy(iv.id, iv.token) }}
              className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
              title="Copy interview link"
            >
              {copiedId === iv.id ? <Check className="w-3.5 h-3.5 text-[#4ade80]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
          {iv.status === 'scheduled' && !iv.token_revoke && (
            <a
              href={getInterviewUrl(iv.token)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
              title="Open interview link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {iv.status === 'scheduled' && (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmCancelId(iv.id) }}
              disabled={cancellingId === iv.id}
              className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-40"
              title="Cancel interview"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* header — always full width */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Interviews</h2>
          <p className="text-gray-500 text-xs mt-0.5">Track and manage all interviews</p>
        </div>
        {filtered.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[#0D1117] border border-white/10 rounded-xl text-sm text-gray-300 hover:text-white hover:border-white/20 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* stat cards — always full width */}
      <div className="flex gap-3">
        <StatCard value={stats.total} label="Total" />
        <StatCard value={stats.scheduled} label="Scheduled" color="text-blue-400" />
        <StatCard value={stats.completed} label="Completed" color="text-[#4ade80]" />
        <StatCard value={`${stats.avgScore}%`} label="Avg. Score" color="text-[#4ade80]" />
        <StatCard value={stats.noShow} label="No Show" color="text-red-400" />
      </div>

      {isSplit ? (
        /* ── split layout: compact list on left, detail on right ── */
        <div className="flex gap-4 items-start" style={{ height: 'calc(100vh - 280px)' }}>

          {/* left column — filters + compact interview list */}
          <div className="w-[33%] shrink-0 flex flex-col gap-3 h-full min-h-0">
            {filtersUI}

            {/* compact interview list */}
            <div className="bg-[#0D1117] border border-white/5 rounded-2xl flex-1 overflow-hidden flex flex-col min-h-0">
              {/* column headers with sort buttons */}
              <div className="grid grid-cols-[1fr_52px_44px] items-center px-3 py-2 border-b border-white/5 shrink-0">
                <span className="text-[10px] font-semibold text-gray-500 tracking-widest">
                  {filtered.length} INTERVIEW{filtered.length !== 1 ? 'S' : ''}
                </span>
                <button
                  onClick={() => { setSortByScore('none'); setSortNewest((v) => !v) }}
                  className="flex items-center gap-0.5 text-[10px] font-semibold text-gray-500 tracking-widest hover:text-gray-300 transition-colors"
                >
                  DATE <SortIcon dir={dateSortDir} size="sm" />
                </button>
                <button
                  onClick={() => setSortByScore((v) => v === 'none' ? 'desc' : v === 'desc' ? 'asc' : 'none')}
                  className="flex items-center gap-0.5 text-[10px] font-semibold text-gray-500 tracking-widest hover:text-gray-300 transition-colors justify-end"
                >
                  SCORE <SortIcon dir={sortByScore} size="sm" />
                </button>
              </div>

              {/* scrollable compact rows */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="p-3 flex flex-col gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-gray-600 text-xs">
                    No interviews found.
                  </div>
                ) : (
                  <div className="flex flex-col py-1">
                    {filtered.map(renderCompactRow)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* right column — interview detail */}
          <div className="flex-1 h-full min-h-0">
            <InterviewDetailPanel
              key={detailInterview.id}
              interview={detailInterview}
              candidate={candidateMap[detailInterview.candidate_id]}
              job={jobMap[detailInterview.job_id]}
              onClose={() => setDetailInterview(null)}
            />
          </div>
        </div>
      ) : (
        /* ── full layout: filters + full table ── */
        <>
          {filtersUI}

          {/* full table */}
          <div className="bg-[#0D1117] border border-white/5 rounded-2xl overflow-hidden">
            {/* table header */}
            <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_0.7fr_72px] px-5 py-3 border-b border-white/5">
              {['CANDIDATE', 'POSITION', 'SCHEDULED', 'DURATION', 'SCORE', 'STATUS', ''].map((h) => (
                h === 'SCHEDULED' ? (
                  <button
                    key={h}
                    onClick={() => { setSortByScore('none'); setSortNewest((v) => !v) }}
                    className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 tracking-widest hover:text-gray-300 transition-colors"
                  >
                    {h}
                    <SortIcon dir={dateSortDir} size="md" />
                  </button>
                ) : h === 'SCORE' ? (
                  <button
                    key={h}
                    onClick={() => setSortByScore((v) => v === 'none' ? 'desc' : v === 'desc' ? 'asc' : 'none')}
                    className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 tracking-widest hover:text-gray-300 transition-colors"
                  >
                    {h}
                    <SortIcon dir={sortByScore} size="md" />
                  </button>
                ) : (
                  <span key={h || '_actions'} className="text-[10px] font-semibold text-gray-500 tracking-widest">{h}</span>
                )
              ))}
            </div>

            {isLoading ? (
              <div className="flex flex-col">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_0.7fr_72px] px-5 py-4 border-b border-white/5 gap-4">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <div key={j} className="h-4 bg-white/5 rounded animate-pulse" />
                    ))}
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
                No interviews found.
              </div>
            ) : (
              <div className="flex flex-col">
                {filtered.map(renderFullRow)}
              </div>
            )}
          </div>
        </>
      )}

      {/* cancel confirmation modal */}
      {confirmCancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0D1117] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-2">Cancel Interview?</h3>
            <p className="text-xs text-gray-400 mb-5">This will revoke the interview link. The candidate will no longer be able to access it.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmCancelId(null)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Keep
              </button>
              <button
                onClick={async () => {
                  const id = confirmCancelId
                  setConfirmCancelId(null)
                  // close the detail panel to avoid showing stale data
                  setDetailInterview(null)
                  await handleCancel(id)
                }}
                className="px-4 py-2 bg-red-500/10 text-red-400 text-sm font-semibold rounded-xl hover:bg-red-500/20 transition-colors"
              >
                Cancel Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// wrap in Suspense so useSearchParams works correctly
export default function InterviewsPage() {
  return (
    <Suspense>
      <InterviewsContent />
    </Suspense>
  )
}
