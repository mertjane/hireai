'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import CustomSelect from '@/components/ui/custom-select'
import type { Job, WorkType, JobStatus } from '@/types/job'
import { createJob, updateJob, type JobPayload } from '@/services/api/jobs.api'

interface Props {
  job?: Job | null
  onClose: () => void
  onSuccess: () => void
}

const INPUT = 'w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-border transition-colors'
// SELECT const removed — replaced by CustomSelect component
const LABEL = 'text-xs text-muted-foreground'

export default function JobModal({ job, onClose, onSuccess }: Props) {
  const isEdit = !!job
  const [form, setForm] = useState<JobPayload>({
    title: job?.title ?? '',
    department: job?.department ?? '',
    location: job?.location ?? '',
    work_type: job?.work_type ?? 'on-site',
    status: job?.status ?? 'draft',
    description: job?.description ?? '',
  })
  const [loading, setLoading] = useState(false)

  const set = (k: keyof JobPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) {
        await updateJob(job!.id, form)
      } else {
        await createJob(form)
      }
      onSuccess()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold">{isEdit ? 'Edit Job' : 'New Job Post'}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL}>Job Title</label>
            <input
              required
              value={form.title}
              onChange={set('title')}
              placeholder="e.g. Senior Frontend Engineer"
              className={INPUT}
            />
          </div>

          {/* Department + Location */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={LABEL}>Department</label>
              <input
                required
                value={form.department}
                onChange={set('department')}
                placeholder="e.g. Engineering"
                className={INPUT}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL}>Location</label>
              <input
                required
                value={form.location}
                onChange={set('location')}
                placeholder="e.g. Istanbul"
                className={INPUT}
              />
            </div>
          </div>

          {/* Work Type + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={LABEL}>Work Type</label>
              <CustomSelect
                value={form.work_type}
                onChange={(v) => setForm((f) => ({ ...f, work_type: v as WorkType }))}
                options={[
                  { value: 'on-site', label: 'On-site' },
                  { value: 'remote', label: 'Remote' },
                  { value: 'hybrid', label: 'Hybrid' },
                ]}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL}>Status</label>
              <CustomSelect
                value={form.status}
                onChange={(v) => setForm((f) => ({ ...f, status: v as JobStatus }))}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'active', label: 'Active' },
                  ...(isEdit ? [{ value: 'closed', label: 'Closed' }] : []),
                ]}
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL}>Description</label>
            <textarea
              required
              value={form.description}
              onChange={set('description')}
              rows={5}
              placeholder="Describe the role, responsibilities, and requirements..."
              className={`${INPUT} resize-none`}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-border text-foreground hover:border-border hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-[#4ade80] text-[#0A0D12] font-semibold hover:bg-[#22c55e] transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
