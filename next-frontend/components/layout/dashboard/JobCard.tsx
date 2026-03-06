import { MapPin, Clock } from 'lucide-react'
import type { Job } from '@/types/job'

const STATUS_STYLES = {
  active: { dot: 'bg-[#4ade80]', text: 'text-[#4ade80]', label: 'ACTIVE' },
  draft: { dot: 'bg-orange-400', text: 'text-orange-400', label: 'DRAFT' },
  closed: { dot: 'bg-red-400', text: 'text-red-400', label: 'CLOSED' },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`
}

function workTypeLabel(wt: string) {
  if (wt === 'on-site') return 'On-site'
  return wt.charAt(0).toUpperCase() + wt.slice(1)
}

interface Props {
  job: Job
  applicantCount?: number
  onView?: () => void
  onEdit?: () => void
  onPublish?: () => void
}

export default function JobCard({ job, applicantCount = 0, onView, onEdit, onPublish }: Props) {
  const status = STATUS_STYLES[job.status]

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4 hover:border-border transition-colors">
      {/* Title + status */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-foreground leading-tight">{job.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{job.department}</p>
        </div>
        <span className={`flex items-center gap-1.5 text-[11px] font-bold ${status.text} shrink-0`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          {workTypeLabel(job.work_type)}
          {job.location ? ` — ${job.location}` : ''}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {job.status === 'draft'
            ? 'Draft'
            : job.status === 'closed'
            ? `Closed ${timeAgo(job.updated_at)}`
            : `Posted ${timeAgo(job.created_at)}`}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        {job.status === 'draft' ? (
          <span className="text-xs text-muted-foreground">Not published yet</span>
        ) : (
          <span className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{applicantCount}</span> applicants
          </span>
        )}

        <div className="flex gap-2">
          {job.status === 'active' && (
            <>
              <button className="text-xs px-3 py-1.5 rounded-lg border border-border text-foreground hover:border-border hover:text-foreground transition-colors">
                Setup Interview
              </button>
              <button onClick={onView} className="text-xs px-3 py-1.5 rounded-lg bg-muted text-foreground hover:bg-muted transition-colors">
                View
              </button>
            </>
          )}
          {job.status === 'draft' && (
            <>
              <button onClick={onPublish} className="text-xs px-3 py-1.5 rounded-lg bg-[#4ade80] text-[#0A0D12] font-semibold hover:bg-[#22c55e] transition-colors">
                Publish
              </button>
              <button onClick={onEdit} className="text-xs px-3 py-1.5 rounded-lg border border-border text-foreground hover:border-border hover:text-foreground transition-colors">
                Edit
              </button>
            </>
          )}
          {job.status === 'closed' && (
            <button className="text-xs px-3 py-1.5 rounded-lg border border-border text-foreground hover:border-border hover:text-foreground transition-colors">
              View Results
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
