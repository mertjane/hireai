'use client'

import { useEffect, useState, useRef } from 'react'
import { X, Mail, Phone, Calendar, Briefcase, Sparkles, FileText, ExternalLink, ChevronDown } from 'lucide-react'
import ScoreRing from '@/components/ui/score-ring'
import { apiInstance } from '@/services/config/axios.config'
import { avatarColor } from '@/lib/colors'
import { formatDate } from '@/lib/date'
import type { Candidate, CandidateStatus } from '@/types/candidate'
import type { Interview } from '@/types/interview'
import type { Job } from '@/types/job'

const STATUS_STYLES: Record<CandidateStatus, { dot: string; bg: string; text: string; label: string }> = {
  pending:     { dot: 'bg-gray-400',  bg: 'bg-gray-400/10',  text: 'text-gray-400',  label: 'Pending Invite' },
  in_progress: { dot: 'bg-amber-400', bg: 'bg-amber-400/10', text: 'text-amber-400', label: 'In Progress' },
  completed:   { dot: 'bg-[#4ade80]', bg: 'bg-[#4ade80]/10', text: 'text-[#4ade80]', label: 'Completed' },
  dismissed:   { dot: 'bg-red-400',   bg: 'bg-red-400/10',   text: 'text-red-400',   label: 'Dismissed' },
  hired:       { dot: 'bg-violet-400', bg: 'bg-violet-400/10', text: 'text-violet-400', label: 'Hired' },
}

// statuses the user can manually set from the detail panel
const MANUAL_STATUSES: CandidateStatus[] = ['in_progress', 'completed', 'hired', 'dismissed']

interface Props {
  candidate: Candidate
  job: Job | undefined
  interview?: Interview
  onClose: () => void
  onViewInterview?: (interviewId: string) => void
  onStatusChange?: (id: string, status: CandidateStatus) => void
}

