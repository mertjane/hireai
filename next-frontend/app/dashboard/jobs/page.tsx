'use client'

import { useState, useMemo } from 'react'
import { Search, Plus, ChevronDown } from 'lucide-react'
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
          <p className="text-gray-500 text-sm mt-1">Manage your active and draft vacancies</p>
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search job titles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0D1117] border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-white/15 transition-colors"
          />
        </div>

        <div className="relative">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="appearance-none bg-[#0D1117] border border-white/5 rounded-xl px-4 pr-8 py-2.5 text-sm text-gray-300 outline-none focus:border-white/15 transition-colors cursor-pointer"
          >
            <option value={ALL}>All Departments</option>
            {departments.filter((d) => d !== ALL).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as JobStatus | 'all')}
            className="appearance-none bg-[#0D1117] border border-white/5 rounded-xl px-4 pr-8 py-2.5 text-sm text-gray-300 outline-none focus:border-white/15 transition-colors cursor-pointer"
          >
            <option value={ALL}>All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 bg-[#0D1117] border border-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
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
