'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, Calendar, Clock, Star, MessageSquare, Copy, Check, ExternalLink, Pencil, Trash2, Send } from 'lucide-react'
import { apiInstance } from '@/services/config/axios.config'
import { avatarColor } from '@/lib/colors'
import { formatDate } from '@/lib/date'
import { useInterviewQuestions } from '@/hooks/use-interview-questions'
import type { Interview } from '@/types/interview'
import type { Candidate } from '@/types/candidate'
import type { Job } from '@/types/job'

const STATUS_STYLES: Record<string, { dot: string; text: string; label: string }> = {
  scheduled:  { dot: 'bg-blue-400',   text: 'text-blue-400',   label: 'Scheduled' },
  completed:  { dot: 'bg-[#4ade80]',  text: 'text-[#4ade80]',  label: 'Completed' },
  cancelled:  { dot: 'bg-gray-400',   text: 'text-muted-foreground',   label: 'Cancelled' },
  no_show:    { dot: 'bg-red-400',    text: 'text-red-400',    label: 'No Show' },
}

interface Props {
  interview: Interview
  candidate: Candidate | undefined
  job: Job | undefined
  onClose: () => void
  onDelete?: (id: string) => void
}

// renders 1-5 filled/empty stars
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-4 h-4 ${n <= rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`}
        />
      ))}
    </div>
  )
}

export default function InterviewDetailPanel({ interview, candidate, job, onClose, onDelete }: Props) {
  const [copied, setCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
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

  // resend the interview invitation email with link + PIN
  const handleResend = async () => {
    if (resending || resent) return
    setResending(true)
    try {
      await apiInstance.post(`/interviews/${interview.id}/resend`)
      setResent(true)
      setTimeout(() => setResent(false), 3000)
    } catch {
      // silently fail
    } finally {
      setResending(false)
    }
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
    <div className="flex flex-col h-full bg-card border border-border rounded-2xl overflow-hidden">
      {/* top bar — candidate info and close button */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
        {/* clickable link to applicant detail on the applicants page */}
        <Link
          href={`/dashboard/applicants?candidate=${interview.candidate_id}`}
          className="flex items-center gap-3 min-w-0 group"
        >
          <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center text-foreground text-xs font-bold shrink-0`}>
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground text-sm leading-tight truncate group-hover:text-[#4ade80] transition-colors">{fullName}</h3>
            <p className="text-[11px] text-muted-foreground truncate">{candidate?.email}</p>
          </div>
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          {/* edit button — only for scheduled interviews */}
          {interview.status === 'scheduled' && (
            <Link
              href={`/dashboard/interview-setup?edit=${interview.id}`}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Edit interview"
            >
              <Pencil className="w-4 h-4" />
            </Link>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
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
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {formatDate(interview.scheduled_at)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            {interview.duration_minutes}m
          </div>

          {/* link actions pushed to the right end */}
          {interview.status === 'scheduled' && interviewUrl && (
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-muted border border-border rounded-lg text-[11px] text-foreground hover:bg-muted transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-[#4ade80]" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <a
                href={interviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1 bg-muted border border-border rounded-lg text-[11px] text-foreground hover:bg-muted transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Open
              </a>
              <button
                onClick={handleResend}
                disabled={resending || resent}
                className={`flex items-center gap-1.5 px-2.5 py-1 border rounded-lg text-[11px] transition-colors ${
                  resent
                    ? 'bg-[#4ade80]/10 border-[#4ade80]/20 text-[#4ade80]'
                    : 'bg-muted border-border text-foreground hover:bg-muted'
                } disabled:opacity-60`}
              >
                {resent ? <Check className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                {resending ? 'Sending...' : resent ? 'Sent!' : 'Resend'}
              </button>
            </div>
          )}
        </div>

        {/* score card — only shown when there's a score or completed */}
        {interview.final_score > 0 ? (
          <div className="bg-background border border-border rounded-xl p-3.5">
            <p className="text-[10px] font-semibold text-muted-foreground tracking-widest mb-1.5">SCORE</p>
            <div className="flex items-end gap-1.5">
              <span className={`text-2xl font-bold ${interview.final_score >= 70 ? 'text-[#4ade80]' : interview.final_score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                {interview.final_score}
              </span>
              <span className="text-xs text-muted-foreground mb-0.5">/ 100</span>
            </div>
            {interview.ai_comment && (
              <p className="text-sm text-muted-foreground italic mt-2">{interview.ai_comment}</p>
            )}
          </div>
        ) : interview.status === 'completed' && (
          <div className="bg-background border border-border rounded-xl p-3.5">
            <p className="text-[10px] font-semibold text-muted-foreground tracking-widest mb-1.5">SCORE</p>
            <span className="text-sm text-muted-foreground">Not scored yet</span>
          </div>
        )}

        {/* candidate feedback */}
        {interview.feedback_rating != null && (
          <div className="bg-background border border-border rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-3 h-3 text-muted-foreground" />
              <p className="text-[10px] font-semibold text-muted-foreground tracking-widest">CANDIDATE FEEDBACK</p>
            </div>
            <div className="flex items-center gap-3 mb-1.5">
              <StarRating rating={interview.feedback_rating} />
              <span className="text-sm text-muted-foreground">{interview.feedback_rating}/5</span>
            </div>
            {interview.feedback_comment && (
              <p className="text-sm text-foreground leading-relaxed mt-1.5 italic">
                &ldquo;{interview.feedback_comment}&rdquo;
              </p>
            )}
          </div>
        )}

        {/* questions and answers */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-muted-foreground tracking-widest">
              QUESTIONS & ANSWERS
            </p>
            <span className="text-[11px] font-semibold text-muted-foreground">
              {qLoading ? '...' : `${answeredCount}/${questions.length} answered`}
            </span>
          </div>

          {qLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-background border border-border rounded-xl p-4">
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4 mb-3" />
                  <div className="h-3 bg-muted rounded animate-pulse w-full mb-1" />
                  <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                </div>
              ))}
            </div>
          ) : questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No questions assigned to this interview.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {questions.map((iq, idx) => (
                <div key={iq.id} className="bg-background border border-border rounded-xl p-3.5">
                  {/* question header */}
                  <div className="flex items-start gap-2.5 mb-2.5">
                    <span className="w-5 h-5 rounded-md bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug">{iq.questions.question}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {iq.questions.category}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{iq.q_timer}s</span>
                      </div>
                    </div>
                  </div>

                  {/* answer */}
                  {iq.q_answer ? (
                    <div className="ml-7 bg-muted/40 border border-border rounded-lg p-3">
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{iq.q_answer}</p>
                    </div>
                  ) : (
                    <p className="ml-7 text-xs text-muted-foreground italic">No answer submitted</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* delete button — available for completed and cancelled interviews */}
        {onDelete && (interview.status === 'completed' || interview.status === 'cancelled') && (
          <div className="pt-3 border-t border-border">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDelete(interview.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Confirm Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-2 bg-muted border border-border rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-muted border border-border rounded-lg text-xs text-muted-foreground hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Delete Interview
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