export default function ApplicantDetailModal({ candidate: c, job, interview, onClose, onViewInterview, onStatusChange }: Props) {
  const [visible, setVisible] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<CandidateStatus>(c.status)
  const statusRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  // close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  // update candidate status via API
  const handleStatusChange = async (status: CandidateStatus) => {
    setStatusOpen(false)
    if (status === currentStatus) return
    try {
      await apiInstance.put(`/candidates/${c.id}`, { status })
      setCurrentStatus(status)
      onStatusChange?.(c.id, status)
    } catch (err) {
      console.error('[applicant] status update failed', err)
    }
  }

  const st = STATUS_STYLES[currentStatus]
  const initials = `${c.first_name[0]}${c.last_name[0]}`.toUpperCase()
  const color = avatarColor(c.id)

  const score = c.agg_score ?? 0
  const segments = score >= 67 ? 3 : score >= 34 ? 2 : score > 0 ? 1 : 0
  const segColor = segments === 3 ? 'bg-[#4ade80]' : segments === 2 ? 'bg-amber-400' : 'bg-red-400'
  const segLabel = segments === 3 ? 'Strong Match' : segments === 2 ? 'Average Match' : segments === 1 ? 'Weak Match' : 'Not Scored'
  const segTextColor = segments === 3 ? 'text-[#4ade80]' : segments === 2 ? 'text-amber-400' : segments === 1 ? 'text-red-400' : 'text-gray-600'

  const cvUrl = c.cv_url
  const isPdf = !cvUrl || cvUrl.toLowerCase().includes('.pdf') || !cvUrl.toLowerCase().includes('.doc')

  const aiSummary = score > 0
    ? segments === 3
      ? `Strong candidate with a score of ${score}/100. Profile aligns well with the role requirements. Recommend moving forward to the interview stage.`
      : segments === 2
      ? `Moderate candidate scoring ${score}/100. Shows potential but may lack some key requirements. Consider reviewing CV closely before proceeding.`
      : `Below-average score of ${score}/100. Candidate may not meet core role requirements. Additional screening recommended.`
    : 'AI analysis will appear once the candidate has submitted their CV and been scored by the system.'

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Slide panel from right */}
      <div
        className={`relative ml-auto w-full max-w-4xl h-full bg-[#0A0D12] border-l border-white/5 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
              {initials}
            </div>
            <div>
              <h3 className="font-semibold text-white leading-tight">{c.first_name} {c.last_name}</h3>
              <p className="text-xs text-gray-500">{c.email}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left — details */}
          <div className="w-72 shrink-0 flex flex-col gap-6 p-6 border-r border-white/5 overflow-y-auto">

            {/* Status — clickable dropdown to change */}
            <div>
              <p className="text-[10px] font-semibold text-gray-500 tracking-widest mb-2">STATUS</p>
              <div className="relative" ref={statusRef}>
                <button
                  onClick={() => setStatusOpen(!statusOpen)}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold ${st.text} ${st.bg} px-2.5 py-1 rounded-full hover:brightness-125 transition-all`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                  {st.label}
                  <ChevronDown className={`w-3 h-3 transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
                </button>
                {statusOpen && (
                  <div className="absolute top-full left-0 mt-1.5 bg-[#161B22] border border-white/10 rounded-xl py-1.5 shadow-xl z-10 min-w-[140px]">
                    {MANUAL_STATUSES.map((s) => {
                      const opt = STATUS_STYLES[s]
                      const active = s === currentStatus
                      return (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(s)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
                            active ? `${opt.text} bg-white/5` : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Contact */}
            <div>
              <p className="text-[10px] font-semibold text-gray-500 tracking-widest mb-2.5">CONTACT</p>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5 text-sm text-gray-300">
                  <Mail className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                  <span className="truncate">{c.email}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-gray-300">
                  <Phone className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                  <span>{c.phone}</span>
                </div>
              </div>
            </div>

            {/* Applied */}
            <div>
              <p className="text-[10px] font-semibold text-gray-500 tracking-widest mb-2.5">APPLIED</p>
              <div className="flex items-center gap-2.5 text-sm text-gray-300">
                <Calendar className="w-3.5 h-3.5 text-gray-600" />
                <span>{formatDate(c.applied_at)}</span>
              </div>
            </div>

            {/* Position */}
            {job && (
              <div>
                <p className="text-[10px] font-semibold text-gray-500 tracking-widest mb-2.5">POSITION</p>
                <div className="flex items-center gap-2.5">
                  <Briefcase className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-400/10 text-blue-400">
                    {job.title}
                  </span>
                </div>
              </div>
            )}

            {/* AI Score — 3 segments */}
            <div>
              <p className="text-[10px] font-semibold text-gray-500 tracking-widest mb-2.5">AI SCORE</p>
              {score > 0 ? (
                <div>
                  <div className="flex items-end justify-between mb-3">
                    <span className="text-3xl font-bold text-white leading-none">{score}</span>
                    <span className={`text-xs font-semibold ${segTextColor}`}>{segLabel}</span>
                  </div>
                  <div className="flex gap-1.5 mb-1.5">
                    {[1, 2, 3].map((s) => (
                      <div
                        key={s}
                        className={`h-2 flex-1 rounded-full transition-all duration-700 delay-${s * 100} ${s <= segments ? segColor : 'bg-white/10'}`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[9px] text-gray-600">Low</span>
                    <span className="text-[9px] text-gray-600">Medium</span>
                    <span className="text-[9px] text-gray-600">High</span>
                  </div>
                </div>
              ) : (
                <span className="text-sm text-gray-600">Not scored yet</span>
              )}
            </div>

            {/* AI Summary */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <p className="text-[10px] font-semibold text-gray-500 tracking-widest">AI SUMMARY</p>
                <Sparkles className="w-3 h-3 text-[#4ade80]" />
              </div>
              <div className="bg-[#4ade80]/5 border border-[#4ade80]/15 rounded-xl p-3.5">
                <p className="text-xs text-gray-400 leading-relaxed">{aiSummary}</p>
              </div>
            </div>

            {/* Interview info — score, comment, link to full detail */}
            {interview && (
              <div>
                <p className="text-[10px] font-semibold text-gray-500 tracking-widest mb-2.5">INTERVIEW</p>
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3.5 flex flex-col gap-3">
                  {/* status */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${
                      interview.status === 'completed' ? 'text-[#4ade80]' :
                      interview.status === 'scheduled' ? 'text-blue-400' :
                      interview.status === 'cancelled' ? 'text-gray-400' : 'text-red-400'
                    }`}>
                      {interview.status.toUpperCase().replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-gray-500">{formatDate(interview.scheduled_at)}</span>
                  </div>

                  {/* score ring + AI comment when available */}
                  {interview.status === 'completed' && interview.final_score > 0 && (
                    <div className="flex items-start gap-3">
                      <ScoreRing score={interview.final_score} size="md" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold text-white">{interview.final_score}/100</span>
                        {interview.ai_comment && (
                          <p className="text-xs text-gray-400 italic mt-1 leading-relaxed">{interview.ai_comment}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* link to full interview detail */}
                  {onViewInterview && (
                    <button
                      onClick={() => { handleClose(); onViewInterview(interview.id) }}
                      className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold text-gray-400 bg-white/5 hover:bg-white/[0.08] hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Full Interview
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Right — CV preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-3 border-b border-white/5 shrink-0">
              <FileText className="w-3.5 h-3.5 text-gray-500" />
              <p className="text-[10px] font-semibold text-gray-500 tracking-widest">CV PREVIEW</p>
            </div>
            {cvUrl ? (
              isPdf ? (
                <iframe
                  src={cvUrl}
                  className="flex-1 w-full bg-white"
                  title="CV Preview"
                />
              ) : (
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(cvUrl)}&embedded=true`}
                  className="flex-1 w-full bg-white"
                  title="CV Preview"
                />
              )
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-700">
                <div className="w-20 h-24 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-700" />
                </div>
                <p className="text-sm">No CV uploaded</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
