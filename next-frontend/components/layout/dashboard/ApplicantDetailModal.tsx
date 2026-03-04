'use client'

import { useEffect, useState } from 'react'
import { X, Mail, Phone, Calendar, Briefcase, Sparkles, FileText } from 'lucide-react'
import { avatarColor } from '@/lib/colors'
import { formatDate } from '@/lib/date'
import type { Candidate, CandidateStatus } from '@/types/candidate'
import type { Job } from '@/types/job'

const STATUS_STYLES: Record<CandidateStatus, { dot: string; bg: string; text: string; label: string }> = {
  pending:     { dot: 'bg-gray-400',  bg: 'bg-gray-400/10',  text: 'text-gray-400',  label: 'Pending Invite' },
  in_progress: { dot: 'bg-amber-400', bg: 'bg-amber-400/10', text: 'text-amber-400', label: 'In Progress' },
  dismissed:   { dot: 'bg-red-400',   bg: 'bg-red-400/10',   text: 'text-red-400',   label: 'Dismissed' },
}

interface Props {
  candidate: Candidate
  job: Job | undefined
  onClose: () => void
}

export default function ApplicantDetailModal({ candidate: c, job, onClose }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  const st = STATUS_STYLES[c.status]
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

            {/* Status */}
            <div>
              <p className="text-[10px] font-semibold text-gray-500 tracking-widest mb-2">STATUS</p>
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${st.text} ${st.bg} px-2.5 py-1 rounded-full`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
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
