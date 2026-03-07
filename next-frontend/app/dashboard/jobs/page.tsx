'use client'

import { useState, useMemo } from 'react'
import { Search, Plus } from 'lucide-react'
import CustomSelect from '@/components/ui/custom-select'
import { useJobs } from '@/hooks/use-jobs'
import { useAuth } from '@/hooks/use-auth'
import { useCandidates } from '@/hooks/use-candidates'
import JobCard from '@/components/layout/dashboard/JobCard'
import JobModal from '@/components/layout/dashboard/JobModal'
import JobViewModal from '@/components/layout/dashboard/JobViewModal'
import { updateJob } from '@/services/api/jobs.api'
import type { Job, JobStatus } from '@/types/job'

const ALL = 'all'

export default function JobListingsPage() {
  const { company } = useAuth()
  const { jobs, isLoading, mutate } = useJobs(company?.id ?? null)
  const { candidates } = useCandidates()

  const applicantCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const c of candidates) {
      map[c.job_id] = (map[c.job_id] ?? 0) + 1
    }
    return map
  }, [candidates])
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState(ALL)
  const [status, setStatus] = useState<JobStatus | 'all'>(ALL)

  const [createOpen, setCreateOpen] = useState(false)
  const [editJob, setEditJob] = useState<Job | null>(null)
  const [viewJob, setViewJob] = useState<Job | null>(null)

  const handlePublish = async (job: Job) => {
    await updateJob(job.id, { status: 'active' })
    mutate()
  }

  const departments = useMemo(
    () => [ALL, ...Array.from(new Set(jobs.map((j) => j.department).filter(Boolean)))],
    [jobs]
  )

  const filtered = useMemo(
    () =>
      jobs.filter((j) => {
        const matchSearch = j.title.toLowerCase().includes(search.toLowerCase())
        const matchDept = department === ALL || j.department === department
        const matchStatus = status === ALL || j.status === status
        return matchSearch && matchDept && matchStatus
      }),
    [jobs, search, department, status]
  )

  return (
    <>
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">Job Listings</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage your active and draft vacancies</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 bg-[#4ade80] text-[#0A0D12] text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#22c55e] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Job Post
        </button>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search job titles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary/40 transition-colors"
          />
        </div>

        <CustomSelect
          value={department}
          onChange={setDepartment}
          options={[{ value: ALL, label: 'All Departments' }, ...departments.filter((d) => d !== ALL).map((d) => ({ value: d, label: d }))]}
          className="w-48"
        />

        <CustomSelect
          value={status}
          onChange={(v) => setStatus(v as JobStatus | 'all')}
          options={[
            { value: ALL, label: 'All Statuses' },
            { value: 'active', label: 'Active' },
            { value: 'draft', label: 'Draft' },
            { value: 'closed', label: 'Closed' },
          ]}
          className="w-40"
        />
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          No jobs found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              applicantCount={applicantCounts[job.id] ?? 0}
              onView={() => setViewJob(job)}
              onEdit={() => setEditJob(job)}
              onPublish={() => handlePublish(job)}
            />
          ))}
        </div>
      )}
    </div>

      {createOpen && (
        <JobModal onClose={() => setCreateOpen(false)} onSuccess={() => mutate()} />
      )}
      {editJob && (
        <JobModal job={editJob} onClose={() => setEditJob(null)} onSuccess={() => mutate()} />
      )}
      {viewJob && (
        <JobViewModal
          job={viewJob}
          onClose={() => setViewJob(null)}
          onEdit={() => { setEditJob(viewJob); setViewJob(null) }}
        />
      )}
    </>
  )
}
