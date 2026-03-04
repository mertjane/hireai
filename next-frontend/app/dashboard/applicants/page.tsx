'use client'

import { useState, useMemo } from 'react'
import { Search, Download, UserPlus, ChevronDown } from 'lucide-react'
import { useCandidates } from '@/hooks/use-candidates'
import { useJobs } from '@/hooks/use-jobs'
import { useAuth } from '@/hooks/use-auth'
import ApplicantDetailModal from '@/components/layout/dashboard/ApplicantDetailModal'
import AddApplicantModal from '@/components/layout/dashboard/AddApplicantModal'
import { avatarColor, getJobChipColor } from '@/lib/colors'
import { formatDate } from '@/lib/date'
import type { Candidate, CandidateStatus } from '@/types/candidate'
import type { Job } from '@/types/job'

const ALL = 'all'

const STATUS_STYLES: Record<CandidateStatus, { dot: string; bg: string; text: string; label: string }> = {
  pending:     { dot: 'bg-gray-400',  bg: 'bg-gray-400/10',  text: 'text-gray-400',  label: 'PENDING INVITE' },
  in_progress: { dot: 'bg-amber-400', bg: 'bg-amber-400/10', text: 'text-amber-400', label: 'IN PROGRESS' },
  dismissed:   { dot: 'bg-red-400',   bg: 'bg-red-400/10',   text: 'text-red-400',   label: 'DISMISSED' },
}

export default function ApplicantsPage() {
  const { company } = useAuth()
  const { jobs, mutate: mutateJobs } = useJobs(company?.id ?? null)
  const [selectedJob, setSelectedJob] = useState<string>(ALL)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | 'all'>(ALL)
  const [detailCandidate, setDetailCandidate] = useState<Candidate | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const { candidates, isLoading, mutate } = useCandidates(selectedJob === ALL ? undefined : selectedJob)

  const selectedJobTitle = useMemo(
    () => jobs.find((j) => j.id === selectedJob)?.title ?? null,
    [jobs, selectedJob]
  )

  const filtered = useMemo(
    () =>
      candidates.filter((c) => {
        const name = `${c.first_name} ${c.last_name}`.toLowerCase()
        const matchSearch = name.includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
        const matchStatus = statusFilter === ALL || c.status === statusFilter
        return matchSearch && matchStatus
      }),
    [candidates, search, statusFilter]
  )

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
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border border-white/10 text-gray-300 hover:border-white/20 hover:text-white transition-colors">
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

        <div className="relative">
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="appearance-none bg-[#0D1117] border border-white/5 rounded-xl px-4 pr-8 py-2.5 text-sm text-gray-300 outline-none focus:border-white/15 transition-colors cursor-pointer"
          >
            <option value={ALL}>All Jobs</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CandidateStatus | 'all')}
            className="appearance-none bg-[#0D1117] border border-white/5 rounded-xl px-4 pr-8 py-2.5 text-sm text-gray-300 outline-none focus:border-white/15 transition-colors cursor-pointer"
          >
            <option value={ALL}>All Statuses</option>
            <option value="pending">Pending Invite</option>
            <option value="in_progress">In Progress</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0D1117] border border-white/5 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] px-5 py-3 border-b border-white/5">
          {['APPLICANT', 'JOB', 'APPLIED', 'AI SCORE', 'STATUS'].map((h) => (
            <span key={h} className="text-[10px] font-semibold text-gray-500 tracking-widest">{h}</span>
          ))}
        </div>

        {/* Rows */}
        {isLoading ? (
          <div className="flex flex-col">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] px-5 py-4 border-b border-white/5 gap-4">
                {Array.from({ length: 5 }).map((__, j) => (
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
                onClick={() => setDetailCandidate(c)}
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
          onClose={() => setDetailCandidate(null)}
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

function ApplicantRow({
  candidate: c,
  jobs,
  onClick,
}: {
  candidate: Candidate
  jobs: Job[]
  onClick: () => void
}) {
  const st = STATUS_STYLES[c.status]
  const initials = `${c.first_name[0]}${c.last_name[0]}`.toUpperCase()
  const color = avatarColor(c.id)
  const job = jobs.find((j) => j.id === c.job_id)
  const chipColor = getJobChipColor(c.job_id)

  return (
    <div
      onClick={onClick}
      className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] items-center px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer"
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

      {/* Status — rightmost */}
      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${st.text} ${st.bg} px-2.5 py-1 rounded-full w-fit`}>
        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
        {st.label}
      </span>
    </div>
  )
}
