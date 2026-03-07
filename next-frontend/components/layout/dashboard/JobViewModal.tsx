'use client'

import { X, MapPin, Briefcase, Clock, Building2 } from 'lucide-react'
import type { Job } from '@/types/job'

interface Props {
  job: Job
  onClose: () => void
  onEdit?: () => void
}

const STATUS_STYLES = {
  active: { dot: 'bg-[#4ade80]', text: 'text-[#4ade80]', label: 'ACTIVE' },
  draft: { dot: 'bg-orange-400', text: 'text-orange-400', label: 'DRAFT' },
  closed: { dot: 'bg-red-400', text: 'text-red-400', label: 'CLOSED' },
}

function workTypeLabel(wt: string) {
  if (wt === 'on-site') return 'On-site'
  return wt.charAt(0).toUpperCase() + wt.slice(1)
}

export default function JobViewModal({ job, onClose, onEdit }: Props) {
  const status = STATUS_STYLES[job.status]

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
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className={`flex items-center gap-2 text-[11px] font-bold ${status.text} mb-2`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </div>
            <h2 className="text-base font-semibold leading-tight">{job.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{job.department}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Meta pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
            <MapPin className="w-3.5 h-3.5" />
            {job.location}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
            <Briefcase className="w-3.5 h-3.5" />
            {workTypeLabel(job.work_type)}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
            <Building2 className="w-3.5 h-3.5" />
            {job.department}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            {new Date(job.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Description */}
        <div className="border-t border-border pt-5">
          <p className="text-xs text-muted-foreground font-medium mb-2 tracking-wider">DESCRIPTION</p>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{job.description}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-5 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-border text-foreground hover:border-border hover:text-foreground transition-colors"
          >
            Close
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-[#4ade80] text-[#0A0D12] font-semibold hover:bg-[#22c55e] transition-colors"
            >
              Edit Job
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
