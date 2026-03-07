'use client'

import { useState, useMemo, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Copy, Check, XCircle, ExternalLink, Search, Star, Download, Trash2, X, CalendarPlus, ClipboardList } from 'lucide-react'
import CustomSelect from '@/components/ui/custom-select'
import ScoreRing from '@/components/ui/score-ring'
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
  cancelled:  { dot: 'bg-gray-400',   text: 'text-muted-foreground',   label: 'CANCELLED' },
  no_show:    { dot: 'bg-red-400',    text: 'text-red-400',    label: 'NO SHOW' },
}

// ScoreRing imported from shared component

function StatCard({ value, label, color, active, onClick }: { value: string | number; label: string; color?: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`bg-card border rounded-2xl px-4 py-3 flex-1 min-w-0 text-left transition-colors ${
        active ? 'border-[#4ade80]/40 bg-[#4ade80]/5' : 'border-border hover:border-border'
      }`}
    >
      <div className={`text-xl font-bold ${color ?? 'text-foreground'}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </button>
  )
}

// up/down arrows — active direction highlighted in green
function SortIcon({ dir, size = 'sm' }: { dir: 'asc' | 'desc' | 'none'; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'
  return (
    <span className="inline-flex flex-col -space-y-1.5">
      <ChevronUp className={`${cls} ${dir === 'asc' ? 'text-[#4ade80]' : 'text-muted-foreground'}`} />
      <ChevronDown className={`${cls} ${dir === 'desc' ? 'text-[#4ade80]' : 'text-muted-foreground'}`} />
    </span>
  )
}

// preset score ranges for the filter dropdown
const SCORE_FILTERS = [
  { value: 'all', label: 'All Scores', shortLabel: 'All Scores' },
  { value: '70+', label: '70+ (Strong)', shortLabel: '70+' },
  { value: '50-69', label: '50–69 (Average)', shortLabel: '50–69' },
  { value: '1-49', label: 'Under 50 (Weak)', shortLabel: '<50' },
  { value: 'unscored', label: 'Not Scored', shortLabel: 'Unscored' },
]

function InterviewsContent() {
  const router = useRouter()
  const { company } = useAuth()
  const { jobs } = useJobs(company?.id ?? null)
  const { interviews, isLoading, mutate } = useInterviews()
  const { candidates } = useCandidates()

  const [statusTab, setStatusTab] = useState<typeof ALL | InterviewStatus>(ALL)
  const [jobFilter, setJobFilter] = useState(ALL)
  const [scoreFilter, setScoreFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)
  const [detailInterview, setDetailInterview] = useState<Interview | null>(null)
  const [sortNewest, setSortNewest] = useState(true)
  const [sortByScore, setSortByScore] = useState<'none' | 'desc' | 'asc'>('none')
  // bulk selection state — entering selection mode when any checkbox is clicked
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const isSelecting = selectedIds.size > 0
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkCancelling, setBulkCancelling] = useState(false)
  const [confirmBulkAction, setConfirmBulkAction] = useState<'delete' | 'cancel' | null>(null)

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

  // filter and sort interviews by active tab, job, score range, search, and date order
  const filtered = useMemo(() => {
    const list = interviews.filter((iv) => {
      if (statusTab !== ALL && iv.status !== statusTab) return false
      if (jobFilter !== ALL && iv.job_id !== jobFilter) return false
      // score range filter
      if (scoreFilter !== 'all') {
        const s = iv.final_score
        if (scoreFilter === '70+' && s < 70) return false
        if (scoreFilter === '50-69' && (s < 50 || s > 69)) return false
        if (scoreFilter === '1-49' && (s < 1 || s > 49)) return false
        if (scoreFilter === 'unscored' && s > 0) return false
      }
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
  }, [interviews, statusTab, jobFilter, scoreFilter, search, candidateMap, sortNewest, sortByScore])

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
      await apiInstance.put(`/interviews/${id}/cancel`)
      mutate()
    } catch {
      // silently fail — user will see the status unchanged
    } finally {
      setCancellingId(null)
    }
  }, [cancellingId, mutate])

  // permanently delete an interview and its questions
  const handleDelete = useCallback(async (id: string) => {
    try {
      await apiInstance.delete(`/interviews/${id}`)
      // close detail panel since this interview no longer exists
      setDetailInterview(null)
      mutate()
    } catch {
      // silently fail
    }
  }, [mutate])

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

  // toggle a single interview's selection state
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // select/deselect all visible interviews
  const toggleSelectAll = useCallback(() => {
    const allIds = filtered.map((iv) => iv.id)
    const allSelected = allIds.every((id) => selectedIds.has(id))
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allIds))
    }
  }, [filtered, selectedIds])

  // clear selection and exit selection mode
  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  // bulk cancel — cancel all selected scheduled interviews
  const handleBulkCancel = useCallback(async () => {
    setBulkCancelling(true)
    const ids = [...selectedIds].filter((id) => {
      const iv = interviews.find((i) => i.id === id)
      return iv?.status === 'scheduled'
    })
    try {
      await Promise.all(ids.map((id) => apiInstance.put(`/interviews/${id}/cancel`)))
      mutate()
      clearSelection()
    } catch { /* silently fail */ }
    finally { setBulkCancelling(false) }
  }, [selectedIds, interviews, mutate, clearSelection])

  // bulk delete — delete all selected interviews
  const handleBulkDelete = useCallback(async () => {
    setBulkDeleting(true)
    try {
      await Promise.all([...selectedIds].map((id) => apiInstance.delete(`/interviews/${id}`)))
      setDetailInterview(null)
      mutate()
      clearSelection()
    } catch { /* silently fail */ }
    finally { setBulkDeleting(false) }
  }, [selectedIds, mutate, clearSelection])

  // export only selected interviews as CSV
  const handleExportSelected = useCallback(() => {
    const selected = filtered.filter((iv) => selectedIds.has(iv.id))
    const header = 'Candidate,Email,Position,Scheduled,Duration (min),Score,Status'
    const rows = selected.map((iv) => {
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
    a.download = 'interviews-selected.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [filtered, selectedIds, candidateMap, jobMap])

  // count how many selected interviews are cancellable
  const selectedCancellable = useMemo(() => {
    return [...selectedIds].filter((id) => {
      const iv = interviews.find((i) => i.id === id)
      return iv?.status === 'scheduled'
    }).length
  }, [selectedIds, interviews])

  // true when a detail panel is visible on the right
  const isSplit = detailInterview !== null



  // shared filter/tabs UI used in both full and split modes
  const filtersUI = (
    <>
      {/* search + job filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={isSplit ? 'Search...' : 'Search candidates...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-border transition-colors"
          />
        </div>
        <CustomSelect
          value={jobFilter}
          onChange={setJobFilter}
          options={[{ value: ALL, label: 'All Jobs' }, ...jobs.map((j) => ({ value: j.id, label: j.title }))]}
          className="flex-1 shrink-0"
        />
        <CustomSelect
          value={scoreFilter}
          onChange={setScoreFilter}
          options={SCORE_FILTERS}
          className={`${isSplit ? 'w-32' : 'w-44'} shrink-0`}
          dropdownFit
        />
      </div>

      {/* status tabs — wrap when space is tight in split mode */}
      <div className="flex justify-between bg-card border border-border rounded-xl p-1">
        {TABS.map((tab) => {
          const active = statusTab === tab.key
          const count = tabCounts[tab.key]
          return (
            <button
              key={tab.key}
              onClick={() => setStatusTab(tab.key)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${
                active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-[10px] px-1 py-0.5 rounded-full ${
                  active ? 'bg-muted text-foreground' : 'bg-muted text-muted-foreground'
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

  // compact row for split mode — checkbox + avatar, name, job, score/status
  const renderCompactRow = (iv: Interview) => {
    const candidate = candidateMap[iv.candidate_id]
    const job = jobMap[iv.job_id]
    const fullName = candidate ? `${candidate.first_name} ${candidate.last_name}` : 'Unknown'
    const initials = candidate
      ? `${candidate.first_name[0]}${candidate.last_name[0]}`.toUpperCase()
      : '??'
    const color = avatarColor(iv.candidate_id)
    const st = STATUS_STYLES[iv.status]
    const isActive = detailInterview?.id === iv.id
    const isChecked = selectedIds.has(iv.id)
    const hasScore = iv.status === 'completed' && iv.final_score > 0

    // short date like "4 Mar"
    const shortDate = new Date(iv.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

    return (
      <div
        key={iv.id}
        onClick={() => {
          // in selection mode, row clicks toggle selection
          if (isSelecting) { toggleSelect(iv.id); return }
          setDetailInterview(iv)
        }}
        className={`grid gap-x-2 items-center px-3 py-2.5 cursor-pointer transition-colors border-l-2 ${
          isChecked
            ? 'bg-[#4ade80]/5 border-l-[#4ade80]'
            : isActive
            ? 'bg-muted/40 border-l-[#4ade80]'
            : 'hover:bg-muted/40 border-l-transparent'
        }`}
        style={{ gridTemplateColumns: '20px 1fr 52px 44px' }}
      >
        {/* checkbox */}
        <div
          onClick={(e) => { e.stopPropagation(); toggleSelect(iv.id) }}
          className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
            isChecked
              ? 'bg-[#4ade80] border-[#4ade80]'
              : 'border-border hover:border-border'
          }`}
        >
          {isChecked && <Check className="w-2.5 h-2.5 text-black" />}
        </div>
        {/* name + status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center text-foreground text-[10px] font-bold shrink-0`}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground leading-tight truncate">{fullName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${st.text}`}>
                <span className={`w-1 h-1 rounded-full ${st.dot}`} />
                {st.label}
              </span>
              {job && <span className="text-[9px] text-muted-foreground truncate">{job.title}</span>}
            </div>
          </div>
        </div>
        {/* date */}
        <span className="text-[10px] text-muted-foreground">{shortDate}</span>
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

  // full table row for non-split mode — checkbox + all columns
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
    const isChecked = selectedIds.has(iv.id)

    return (
      <div
        key={iv.id}
        onClick={() => {
          // in selection mode, row clicks toggle selection
          if (isSelecting) { toggleSelect(iv.id); return }
          setDetailInterview(iv)
        }}
        className={`group grid items-center px-5 py-4 border-b border-border last:border-0 transition-colors cursor-pointer ${
          isChecked ? 'bg-[#4ade80]/5' : 'hover:bg-muted/40'
        }`}
        style={{ gridTemplateColumns: '28px 2fr 1.5fr 1fr 0.5fr 1fr 0.7fr 72px' }}
      >
        {/* checkbox */}
        <div
          onClick={(e) => { e.stopPropagation(); toggleSelect(iv.id) }}
          className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
            isChecked
              ? 'bg-[#4ade80] border-[#4ade80]'
              : 'border-border hover:border-border'
          }`}
        >
          {isChecked && <Check className="w-3 h-3 text-black" />}
        </div>

        {/* candidate */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-foreground text-xs font-bold shrink-0`}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground leading-tight truncate">{fullName}</p>
            {candidate && <p className="text-xs text-muted-foreground truncate">{candidate.email}</p>}
          </div>
        </div>

        {/* position */}
        <span className="text-sm text-muted-foreground truncate">{job?.title ?? '—'}</span>

        {/* scheduled date */}
        <span className="text-sm text-muted-foreground">{formatDate(iv.scheduled_at)}</span>

        {/* duration */}
        <span className="text-sm text-muted-foreground">{iv.duration_minutes}m</span>

        {/* score — ring only, no duplicate text */}
        <div className="flex items-center">
          {hasScore ? (
            <ScoreRing score={iv.final_score} />
          ) : iv.status === 'completed' ? (
            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Not scored</span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>

        {/* status — fixed column */}
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${st.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {st.label}
          </span>
          {iv.feedback_rating != null && (
            <span title={`Feedback: ${iv.feedback_rating}/5`}>
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            </span>
          )}
        </div>

        {/* actions — visible on hover, hidden in selection mode */}
        <div className={`flex items-center gap-1 justify-end transition-opacity ${isSelecting ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
          {iv.status === 'scheduled' && !iv.token_revoke && (
            <button
              onClick={(e) => { e.stopPropagation(); handleCopy(iv.id, iv.token) }}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
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
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Open interview link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {iv.status === 'scheduled' && (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmCancelId(iv.id) }}
              disabled={cancellingId === iv.id}
              className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-40"
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
          <p className="text-muted-foreground text-xs mt-0.5">Track and manage all interviews</p>
        </div>
        <div className="flex items-center gap-2">
          {/* bulk action bar — visible when items are selected */}
          {isSelecting && (
            <div className="flex items-center gap-2 bg-card border border-[#4ade80]/20 rounded-xl px-3 py-1.5 animate-in fade-in">
              <span className="text-xs font-semibold text-[#4ade80] mr-1">{selectedIds.size} selected</span>
              {selectedCancellable > 0 && (
                <button
                  onClick={() => setConfirmBulkAction('cancel')}
                  disabled={bulkCancelling}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-400 bg-amber-400/10 rounded-lg hover:bg-amber-400/20 transition-colors disabled:opacity-40"
                >
                  <XCircle className="w-3 h-3" />
                  Cancel ({selectedCancellable})
                </button>
              )}
              <button
                onClick={() => setConfirmBulkAction('delete')}
                disabled={bulkDeleting}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-400 bg-red-400/10 rounded-lg hover:bg-red-400/20 transition-colors disabled:opacity-40"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
              <button
                onClick={handleExportSelected}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-foreground bg-muted rounded-lg hover:bg-muted transition-colors"
              >
                <Download className="w-3 h-3" />
                Export
              </button>
              <button
                onClick={clearSelection}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                title="Clear selection"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {filtered.length > 0 && !isSelecting && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm text-foreground hover:text-foreground hover:border-border transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* stat cards — always full width */}
      <div className="flex gap-3">
        <StatCard value={stats.total} label="Total" onClick={() => setStatusTab('all')} active={statusTab === 'all'} />
        <StatCard value={stats.scheduled} label="Scheduled" color="text-blue-400" onClick={() => setStatusTab('scheduled')} active={statusTab === 'scheduled'} />
        <StatCard value={stats.completed} label="Completed" color="text-[#4ade80]" onClick={() => setStatusTab('completed')} active={statusTab === 'completed'} />
        <StatCard value={`${stats.avgScore}%`} label="Avg. Score" color="text-[#4ade80]" />
        <StatCard value={stats.noShow} label="No Show" color="text-red-400" onClick={() => setStatusTab('no_show')} active={statusTab === 'no_show'} />
      </div>

      {isSplit ? (
        /* ── split layout: compact list on left, detail on right ── */
        <div className="flex gap-4 items-start" style={{ height: 'calc(100vh - 280px)' }}>

          {/* left column — filters + compact interview list */}
          <div className="w-[33%] shrink-0 flex flex-col gap-3 h-full min-h-0">
            {filtersUI}

            {/* compact interview list */}
            <div className="bg-card border border-border rounded-2xl flex-1 overflow-hidden flex flex-col min-h-0">
              {/* column headers with checkbox + sort buttons */}
              <div className="grid gap-x-2 items-center px-3 py-2 border-b border-border shrink-0" style={{ gridTemplateColumns: '20px 1fr 52px 44px' }}>
                {/* select all checkbox */}
                <div
                  onClick={toggleSelectAll}
                  className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                    filtered.length > 0 && filtered.every((iv) => selectedIds.has(iv.id))
                      ? 'bg-[#4ade80] border-[#4ade80]'
                      : isSelecting
                      ? 'border-[#4ade80]/50 bg-[#4ade80]/10'
                      : 'border-border hover:border-border'
                  }`}
                >
                  {filtered.length > 0 && filtered.every((iv) => selectedIds.has(iv.id)) && (
                    <Check className="w-2.5 h-2.5 text-black" />
                  )}
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground tracking-widest">
                  {isSelecting ? `${selectedIds.size} SELECTED` : `${filtered.length} INTERVIEW${filtered.length !== 1 ? 'S' : ''}`}
                </span>
                <button
                  onClick={() => { setSortByScore('none'); setSortNewest((v) => !v) }}
                  className="flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground tracking-widest hover:text-foreground transition-colors"
                >
                  DATE <SortIcon dir={dateSortDir} size="sm" />
                </button>
                <button
                  onClick={() => setSortByScore((v) => v === 'none' ? 'desc' : v === 'desc' ? 'asc' : 'none')}
                  className="flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground tracking-widest hover:text-foreground transition-colors justify-end"
                >
                  SCORE <SortIcon dir={sortByScore} size="sm" />
                </button>
              </div>

              {/* scrollable compact rows */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="p-3 flex flex-col gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center flex-1 gap-2.5">
                    <Search className="w-5 h-5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">No matches</p>
                    <button
                      onClick={() => { setStatusTab(ALL); setJobFilter(ALL); setScoreFilter('all'); setSearch('') }}
                      className="text-[10px] cursor-pointer text-[#4ade80] hover:underline mt-0.5"
                    >
                      Clear filters
                    </button>
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
              onDelete={handleDelete}
            />
          </div>
        </div>
      ) : (
        /* ── full layout: filters + full table ── */
        <>
          {filtersUI}

          {/* full table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* table header */}
            <div className="grid px-5 py-3 border-b border-border" style={{ gridTemplateColumns: '28px 2fr 1.5fr 1fr 0.5fr 1fr 0.7fr 72px' }}>
              {/* select all checkbox */}
              <div
                onClick={toggleSelectAll}
                className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                  filtered.length > 0 && filtered.every((iv) => selectedIds.has(iv.id))
                    ? 'bg-[#4ade80] border-[#4ade80]'
                    : isSelecting
                    ? 'border-[#4ade80]/50 bg-[#4ade80]/10'
                    : 'border-border hover:border-border'
                }`}
              >
                {filtered.length > 0 && filtered.every((iv) => selectedIds.has(iv.id)) && (
                  <Check className="w-3 h-3 text-black" />
                )}
              </div>
              {['CANDIDATE', 'POSITION', 'SCHEDULED', 'DURATION', 'SCORE', 'STATUS', ''].map((h) => (
                h === 'SCHEDULED' ? (
                  <button
                    key={h}
                    onClick={() => { setSortByScore('none'); setSortNewest((v) => !v) }}
                    className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground tracking-widest hover:text-foreground transition-colors"
                  >
                    {h}
                    <SortIcon dir={dateSortDir} size="md" />
                  </button>
                ) : h === 'SCORE' ? (
                  <button
                    key={h}
                    onClick={() => setSortByScore((v) => v === 'none' ? 'desc' : v === 'desc' ? 'asc' : 'none')}
                    className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground tracking-widest hover:text-foreground transition-colors"
                  >
                    {h}
                    <SortIcon dir={sortByScore} size="md" />
                  </button>
                ) : (
                  <span key={h || '_actions'} className="text-[10px] font-semibold text-muted-foreground tracking-widest">{h}</span>
                )
              ))}
            </div>

            {isLoading ? (
              <div className="flex flex-col">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="grid px-5 py-4 border-b border-border gap-4" style={{ gridTemplateColumns: '28px 2fr 1.5fr 1fr 0.5fr 1fr 0.7fr 72px' }}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <div key={j} className="h-4 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              interviews.length === 0 ? (
                // true empty state — no interviews at all
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-muted/40 border border-border flex items-center justify-center">
                    <ClipboardList className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">No interviews yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Schedule your first interview to get started</p>
                  </div>
                  <button
                    onClick={() => router.push('/dashboard/interview-setup')}
                    className="flex items-center gap-2 px-4 py-2 bg-[#4ade80]/10 text-[#4ade80] text-sm font-semibold rounded-xl hover:bg-[#4ade80]/20 transition-colors"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    Schedule Interview
                  </button>
                </div>
              ) : (
                // filtered results empty — interviews exist but none match filters
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <Search className="w-6 h-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No interviews match your filters</p>
                  <button
                    onClick={() => { setStatusTab(ALL); setJobFilter(ALL); setScoreFilter('all'); setSearch('') }}
                    className="text-xs text-[#4ade80] hover:underline mt-1"
                  >
                    Clear all filters
                  </button>
                </div>
              )
            ) : (
              <div className="flex flex-col">
                {filtered.map(renderFullRow)}
              </div>
            )}
          </div>
        </>
      )}

      {/* bulk action confirmation modal */}
      {confirmBulkAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-sm font-bold text-foreground mb-2">
              {confirmBulkAction === 'delete' ? 'Delete Selected Interviews?' : 'Cancel Selected Interviews?'}
            </h3>
            <p className="text-xs text-muted-foreground mb-5">
              {confirmBulkAction === 'delete'
                ? `This will permanently delete ${selectedIds.size} interview${selectedIds.size > 1 ? 's' : ''} and all associated data.`
                : `This will cancel ${selectedCancellable} scheduled interview${selectedCancellable > 1 ? 's' : ''} and revoke their links.`
              }
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmBulkAction(null)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Keep
              </button>
              <button
                onClick={async () => {
                  const action = confirmBulkAction
                  setConfirmBulkAction(null)
                  if (action === 'delete') await handleBulkDelete()
                  else await handleBulkCancel()
                }}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
                  confirmBulkAction === 'delete'
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    : 'bg-amber-400/10 text-amber-400 hover:bg-amber-400/20'
                }`}
              >
                {confirmBulkAction === 'delete' ? 'Delete All' : 'Cancel All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* cancel confirmation modal */}
      {confirmCancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-sm font-bold text-foreground mb-2">Cancel Interview?</h3>
            <p className="text-xs text-muted-foreground mb-5">This will revoke the interview link. The candidate will no longer be able to access it.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmCancelId(null)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
