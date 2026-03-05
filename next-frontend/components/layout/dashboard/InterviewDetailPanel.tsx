'use client'

import { useState } from 'react'
import { X, Calendar, Clock, Star, MessageSquare, Copy, Check, ExternalLink } from 'lucide-react'
import { avatarColor } from '@/lib/colors'
import { formatDate } from '@/lib/date'
import { useInterviewQuestions } from '@/hooks/use-interview-questions'
import type { Interview } from '@/types/interview'
import type { Candidate } from '@/types/candidate'
import type { Job } from '@/types/job'

const STATUS_STYLES: Record<string, { dot: string; text: string; label: string }> = {
  scheduled:  { dot: 'bg-blue-400',   text: 'text-blue-400',   label: 'Scheduled' },
  completed:  { dot: 'bg-[#4ade80]',  text: 'text-[#4ade80]',  label: 'Completed' },
  cancelled:  { dot: 'bg-gray-400',   text: 'text-gray-400',   label: 'Cancelled' },
  no_show:    { dot: 'bg-red-400',    text: 'text-red-400',    label: 'No Show' },
}

interface Props {
  interview: Interview
  candidate: Candidate | undefined
  job: Job | undefined
  onClose: () => void
}

// renders 1-5 filled/empty stars
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-4 h-4 ${n <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-700'}`}
        />
      ))}
    </div>
  )
}

export default function InterviewDetailPanel({ interview, candidate, job, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const { questions, isLoading: qLoading } = useInterviewQuestions(interview.id)

  // build the interview URL for copying
  const interviewUrl = interview.token
    ? `${process.env.NEXT_PUBLIC_INTERVIEW_APP_URL || 'https://interview.borasozer.com'}?token=${interview.token}`
    : null

  const handleCopyLink = async () => {
    if (!interviewUrl) return
    await navigator.clipboard.writeText(interviewUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const st = STATUS_STYLES[interview.status] ?? STATUS_STYLES.scheduled
  const fullName = candidate ? `${candidate.first_name} ${candidate.last_name}` : 'Unknown'
  const initials = candidate
    ? `${candidate.first_name[0]}${candidate.last_name[0]}`.toUpperCase()
    : '??'
  const color = avatarColor(interview.candidate_id)

  // count how many questions were answered
  const answeredCount = questions.filter((q) => q.q_answer).length

  return (
    <div className="flex flex-col h-full bg-[#0D1117] border border-white/5 rounded-2xl overflow-hidden">
      {/* top bar — candidate info and close button */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-sm leading-tight truncate">{fullName}</h3>
            <p className="text-[11px] text-gray-500 truncate">{candidate?.email}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* scrollable body */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

        {/* interview meta chips + link actions in one row */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${st.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {st.label}
          </span>
          {job && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-400/10 text-blue-400">
              {job.title}
            </span>
          )}
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <Calendar className="w-3 h-3" />
            {formatDate(interview.scheduled_at)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <Clock className="w-3 h-3" />
            {interview.duration_minutes}m
          </div>

          {/* link actions pushed to the right end */}
          {interview.status === 'scheduled' && interviewUrl && (
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[11px] text-gray-300 hover:bg-white/10 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-[#4ade80]" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <a
                href={interviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[11px] text-gray-300 hover:bg-white/10 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Open
              </a>
            </div>
          )}
        </div>

        {/* score card — only shown when there's a score or completed */}
        {interview.final_score > 0 ? (
          <div className="bg-[#0A0D12] border border-white/5 rounded-xl p-3.5">
            <p className="text-[10px] font-semibold text-gray-500 tracking-widest mb-1.5">SCORE</p>
            <div className="flex items-end gap-1.5">
              <span className={`text-2xl font-bold ${interview.final_score >= 70 ? 'text-[#4ade80]' : interview.final_score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                {interview.final_score}
              </span>
              <span className="text-xs text-gray-500 mb-0.5">/ 100</span>
            </div>
          </div>
        ) : interview.status === 'completed' && (
          <div className="bg-[#0A0D12] border border-white/5 rounded-xl p-3.5">
            <p className="text-[10px] font-semibold text-gray-500 tracking-widest mb-1.5">SCORE</p>
            <span className="text-sm text-gray-500">Not scored yet</span>
          </div>
        )}

        {/* candidate feedback */}
        {interview.feedback_rating != null && (
          <div className="bg-[#0A0D12] border border-white/5 rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-3 h-3 text-gray-500" />
              <p className="text-[10px] font-semibold text-gray-500 tracking-widest">CANDIDATE FEEDBACK</p>
            </div>
            <div className="flex items-center gap-3 mb-1.5">
              <StarRating rating={interview.feedback_rating} />
              <span className="text-sm text-gray-400">{interview.feedback_rating}/5</span>
            </div>
            {interview.feedback_comment && (
              <p className="text-sm text-gray-300 leading-relaxed mt-1.5 italic">
                &ldquo;{interview.feedback_comment}&rdquo;
              </p>
            )}
          </div>
        )}

        {/* questions and answers */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-gray-500 tracking-widest">
              QUESTIONS & ANSWERS
            </p>
            <span className="text-[11px] font-semibold text-gray-400">
              {qLoading ? '...' : `${answeredCount}/${questions.length} answered`}
            </span>
          </div>

          {qLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-[#0A0D12] border border-white/5 rounded-xl p-4">
                  <div className="h-4 bg-white/5 rounded animate-pulse w-3/4 mb-3" />
                  <div className="h-3 bg-white/5 rounded animate-pulse w-full mb-1" />
                  <div className="h-3 bg-white/5 rounded animate-pulse w-2/3" />
                </div>
              ))}
            </div>
          ) : questions.length === 0 ? (
            <p className="text-sm text-gray-600">No questions assigned to this interview.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {questions.map((iq, idx) => (
                <div key={iq.id} className="bg-[#0A0D12] border border-white/5 rounded-xl p-3.5">
                  {/* question header */}
                  <div className="flex items-start gap-2.5 mb-2.5">
                    <span className="w-5 h-5 rounded-md bg-white/5 text-gray-500 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white leading-snug">{iq.questions.question}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-gray-500">
                          {iq.questions.category}
                        </span>
                        <span className="text-[10px] text-gray-600">{iq.q_timer}s</span>
                      </div>
                    </div>
                  </div>

                  {/* answer */}
                  {iq.q_answer ? (
                    <div className="ml-7 bg-white/[0.02] border border-white/5 rounded-lg p-3">
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{iq.q_answer}</p>
                    </div>
                  ) : (
                    <p className="ml-7 text-xs text-gray-600 italic">No answer submitted</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
