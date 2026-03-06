'use client'

import { useState, useMemo, useCallback, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Download, UserPlus, CalendarPlus, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react'
import CustomSelect from '@/components/ui/custom-select'
import ScoreRing from '@/components/ui/score-ring'
import { useCandidates } from '@/hooks/use-candidates'
import { useJobs } from '@/hooks/use-jobs'
import { useInterviews } from '@/hooks/use-interviews'
import { useAuth } from '@/hooks/use-auth'
import ApplicantDetailModal from '@/components/layout/dashboard/ApplicantDetailModal'
import AddApplicantModal from '@/components/layout/dashboard/AddApplicantModal'
import { avatarColor, getJobChipColor } from '@/lib/colors'
import { formatDate } from '@/lib/date'
import type { Candidate, CandidateStatus } from '@/types/candidate'
import type { Interview } from '@/types/interview'
import type { Job } from '@/types/job'

const ALL = 'all'

type SortDir = 'none' | 'asc' | 'desc'
type SortCol = 'name' | 'applied' | 'score' | 'ivScore'

// cycle through sort directions: none → desc → asc → none
const nextDir = (d: SortDir): SortDir => d === 'none' ? 'desc' : d === 'desc' ? 'asc' : 'none'

// up/down arrows — active direction highlighted in green
function SortIcon({ dir }: { dir: SortDir }) {
  return (
    <span className="inline-flex flex-col -space-y-1.5">
      <ChevronUp className={`w-2.5 h-2.5 ${dir === 'asc' ? 'text-[#4ade80]' : 'text-gray-600'}`} />
      <ChevronDown className={`w-2.5 h-2.5 ${dir === 'desc' ? 'text-[#4ade80]' : 'text-gray-600'}`} />
    </span>
  )
}

const STATUS_STYLES: Record<CandidateStatus, { dot: string; bg: string; text: string; label: string }> = {
  pending:     { dot: 'bg-gray-400',  bg: 'bg-gray-400/10',  text: 'text-gray-400',  label: 'PENDING INVITE' },
  in_progress: { dot: 'bg-amber-400', bg: 'bg-amber-400/10', text: 'text-amber-400', label: 'IN PROGRESS' },
  completed:   { dot: 'bg-[#4ade80]', bg: 'bg-[#4ade80]/10', text: 'text-[#4ade80]', label: 'COMPLETED' },
  dismissed:   { dot: 'bg-red-400',   bg: 'bg-red-400/10',   text: 'text-red-400',   label: 'DISMISSED' },
  hired:       { dot: 'bg-violet-400', bg: 'bg-violet-400/10', text: 'text-violet-400', label: 'HIRED' },
}

function ApplicantsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { company } = useAuth()
  const { jobs, mutate: mutateJobs } = useJobs(company?.id ?? null)
  const { interviews } = useInterviews()
  const [selectedJob, setSelectedJob] = useState<string>(ALL)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | 'all'>(ALL)
  const [minScore, setMinScore] = useState(0)
  const [detailCandidate, setDetailCandidate] = useState<Candidate | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [sortCol, setSortCol] = useState<SortCol | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('none')

  // toggle sort on a column — reset others
  const toggleSort = useCallback((col: SortCol) => {
    if (sortCol === col) {
      const nd = nextDir(sortDir)
      setSortDir(nd)
      if (nd === 'none') setSortCol(null)
    } else {
      setSortCol(col)
      setSortDir('desc')
    }
  }, [sortCol, sortDir])

  const { candidates, isLoading, mutate } = useCandidates(selectedJob === ALL ? undefined : selectedJob)

  // map each candidate to their most recent interview (by scheduled date)
  const candidateInterviewMap = useMemo(() => {
    const map: Record<string, Interview> = {}
    for (const iv of interviews) {
      const existing = map[iv.candidate_id]
      if (!existing || new Date(iv.scheduled_at) > new Date(existing.scheduled_at)) {
        map[iv.candidate_id] = iv
      }
    }
    return map
  }, [interviews])

  // auto-open detail modal when navigated with ?candidate=ID
  const candidateParam = searchParams.get('candidate')
  useEffect(() => {
    if (!candidateParam || candidates.length === 0) return
    const match = candidates.find((c) => c.id === candidateParam)
    if (match) setDetailCandidate(match)
  }, [candidateParam, candidates])

  const selectedJobTitle = useMemo(
    () => jobs.find((j) => j.id === selectedJob)?.title ?? null,
    [jobs, selectedJob]
  )

  const filtered = useMemo(() => {
    const list = candidates.filter((c) => {
      const name = `${c.first_name} ${c.last_name}`.toLowerCase()
      const matchSearch = name.includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === ALL || c.status === statusFilter
      const matchScore = minScore === 0 || (c.agg_score ?? 0) >= minScore
      return matchSearch && matchStatus && matchScore
    })

    // apply active sort
    if (sortCol && sortDir !== 'none') {
      const mul = sortDir === 'desc' ? -1 : 1
      list.sort((a, b) => {
        switch (sortCol) {
          case 'name': return mul * `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
          case 'applied': return mul * (new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime())
          case 'score': return mul * ((a.agg_score ?? 0) - (b.agg_score ?? 0))
          case 'ivScore': {
            const sa = candidateInterviewMap[a.id]?.final_score ?? 0
            const sb = candidateInterviewMap[b.id]?.final_score ?? 0
            return mul * (sa - sb)
          }
          default: return 0
        }
      })
    }
    return list
  }, [candidates, search, statusFilter, minScore, sortCol, sortDir, candidateInterviewMap])

  // export filtered candidates as a CSV file download
  const handleExportCSV = useCallback(() => {
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Status', 'AI Score', 'Applied At']
    const rows = filtered.map((c) => [
      c.first_name,
      c.last_name,
      c.email,
      c.phone,
      c.status,
      c.agg_score ?? '',
      c.applied_at,
    ])

    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'applicants.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [filtered])

  const detailJob = useMemo(
    () => jobs.find((j) => j.id === detailCandidate?.job_id),
    [jobs, detailCandidate]
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">Applicants</h2>
          <p className="text-gray-500 text-sm mt-1">
            {selectedJobTitle ? `${selectedJobTitle} — ` : ''}
            {filtered.length} total applicants
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border border-white/10 text-gray-300 hover:border-white/20 hover:text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-[#4ade80] text-[#0A0D12] font-semibold hover:bg-[#22c55e] transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Applicant
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search applicants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0D1117] border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-white/15 transition-colors"
          />
        </div>

        <CustomSelect
          value={selectedJob}
          onChange={setSelectedJob}
          options={[{ value: ALL, label: 'All Jobs' }, ...jobs.map((j) => ({ value: j.id, label: j.title }))]}
          className="w-44"
        />

        <CustomSelect
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as CandidateStatus | 'all')}
          options={[
            { value: ALL, label: 'All Statuses' },
            { value: 'pending', label: 'Pending Invite' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
            { value: 'dismissed', label: 'Dismissed' },
            { value: 'hired', label: 'Hired' },
          ]}
          className="w-40"
        />

        {/* minimum score threshold filter */}
        <CustomSelect
          value={String(minScore)}
          onChange={(v) => setMinScore(Number(v))}
          options={[
            { value: '0', label: 'Min Score: Any' },
            { value: '30', label: 'Min Score: 30+' },
            { value: '50', label: 'Min Score: 50+' },
            { value: '70', label: 'Min Score: 70+' },
            { value: '90', label: 'Min Score: 90+' },
          ]}
          className="w-40"
        />
      </div>

      {/* Table */}
      <div className="bg-[#0D1117] border border-white/5 rounded-2xl overflow-hidden">
        {/* Header with sortable columns */}
        <div className="grid px-5 py-3 border-b border-white/5" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1.2fr' }}>
          <button onClick={() => toggleSort('name')} className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 tracking-widest hover:text-gray-300 transition-colors">
            APPLICANT <SortIcon dir={sortCol === 'name' ? sortDir : 'none'} />
          </button>
          <span className="text-[10px] font-semibold text-gray-500 tracking-widest">JOB</span>
          <button onClick={() => toggleSort('applied')} className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 tracking-widest hover:text-gray-300 transition-colors">
            APPLIED <SortIcon dir={sortCol === 'applied' ? sortDir : 'none'} />
          </button>
          <button onClick={() => toggleSort('score')} className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 tracking-widest hover:text-gray-300 transition-colors">
            AI SCORE <SortIcon dir={sortCol === 'score' ? sortDir : 'none'} />
          </button>
          <span className="text-[10px] font-semibold text-gray-500 tracking-widest">STATUS</span>
          <button onClick={() => toggleSort('ivScore')} className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 tracking-widest hover:text-gray-300 transition-colors">
            INTERVIEW <SortIcon dir={sortCol === 'ivScore' ? sortDir : 'none'} />
          </button>
        </div>

        {/* Rows */}
        {isLoading ? (
          <div className="flex flex-col">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid px-5 py-4 border-b border-white/5 gap-4" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1.2fr' }}>
                {Array.from({ length: 6 }).map((__, j) => (
                  <div key={j} className="h-4 bg-white/5 rounded animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
            No applicants found.
          </div>
        ) : (
          <div className="flex flex-col">
            {filtered.map((c) => (
              <ApplicantRow
                key={c.id}
                candidate={c}
                jobs={jobs}
                interview={candidateInterviewMap[c.id]}
                onClick={() => setDetailCandidate(c)}
                onNavigate={(path) => router.push(path)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detailCandidate && (
        <ApplicantDetailModal
          candidate={detailCandidate}
          job={detailJob}
          interview={candidateInterviewMap[detailCandidate.id]}
          onClose={() => setDetailCandidate(null)}
          onViewInterview={(id) => router.push(`/dashboard/interviews?selected=${id}`)}
          onStatusChange={() => mutate()}
        />
      )}

      {/* Add applicant modal */}
      {addOpen && company && (
        <AddApplicantModal
          companyId={company.id}
          jobs={jobs}
          onClose={() => setAddOpen(false)}
          onSuccess={() => { mutate(); mutateJobs() }}
        />
      )}
    </div>
  )
}

// interview status styles used in the interview column
const IV_STYLES: Record<string, { dot: string; text: string; label: string }> = {
  scheduled:  { dot: 'bg-blue-400',   text: 'text-blue-400',   label: 'SCHEDULED' },
  completed:  { dot: 'bg-[#4ade80]',  text: 'text-[#4ade80]',  label: 'COMPLETED' },
  cancelled:  { dot: 'bg-gray-400',   text: 'text-gray-400',   label: 'CANCELLED' },
  no_show:    { dot: 'bg-red-400',    text: 'text-red-400',    label: 'NO SHOW' },
}

function ApplicantRow({
  candidate: c,
  jobs,
  interview,
  onClick,
  onNavigate,
}: {
  candidate: Candidate
  jobs: Job[]
  interview?: Interview
  onClick: () => void
  onNavigate: (path: string) => void
}) {
  const st = STATUS_STYLES[c.status]
  const initials = `${c.first_name[0]}${c.last_name[0]}`.toUpperCase()
  const color = avatarColor(c.id)
  const job = jobs.find((j) => j.id === c.job_id)
  const chipColor = getJobChipColor(c.job_id)

  // render the interview column cell based on interview status
  const renderInterviewCell = () => {
    if (!interview) {
      // no interview — "Set Interview" button
      return (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(`/dashboard/interview-setup?candidate=${c.id}`) }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-white/5 text-gray-400 hover:bg-[#4ade80]/10 hover:text-[#4ade80] transition-colors"
        >
          <CalendarPlus className="w-3 h-3" />
          Set Interview
        </button>
      )
    }

    const ivStyle = IV_STYLES[interview.status]
    const hasScore = interview.status === 'completed' && interview.final_score > 0

    // cancelled or no_show — pill badge + reschedule icon
    if (interview.status === 'cancelled' || interview.status === 'no_show') {
      return (
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${ivStyle.text} bg-white/5 px-3 py-1.5 rounded-full`}>
            <span className={`w-1.5 h-1.5 rounded-full ${ivStyle.dot}`} />
            {ivStyle.label}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate(`/dashboard/interview-setup?candidate=${c.id}`) }}
            className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-[#4ade80] transition-colors"
            title="Reschedule"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      )
    }

    // completed with score — score ring in a pill, clickable
    if (hasScore) {
      return (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(`/dashboard/interviews?selected=${interview.id}`) }}
          className="inline-flex items-center hover:opacity-80 transition-opacity"
          title="View interview details"
        >
          <ScoreRing score={interview.final_score} size="md" />
        </button>
      )
    }

    // scheduled or completed without score — pill badge, clickable
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onNavigate(`/dashboard/interviews?selected=${interview.id}`) }}
        className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${ivStyle.text} bg-white/5 px-3 py-1.5 rounded-full hover:bg-white/[0.08] transition-colors`}
        title="View interview details"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${ivStyle.dot}`} />
        {ivStyle.label}
      </button>
    )
  }

  return (
    <div
      onClick={onClick}
      className="grid items-center px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer"
      style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1.2fr' }}
    >
      {/* Applicant */}
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white leading-tight truncate">
            {c.first_name} {c.last_name}
          </p>
          <p className="text-xs text-gray-500 truncate">{c.email}</p>
        </div>
      </div>

      {/* Job chip */}
      <div>
        {job ? (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${chipColor.bg} ${chipColor.text} truncate w-max`}>
            {job.title}
          </span>
        ) : (
          <span className="text-xs text-gray-600">—</span>
        )}
      </div>

      {/* Applied */}
      <span className="text-sm text-gray-400">{formatDate(c.applied_at)}</span>

      {/* AI Score */}
      <div>
        {c.agg_score != null && c.agg_score > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden max-w-[60px]">
              <div className="h-full bg-[#4ade80] rounded-full" style={{ width: `${c.agg_score}%` }} />
            </div>
            <span className="text-sm text-white font-medium">{c.agg_score}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-600">--</span>
        )}
      </div>

      {/* Status — text only, no background pill */}
      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${st.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
        {st.label}
      </span>

      {/* Interview */}
      <div>{renderInterviewCell()}</div>
    </div>
  )
}

// wrap in Suspense so useSearchParams works correctly
export default function ApplicantsPage() {
  return (
    <Suspense>
      <ApplicantsContent />
    </Suspense>
  )
}
