'use client'

import { useState, useMemo, useRef, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { X, Plus, Minus, Send, GripVertical, CalendarIcon, Check, Clock, Copy, ExternalLink, Search, Trash2 } from 'lucide-react'
import CustomSelect from '@/components/ui/custom-select'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { useJobs } from '@/hooks/use-jobs'
import { useAuth } from '@/hooks/use-auth'
import { useQuestions } from '@/hooks/use-questions'
import { useCandidates } from '@/hooks/use-candidates'
import { apiInstance } from '@/services/config/axios.config'
import { avatarColor, getJobChipColor } from '@/lib/colors'
import { useInterviewQuestions } from '@/hooks/use-interview-questions'
import type { Question } from '@/types/question'
import type { Interview, InterviewQuestion } from '@/types/interview'

const ALL = 'all'

interface SelectedQuestion {
  question: Question
  timer: number
  iqId?: string // interview_question ID, used in edit mode to track existing questions
}

const PALETTE = [
  { bg: 'bg-[#4ade80]/10', text: 'text-[#4ade80]' },
  { bg: 'bg-amber-400/10', text: 'text-amber-400' },
  { bg: 'bg-blue-400/10',  text: 'text-blue-400' },
  { bg: 'bg-violet-400/10',text: 'text-violet-400' },
  { bg: 'bg-pink-400/10',  text: 'text-pink-400' },
  { bg: 'bg-cyan-400/10',  text: 'text-cyan-400' },
]
const catColorCache: Record<string, (typeof PALETTE)[number]> = {}
let paletteIdx = 0
function catStyle(cat: string) {
  if (!catColorCache[cat]) {
    catColorCache[cat] = PALETTE[paletteIdx % PALETTE.length]
    paletteIdx++
  }
  return catColorCache[cat]
}


function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative w-9 h-5 rounded-full transition-colors ${value ? 'bg-[#4ade80]' : 'bg-white/10'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </button>
  )
}

function SendingOverlay() {
  const [progress, setProgress] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setProgress(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-[#4ade80] animate-spin" />
      <div className="text-center">
        <p className="text-white font-bold text-xl">Setting up interviews</p>
        <p className="text-gray-400 text-sm mt-1.5">Creating interview links and notifying candidates...</p>
      </div>
      <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full bg-[#4ade80] rounded-full transition-all ease-linear ${progress ? 'w-full' : 'w-0'}`}
          style={{ transitionDuration: '3000ms' }}
        />
      </div>
    </div>
  )
}

function InterviewSetupContent() {
  const { company } = useAuth()
  const { jobs } = useJobs(company?.id ?? null)
  const [selectedJob, setSelectedJob] = useState<string>(ALL)
  const { questions, isLoading: qLoading, error: qError, mutate: mutateQuestions } = useQuestions()
  const { candidates, mutate: mutateCandidates } = useCandidates(selectedJob === ALL ? undefined : selectedJob)

  const [checkedCandidates, setCheckedCandidates] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<SelectedQuestion[]>([])
  const [calOpen, setCalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    const d = new Date()
    d.setHours(d.getHours() + 1, 0, 0, 0)
    return d
  })
  const [selectedTime, setSelectedTime] = useState(() => {
    const d = new Date()
    d.setHours(d.getHours() + 1, 0, 0, 0)
    return `${String(d.getHours()).padStart(2, '0')}:00`
  })
  const [settings, setSettings] = useState({
    defaultTimer: 90,
    duration_minutes: 30,
    voiceProvider: 'elevenlabs-free',
    transcriptionProvider: 'browser',
    language: 'en',
    autoSendEmail: true,
  })
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ success: number; failed: number; failedNames: string[] } | null>(null)

  // holds the interview links created after sending
  const [createdLinks, setCreatedLinks] = useState<{ name: string; url: string }[]>([])
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  // candidate search
  const [candidateSearch, setCandidateSearch] = useState('')
  // status filter buttons — all active by default
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set(['pending', 'in_progress']))

  // question bank search, filter, and creation
  const [qSearch, setQSearch] = useState('')
  const [qFilter, setQFilter] = useState<'all' | 'mine'>('all')
  const [showCreateQ, setShowCreateQ] = useState(false)
  const [newQText, setNewQText] = useState('')
  const [newQCategory, setNewQCategory] = useState('')
  const [saveToBank, setSaveToBank] = useState(true)
  const [creatingQ, setCreatingQ] = useState(false)

  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  // -- URL params: ?edit=interviewId for editing, ?candidate=id to pre-select --
  const searchParams = useSearchParams()
  const router = useRouter()
  const editId = searchParams.get('edit')
  const preSelectCandidateId = searchParams.get('candidate')
  const isEditMode = !!editId
  const [editInterview, setEditInterview] = useState<Interview | null>(null)
  const [saving, setSaving] = useState(false)
  const { questions: editQuestions, isLoading: editQLoading } = useInterviewQuestions(editId)
  const originalIQsRef = useRef<InterviewQuestion[]>([])
  const editInitRef = useRef(false)
  // track original schedule so we can auto-enable email when time changes
  const originalScheduleRef = useRef<string | null>(null)
  // true once the user manually clicks the email toggle in edit mode
  const emailManualRef = useRef(false)

  // find candidate and job for the interview being edited
  const editCandidate = isEditMode && editInterview
    ? candidates.find((c) => c.id === editInterview.candidate_id) ?? null
    : null
  const editJob = isEditMode && editInterview
    ? jobs.find((j) => j.id === editInterview.job_id) ?? null
    : null

  // fetch interview data when entering edit mode
  useEffect(() => {
    if (!editId) return
    apiInstance.get(`/interviews/${editId}`).then((r) => {
      const iv = r.data as Interview
      setEditInterview(iv)
      // pre-fill date, time, and duration from the existing interview
      const d = new Date(iv.scheduled_at)
      setSelectedDate(d)
      const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      setSelectedTime(time)
      // store original schedule for change detection
      originalScheduleRef.current = `${d.toDateString()}|${time}`
      // editing doesn't send email by default
      setSettings((s) => ({ ...s, autoSendEmail: false }))
      emailManualRef.current = false
    }).catch((err) => console.error('[edit] failed to load interview', err))
  }, [editId])

  // pre-fill selected questions once they load
  useEffect(() => {
    if (!editId || editQLoading || editInitRef.current) return
    editInitRef.current = true
    originalIQsRef.current = editQuestions
    setSelected(editQuestions.map((iq) => ({
      question: iq.questions,
      timer: iq.q_timer,
      iqId: iq.id,
    })))
  }, [editId, editQLoading, editQuestions])

  // auto-enable email notification when schedule changes in edit mode
  useEffect(() => {
    if (!isEditMode || !originalScheduleRef.current || emailManualRef.current) return
    const currentSchedule = `${selectedDate?.toDateString()}|${selectedTime}`
    const changed = currentSchedule !== originalScheduleRef.current
    setSettings((s) => ({ ...s, autoSendEmail: changed }))
  }, [isEditMode, selectedDate, selectedTime])

  // auto-select candidate when navigating with ?candidate=id (e.g. from applicants page)
  const preSelectInitRef = useRef(false)
  useEffect(() => {
    if (!preSelectCandidateId || isEditMode || preSelectInitRef.current) return
    if (candidates.length === 0) return
    const match = candidates.find((c) => c.id === preSelectCandidateId)
    if (match && match.status !== 'in_progress') {
      preSelectInitRef.current = true
      setCheckedCandidates(new Set([preSelectCandidateId]))
      // auto-set the job filter to match this candidate's job
      if (match.job_id) setSelectedJob(match.job_id)
    }
  }, [preSelectCandidateId, isEditMode, candidates])

  const selectedJob_obj = useMemo(() => jobs.find((j) => j.id === selectedJob), [jobs, selectedJob])

  // group questions by category, filtered by search term and ownership toggle
  const grouped = useMemo(() => {
    const map: Record<string, Question[]> = {}
    const term = qSearch.toLowerCase()
    for (const q of questions) {
      // "mine" filter: only show company-created questions
      if (qFilter === 'mine' && !q.company_id) continue
      // skip questions that don't match the search
      if (term && !q.question.toLowerCase().includes(term) && !q.category.toLowerCase().includes(term)) continue
      const cat = q.category || 'GENERAL'
      if (!map[cat]) map[cat] = []
      map[cat].push(q)
    }
    return map
  }, [questions, qSearch, qFilter])

  // existing categories for the dropdown when creating a new question
  const existingCategories = useMemo(() => {
    return Array.from(new Set(questions.map((q) => q.category).filter(Boolean)))
  }, [questions])

  // create a new question, optionally as temporary (one-time use)
  const handleCreateQuestion = async () => {
    if (!newQText.trim() || !newQCategory.trim() || creatingQ) return
    setCreatingQ(true)
    try {
      const payload: Record<string, unknown> = {
        question: newQText.trim(),
        category: newQCategory.trim(),
      }
      // temporary questions won't persist in the bank after use
      if (!saveToBank) payload.is_temporary = true

      const { data: created } = await apiInstance.post('/questions', payload)
      // auto-add the new question to the interview so the user doesn't have to find it
      setSelected((prev) => [...prev, { question: created as Question, timer: settings.defaultTimer }])
      mutateQuestions()
      setNewQText('')
      setNewQCategory('')
      setSaveToBank(true)
      setShowCreateQ(false)
    } catch (err) {
      console.error('[questions] create failed', err)
    } finally {
      setCreatingQ(false)
    }
  }

  // delete a question from the bank
  const handleDeleteQuestion = async (id: string) => {
    try {
      await apiInstance.delete(`/questions/${id}`)
      // also remove from selected list if it was added
      setSelected((prev) => prev.filter((s) => s.question.id !== id))
      mutateQuestions()
    } catch (err) {
      console.error('[questions] delete failed', err)
    }
  }

  // filter candidates by search term, job filter, and status filter buttons
  const filteredCandidates = useMemo(() => {
    const term = candidateSearch.toLowerCase()
    return candidates.filter((c) => {
      if (!statusFilters.has(c.status)) return false
      if (term) {
        const name = `${c.first_name} ${c.last_name}`.toLowerCase()
        const jobTitle = jobs.find((j) => j.id === c.job_id)?.title?.toLowerCase() ?? ''
        if (!name.includes(term) && !c.email.toLowerCase().includes(term) && !jobTitle.includes(term)) return false
      }
      return true
    })
  }, [candidates, candidateSearch, statusFilters, jobs])

  // only non-active candidates can be selected for new interviews
  const selectableCandidates = filteredCandidates.filter((c) => c.status !== 'in_progress')

  // toggle a single status filter, recalculate "all" automatically
  const allStatuses = ['pending', 'in_progress', 'completed', 'dismissed', 'hired']
  const toggleStatusFilter = (status: string) => {
    setStatusFilters((prev) => {
      const next = new Set(prev)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      return next
    })
  }
  const toggleAllStatuses = () => {
    if (statusFilters.size === allStatuses.length) setStatusFilters(new Set())
    else setStatusFilters(new Set(allStatuses))
  }
  // count selected among selectable (non-active) candidates only
  const visibleChecked = selectableCandidates.filter((c) => checkedCandidates.has(c.id)).length
  const allChecked = selectableCandidates.length > 0 && visibleChecked === selectableCandidates.length
  const someChecked = visibleChecked > 0 && !allChecked

  const toggleAll = () => {
    if (allChecked) {
      setCheckedCandidates(new Set())
    } else {
      // only select non-active candidates
      setCheckedCandidates(new Set(selectableCandidates.map((c) => c.id)))
    }
  }

  const toggleCandidate = (id: string) => {
    setCheckedCandidates((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const addQuestion = (q: Question) => {
    if (selected.some((s) => s.question.id === q.id)) return
    setSelected((prev) => [...prev, { question: q, timer: settings.defaultTimer }])
  }

  // add all questions from a category at once
  const addCategoryQuestions = (qs: Question[]) => {
    setSelected((prev) => {
      const existingIds = new Set(prev.map((s) => s.question.id))
      const toAdd = qs.filter((q) => !existingIds.has(q.id))
      return [...prev, ...toAdd.map((q) => ({ question: q, timer: settings.defaultTimer }))]
    })
  }

  const removeQuestion = (id: string) =>
    setSelected((prev) => prev.filter((s) => s.question.id !== id))

  const adjustTimer = (id: string, delta: number) =>
    setSelected((prev) =>
      prev.map((s) =>
        s.question.id === id ? { ...s, timer: Math.max(30, s.timer + delta) } : s
      )
    )

  const handleDragEnd = () => {
    if (
      dragItem.current !== null &&
      dragOverItem.current !== null &&
      dragItem.current !== dragOverItem.current
    ) {
      const next = [...selected]
      const [moved] = next.splice(dragItem.current, 1)
      next.splice(dragOverItem.current, 0, moved)
      setSelected(next)
    }
    dragItem.current = null
    dragOverItem.current = null
    setDragOverIdx(null)
  }

  // build the interview URL candidates use to join
  const getInterviewUrl = (token: string) => {
    const base = process.env.NEXT_PUBLIC_INTERVIEW_APP_URL || 'https://interview.borasozer.com'
    return `${base}?token=${token}`
  }

  const handleCopyLink = async (idx: number, url: string) => {
    await navigator.clipboard.writeText(url)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const handleSendLinks = async () => {
    const targetCandidates = candidates.filter((c) => checkedCandidates.has(c.id))
    if (targetCandidates.length === 0 || selected.length === 0) return

    setSending(true)
    setSendResult(null)
    setCreatedLinks([])

    // short delay so the overlay feels intentional
    await new Promise((resolve) => setTimeout(resolve, 2000))

    let success = 0
    let failed = 0
    const failedNames: string[] = []
    const links: { name: string; url: string }[] = []

    for (const candidate of targetCandidates) {
      try {
        const interview = await apiInstance
          .post('/interviews', {
            candidate_id: candidate.id,
            job_id: candidate.job_id,
            scheduled_at: (() => {
              const base = selectedDate ?? new Date()
              const [h, m] = selectedTime.split(':').map(Number)
              const d = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m)
              return d.toISOString()
            })(),
            duration_minutes: estimatedMinutes,
            job_title: jobs.find((j) => j.id === candidate.job_id)?.title,
            company_name: company?.name,
            send_email: settings.autoSendEmail,
          })
          .then((r) => r.data)

        for (const { question, timer } of selected) {
          await apiInstance.post('/interview-questions', {
            interview_id: interview.id,
            question_id: question.id,
            q_timer: timer,
          })
        }

        // collect the link so HR can copy/share it
        links.push({
          name: `${candidate.first_name} ${candidate.last_name}`,
          url: getInterviewUrl(interview.token),
        })
        success++
      } catch (err) {
        console.error('[send] failed for candidate', candidate.id, err)
        failedNames.push(`${candidate.first_name} ${candidate.last_name}`)
        failed++
      }
    }

    setSending(false)
    setSendResult({ success, failed, failedNames })
    setCreatedLinks(links)
    if (success > 0) {
      setCheckedCandidates(new Set())
      setSelected([])
      // refresh candidate list so statuses update
      mutateCandidates()
    }
  }

  // save changes in edit mode — update interview details and diff questions
  const handleSaveEdit = async () => {
    if (!editId || saving) return
    setSaving(true)
    try {
      const base = selectedDate ?? new Date()
      const [h, m] = selectedTime.split(':').map(Number)
      const scheduled_at = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m).toISOString()
      await apiInstance.put(`/interviews/${editId}`, { scheduled_at, duration_minutes: estimatedMinutes })

      const originals = originalIQsRef.current
      // remove questions that were deleted from the selection
      for (const orig of originals) {
        if (!selected.some((s) => s.iqId === orig.id)) {
          await apiInstance.delete(`/interview-questions/${orig.id}`)
        }
      }
      // add newly selected questions
      for (const s of selected) {
        if (!s.iqId) {
          await apiInstance.post('/interview-questions', {
            interview_id: editId,
            question_id: s.question.id,
            q_timer: s.timer,
          })
        }
      }
      // update timers for existing questions if changed
      for (const s of selected) {
        if (s.iqId) {
          const orig = originals.find((o) => o.id === s.iqId)
          if (orig && orig.q_timer !== s.timer) {
            await apiInstance.put(`/interview-questions/${s.iqId}`, { q_timer: s.timer })
          }
        }
      }
      // resend invitation email with updated schedule if toggle is on
      if (settings.autoSendEmail) {
        await apiInstance.post(`/interviews/${editId}/resend`).catch((err) =>
          console.error('[edit] resend email failed', err)
        )
      }
      // navigate back with the interview pre-selected so the detail panel opens
      router.push(`/dashboard/interviews?selected=${editId}`)
    } catch (err) {
      console.error('[edit] save failed', err)
    } finally {
      setSaving(false)
    }
  }

  // estimated interview duration: sum of timers + ~10s transition per question gap
  const estimatedMinutes = useMemo(() => {
    if (selected.length === 0) return 0
    const totalSec = selected.reduce((s, q) => s + q.timer, 0) + (selected.length - 1) * 10
    return Math.ceil(totalSec / 60)
  }, [selected])

  // check if the selected date+time is in the past
  const isDatePast = useMemo(() => {
    if (!selectedDate) return false
    const [h, m] = selectedTime.split(':').map(Number)
    const dt = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), h, m)
    return dt.getTime() < Date.now()
  }, [selectedDate, selectedTime])

  const canSend = isEditMode
    ? selected.length > 0 && !isDatePast && !saving
    : visibleChecked > 0 && selected.length > 0 && !isDatePast

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">{isEditMode ? 'Edit Interview' : 'Interview Setup'}</h2>
          <p className="text-gray-500 text-sm mt-1">
            {isEditMode
              ? 'Modify questions, schedule, and duration'
              : `${selectedJob_obj ? `${selectedJob_obj.title} — ` : ''}configure questions and send interview links`
            }
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={isEditMode ? handleSaveEdit : handleSendLinks}
            disabled={!canSend}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-[#4ade80] text-[#0A0D12] font-semibold hover:bg-[#22c55e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {isEditMode
              ? (saving ? 'Saving...' : settings.autoSendEmail ? 'Save & Send Email' : 'Save Changes')
              : settings.autoSendEmail ? 'Create & Send Links' : 'Create Interview'}
            {!isEditMode && visibleChecked > 0 && (
              <span className="bg-[#0A0D12]/20 px-1.5 py-0.5 rounded-md text-xs font-bold">{visibleChecked}</span>
            )}
          </button>
        </div>
      </div>

      {/* Send result banner with interview links */}
      {sendResult && (
        <div className={`rounded-xl border text-sm ${sendResult.failed === 0 ? 'bg-[#4ade80]/10 border-[#4ade80]/20' : 'bg-amber-400/10 border-amber-400/20'}`}>
          <div className={`flex items-center gap-3 px-4 py-3 ${sendResult.failed === 0 ? 'text-[#4ade80]' : 'text-amber-400'}`}>
            <Check className="w-4 h-4 shrink-0" />
            <span>
              {sendResult.success > 0 && `Interview links created for ${sendResult.success} candidate(s). `}
              {sendResult.failed > 0 && `Failed for: ${sendResult.failedNames.join(', ')}`}
            </span>
            <button onClick={() => { setSendResult(null); setCreatedLinks([]) }} className="ml-auto opacity-60 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* show created links so HR can copy them */}
          {createdLinks.length > 0 && (
            <div className="px-4 pb-3 flex flex-col gap-2">
              {createdLinks.map((link, i) => (
                <div key={i} className="flex items-center gap-3 bg-black/20 rounded-lg px-3 py-2">
                  <span className="text-xs text-white font-medium shrink-0">{link.name}</span>
                  <span className="text-xs text-gray-500 truncate flex-1">{link.url}</span>
                  <button
                    onClick={() => handleCopyLink(i, link.url)}
                    className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors shrink-0"
                    title="Copy link"
                  >
                    {copiedIdx === i ? <Check className="w-3.5 h-3.5 text-[#4ade80]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors shrink-0"
                    title="Open link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* warning when selected date is in the past */}
      {isDatePast && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <Clock className="w-4 h-4 shrink-0" />
          The selected date and time is in the past. Choose a future time to {isEditMode ? 'save changes' : 'send interview links'}.
        </div>
      )}

      {/* 3-column layout */}
      <div className="flex gap-4 items-start">

        {/* Column 1 — Candidates (or candidate info in edit mode) */}
        {isEditMode ? (
          <div className="w-72 shrink-0 bg-[#0D1117] border border-white/5 rounded-2xl flex flex-col">
            <div className="px-4 py-3.5 border-b border-white/5 shrink-0">
              <span className="text-sm font-semibold">Editing Interview</span>
            </div>
            <div className="p-4 flex flex-col gap-4">
              {editCandidate ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${avatarColor(editCandidate.id)} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                      {`${editCandidate.first_name[0]}${editCandidate.last_name[0]}`.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{editCandidate.first_name} {editCandidate.last_name}</p>
                      <p className="text-xs text-gray-500 truncate">{editCandidate.email}</p>
                    </div>
                  </div>
                  {editJob && (
                    <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                      <p className="text-[10px] text-gray-500 tracking-widest font-semibold mb-1">POSITION</p>
                      <p className="text-sm text-white">{editJob.title}</p>
                    </div>
                  )}
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 tracking-widest font-semibold mb-1">STATUS</p>
                    <span className="inline-flex items-center gap-1.5 text-sm text-blue-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      Scheduled
                    </span>
                  </div>
                  {editInterview && (
                    <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                      <p className="text-[10px] text-gray-500 tracking-widest font-semibold mb-1">CREATED</p>
                      <p className="text-sm text-gray-400">{new Date(editInterview.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-24">
                  <div className="w-6 h-6 border-2 border-white/10 border-t-[#4ade80] rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>
        ) : (
        <div className="w-72 shrink-0 bg-[#0D1117] border border-white/5 rounded-2xl flex flex-col">
          <div className="px-4 py-3.5 border-b border-white/5 shrink-0">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-sm font-semibold">
                Candidates
                <span className="text-[10px] text-gray-500 font-normal ml-1.5">
                  {filteredCandidates.length}
                </span>
              </span>
              <div className="flex items-center gap-2">
                {visibleChecked > 0 && (
                  <span className="text-xs text-[#4ade80] font-medium">{visibleChecked}</span>
                )}
                <button
                  onClick={toggleAll}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    allChecked
                      ? 'bg-[#4ade80] border-[#4ade80]'
                      : someChecked
                      ? 'bg-[#4ade80]/30 border-[#4ade80]/40'
                      : 'border-white/20 bg-transparent'
                  }`}
                >
                  {(allChecked || someChecked) && <Check className="w-3 h-3 text-[#0A0D12]" />}
                </button>
              </div>
            </div>
            {/* job filter dropdown */}
            {!isEditMode && (
              <div className="mb-2">
                <CustomSelect
                  value={selectedJob}
                  onChange={(v) => { setSelectedJob(v); setCheckedCandidates(new Set()) }}
                  options={[{ value: ALL, label: 'All Jobs' }, ...jobs.map((j) => ({ value: j.id, label: j.title }))]}
                  size="sm"
                />
              </div>
            )}
            {/* search candidates by name, email, or job */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                placeholder="Search name, email, job..."
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                className="w-full bg-[#0A0D12] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-white/20 transition-colors"
              />
            </div>
            {/* status filter buttons */}
            <div className="flex gap-1 mt-2">
              {([
                { key: 'all',         label: 'All',    on: 'bg-white/15 border-white/30 text-white',              off: 'bg-transparent border-white/5 text-gray-600' },
                { key: 'pending',     label: 'New',    on: 'bg-gray-400/15 border-gray-400/30 text-gray-400',     off: 'bg-transparent border-white/5 text-gray-600' },
                { key: 'in_progress', label: 'Active', on: 'bg-amber-400/15 border-amber-400/30 text-amber-400',  off: 'bg-transparent border-white/5 text-gray-600' },
                { key: 'completed',   label: 'Done',   on: 'bg-[#4ade80]/15 border-[#4ade80]/30 text-[#4ade80]', off: 'bg-transparent border-white/5 text-gray-600' },
              ] as const).map(({ key, label, on, off }) => {
                const isOn = key === 'all'
                  ? statusFilters.size === allStatuses.length
                  : statusFilters.has(key)
                return (
                  <button
                    key={key}
                    onClick={() => key === 'all' ? toggleAllStatuses() : toggleStatusFilter(key)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${isOn ? on : off}`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(100vh-380px)] min-h-[320px] py-1">
            {filteredCandidates.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-600 text-xs text-center px-4">
                {candidates.length === 0
                  ? (selectedJob === ALL ? 'Select a job to see candidates' : 'No candidates found')
                  : 'No matching candidates'}
              </div>
            ) : (
              filteredCandidates.map((c) => {
                const isActive = c.status === 'in_progress'
                const checked = !isActive && checkedCandidates.has(c.id)
                const initials = `${c.first_name[0]}${c.last_name[0]}`.toUpperCase()
                const color = avatarColor(c.id)
                const job = jobs.find((j) => j.id === c.job_id)
                const chip = getJobChipColor(c.job_id)
                return (
                  <div
                    key={c.id}
                    onClick={() => !isActive && toggleCandidate(c.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 transition-colors ${
                      isActive
                        ? 'opacity-50 cursor-not-allowed'
                        : `cursor-pointer hover:bg-white/[0.03] ${checked ? 'bg-[#4ade80]/5' : ''}`
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? 'border-white/10 bg-white/5'
                          : checked
                          ? 'bg-[#4ade80] border-[#4ade80]'
                          : 'border-white/20 bg-transparent'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 text-[#0A0D12]" />}
                    </div>
                    <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-medium text-white truncate leading-tight">
                          {c.first_name} {c.last_name}
                        </p>
                        {/* status badge — right-aligned */}
                        {c.status === 'pending' && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-400/10 text-gray-400 shrink-0">New</span>
                        )}
                        {c.status === 'in_progress' && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 shrink-0">Active</span>
                        )}
                        {c.status === 'completed' && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#4ade80]/10 text-[#4ade80] shrink-0">Done</span>
                        )}
                      </div>
                      {/* job title — always shown below name */}
                      {job && (
                        <p className="text-[9px] text-gray-500 truncate mt-0.5">{job.title}</p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
        )}

        {/* Column 2 — Interview Questions + Settings */}
        <div className="flex-1 flex flex-col gap-4">
        <div className="bg-[#0D1117] border border-white/5 rounded-2xl flex flex-col flex-1">
          <div className="px-5 py-3.5 border-b border-white/5 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Interview Questions</h3>
              <div className="flex items-center gap-3">
                {/* estimated duration including ~10s transition between questions */}
                {selected.length > 0 && (
                  <span className="text-[10px] text-gray-600">
                    ~{estimatedMinutes}min
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {selected.length} question{selected.length !== 1 ? 's' : ''}
                </span>
                {/* remove all selected questions at once */}
                {selected.length > 0 && (
                  <button
                    onClick={() => setSelected([])}
                    className="text-[10px] text-gray-500 hover:text-red-400 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Date picker */}
              <Popover open={calOpen} onOpenChange={setCalOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 bg-[#0A0D12] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-300 hover:border-white/20 transition-colors cursor-pointer min-w-0 flex-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span className="truncate">
                      {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Pick a date'}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-[#0D1117] border border-white/10 rounded-2xl shadow-2xl"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => { setSelectedDate(d); setCalOpen(false) }}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className="text-white [--rdp-accent-color:#4ade80] [--rdp-accent-color-dark:#4ade80]"
                    classNames={{
                      day: 'text-gray-300 hover:bg-white/5 rounded-lg',
                      today: 'bg-white/10 text-white rounded-lg',
                      selected: '!bg-[#4ade80] !text-[#0A0D12] rounded-lg font-bold',
                      disabled: 'opacity-30 cursor-not-allowed',
                      caption_label: 'text-white font-semibold text-sm',
                      nav_button: 'text-gray-400 hover:text-white',
                      head_cell: 'text-gray-500 text-xs font-medium',
                      outside: 'opacity-30',
                    }}
                  />
                </PopoverContent>
              </Popover>

              {/* Time picker */}
              <div className="flex items-center gap-1.5 bg-[#0A0D12] border border-white/10 rounded-xl px-3 py-1.5 shrink-0">
                <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="bg-transparent text-xs text-gray-300 outline-none cursor-pointer w-[72px]"
                />
              </div>

              {/* auto-calculated duration shown as a label */}
              {selected.length > 0 && (
                <span className="bg-[#0A0D12] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-400 shrink-0">
                  ~{estimatedMinutes} min
                </span>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1 min-h-[120px] p-4">
            {selected.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-600 text-sm">
                Add questions from the Question Bank →
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {selected.map((item, idx) => {
                  const cs = catStyle(item.question.category)
                  return (
                    <div
                      key={item.question.id}
                      draggable
                      onDragStart={() => { dragItem.current = idx }}
                      onDragOver={(e) => { e.preventDefault(); dragOverItem.current = idx; setDragOverIdx(idx) }}
                      onDragEnd={handleDragEnd}
                      onDragLeave={() => { if (dragOverIdx === idx) setDragOverIdx(null) }}
                      className={`flex items-start gap-3 border rounded-xl p-3.5 transition-all select-none ${
                        dragOverIdx === idx
                          ? 'border-[#4ade80]/40 bg-[#4ade80]/5'
                          : 'bg-white/[0.03] border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 shrink-0 mt-0.5">
                        <GripVertical className="w-4 h-4 text-gray-600 cursor-grab active:cursor-grabbing" />
                        <span className="w-5 h-5 rounded bg-white/5 text-gray-500 text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white leading-snug">{item.question.question}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cs.bg} ${cs.text}`}>
                            {item.question.category.toUpperCase()}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <span>Timer:</span>
                            <button
                              onClick={() => adjustTimer(item.question.id, -15)}
                              className="w-5 h-5 rounded flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-white font-medium w-8 text-center">{item.timer}s</span>
                            <button
                              onClick={() => adjustTimer(item.question.id, 15)}
                              className="w-5 h-5 rounded flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeQuestion(item.question.id)}
                        className="p-1 rounded-lg text-gray-700 hover:text-white hover:bg-white/5 transition-colors shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          </div>

          {/* Interview Settings — separate block below questions */}
          <div className="bg-[#0D1117] border border-white/5 rounded-2xl p-5">
            <h3 className="font-semibold text-sm mb-4">Interview Settings</h3>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[10px] text-gray-500 tracking-widest font-semibold mb-2">DEFAULT ANSWER TIME</p>
                <CustomSelect
                  value={String(settings.defaultTimer)}
                  onChange={(v) => setSettings((s) => ({ ...s, defaultTimer: Number(v) }))}
                  options={[
                    { value: '30', label: '30 seconds' },
                    { value: '60', label: '60 seconds' },
                    { value: '90', label: '90 seconds' },
                    { value: '120', label: '120 seconds' },
                    { value: '180', label: '180 seconds' },
                  ]}
                />
              </div>

              {/* auto-send email toggle */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white">Auto-send invitation email</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isEditMode ? 'Resend updated interview details to candidate' : 'Email interview link & PIN to candidates on create'}
                  </p>
                </div>
                <Toggle value={settings.autoSendEmail} onChange={(v) => {
                  if (isEditMode) emailManualRef.current = true
                  setSettings((s) => ({ ...s, autoSendEmail: v }))
                }} />
              </div>

              {/* AI voice provider selector */}
              <div>
                <p className="text-[10px] text-gray-500 tracking-widest font-semibold mb-2">VOICE ENGINE</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'elevenlabs-free', label: 'ElevenLabs Free', enabled: true },
                    { value: 'openai-tts', label: 'OpenAI TTS', enabled: false },
                    { value: 'google-tts', label: 'Google Cloud', enabled: false },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => opt.enabled && setSettings((s) => ({ ...s, voiceProvider: opt.value }))}
                      disabled={!opt.enabled}
                      className={`relative px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        settings.voiceProvider === opt.value
                          ? 'bg-[#4ade80]/10 border-[#4ade80]/30 text-[#4ade80]'
                          : opt.enabled
                            ? 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20'
                            : 'bg-white/[0.02] border-white/5 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {opt.label}
                      {!opt.enabled && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-violet-500/10 text-[9px] font-bold text-violet-400/70 tracking-wide">SOON</span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-600 mt-1.5">Questions are read aloud to candidates</p>
              </div>

              {/* AI transcription provider selector */}
              <div>
                <p className="text-[10px] text-gray-500 tracking-widest font-semibold mb-2">TRANSCRIPTION</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'browser', label: 'Browser API', enabled: true },
                    { value: 'whisper', label: 'Whisper (OpenAI)', enabled: false },
                    { value: 'deepgram', label: 'Deepgram', enabled: false },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => opt.enabled && setSettings((s) => ({ ...s, transcriptionProvider: opt.value }))}
                      disabled={!opt.enabled}
                      className={`relative px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        settings.transcriptionProvider === opt.value
                          ? 'bg-[#4ade80]/10 border-[#4ade80]/30 text-[#4ade80]'
                          : opt.enabled
                            ? 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20'
                            : 'bg-white/[0.02] border-white/5 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {opt.label}
                      {!opt.enabled && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-violet-500/10 text-[9px] font-bold text-violet-400/70 tracking-wide">SOON</span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-600 mt-1.5">Candidate answers transcribed automatically</p>
              </div>

              {/* interview language selector */}
              <div>
                <p className="text-[10px] text-gray-500 tracking-widest font-semibold mb-2">INTERVIEW LANGUAGE</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'en', label: 'English', enabled: true },
                    { value: 'tr', label: 'Türkçe', enabled: false },
                    { value: 'de', label: 'Deutsch', enabled: false },
                    { value: 'fr', label: 'Français', enabled: false },
                    { value: 'es', label: 'Español', enabled: false },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => opt.enabled && setSettings((s) => ({ ...s, language: opt.value }))}
                      disabled={!opt.enabled}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        settings.language === opt.value
                          ? 'bg-[#4ade80]/10 border-[#4ade80]/30 text-[#4ade80]'
                          : opt.enabled
                            ? 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20'
                            : 'bg-white/[0.02] border-white/5 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {opt.label}
                      {!opt.enabled && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-violet-500/10 text-[9px] font-bold text-violet-400/70 tracking-wide">SOON</span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-600 mt-1.5">TTS and transcription language for the interview</p>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3 — Question Bank */}
        <div className="w-72 shrink-0 flex flex-col">
          <div className="bg-[#0D1117] border border-white/5 rounded-2xl flex flex-col h-[calc(100vh-180px)]">
            <div className="px-5 py-3.5 border-b border-white/5 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Question Bank</h3>
                <button
                  onClick={() => setShowCreateQ(!showCreateQ)}
                  className="w-6 h-6 rounded-lg bg-white/5 hover:bg-[#4ade80] hover:text-[#0A0D12] text-gray-400 flex items-center justify-center transition-colors"
                  title="Add new question"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* ownership filter tabs */}
              <div className="flex gap-1 mb-2">
                {(['all', 'mine'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setQFilter(tab)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                      qFilter === tab
                        ? 'bg-white/10 text-white'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {tab === 'all' ? 'All' : 'Yours'}
                  </button>
                ))}
              </div>

              {/* search input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={qSearch}
                  onChange={(e) => setQSearch(e.target.value)}
                  className="w-full bg-[#0A0D12] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-white/20 transition-colors"
                />
              </div>

              {/* new question form */}
              {showCreateQ && (
                <div className="mt-3 flex flex-col gap-2 p-3 bg-white/[0.03] border border-white/5 rounded-lg">
                  <textarea
                    value={newQText}
                    onChange={(e) => setNewQText(e.target.value)}
                    placeholder="Type your question..."
                    rows={2}
                    maxLength={500}
                    className="w-full resize-none bg-[#0A0D12] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-white/20"
                  />
                  <div className="relative">
                    <input
                      type="text"
                      list="category-list"
                      value={newQCategory}
                      onChange={(e) => setNewQCategory(e.target.value)}
                      placeholder="Category (e.g. Technical)"
                      className="w-full bg-[#0A0D12] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-white/20"
                    />
                    <datalist id="category-list">
                      {existingCategories.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                  {/* save-to-bank toggle: unchecked = one-time question */}
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={saveToBank}
                      onChange={(e) => setSaveToBank(e.target.checked)}
                      className="mt-0.5 accent-[#4ade80]"
                    />
                    <span className="flex flex-col">
                      <span className="text-xs text-gray-300">Save to question bank</span>
                      <span className="text-[10px] text-gray-600">Uncheck for one-time use</span>
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateQuestion}
                      disabled={!newQText.trim() || !newQCategory.trim() || creatingQ}
                      className="flex-1 bg-[#4ade80] text-[#0A0D12] text-xs font-semibold py-1.5 rounded-lg hover:bg-[#22c55e] transition-colors disabled:opacity-40"
                    >
                      {creatingQ ? 'Adding...' : 'Add'}
                    </button>
                    <button
                      onClick={() => { setShowCreateQ(false); setNewQText(''); setNewQCategory(''); setSaveToBank(true) }}
                      className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {qLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />
                  ))}
                </div>
              ) : qError ? (
                <p className="text-xs text-red-400">{qError}</p>
              ) : Object.keys(grouped).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-xs text-gray-400 mb-1">
                    {questions.length === 0 ? 'No questions yet' : 'No matching questions'}
                  </p>
                  {questions.length === 0 && (
                    <p className="text-[10px] text-gray-600">
                      Click the <span className="text-gray-400">+</span> button above to create your first question
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {Object.entries(grouped).map(([cat, qs]) => {
                    const cs = catStyle(cat)
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-2">
                          <p className={`text-[10px] font-bold tracking-widest ${cs.text}`}>
                            {cat.toUpperCase()}
                          </p>
                          {/* add all questions from this category at once */}
                          <button
                            onClick={() => addCategoryQuestions(qs)}
                            className="text-[9px] text-gray-500 hover:text-white transition-colors px-1.5 py-0.5 rounded hover:bg-white/5"
                          >
                            Add all
                          </button>
                        </div>
                        <div className="flex flex-col gap-1">
                          {qs.map((q) => {
                            const isAdded = selected.some((s) => s.question.id === q.id)
                            return (
                              <div
                                key={q.id}
                                onClick={() => addQuestion(q)}
                                className={`flex items-start justify-between gap-2 px-2 py-2 rounded-lg transition-colors group/q ${isAdded ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/5 cursor-pointer'}`}
                              >
                                <p className="text-xs text-gray-300 leading-snug">{q.question}</p>
                                <div className="flex items-center gap-0.5 shrink-0">
                                  {/* only company-owned questions can be deleted */}
                                  {q.company_id && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(q.id) }}
                                      className="w-5 h-5 rounded-full text-gray-600 hover:text-red-400 hover:bg-red-400/10 flex items-center justify-center transition-colors opacity-0 group-hover/q:opacity-100"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); addQuestion(q) }}
                                    disabled={isAdded}
                                    className="w-5 h-5 rounded-full bg-white/10 hover:bg-[#4ade80] hover:text-[#0A0D12] text-gray-400 flex items-center justify-center transition-colors disabled:cursor-not-allowed"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Sending overlay — only in create mode */}
      {sending && <SendingOverlay />}
    </div>
  )
}

// wrap in Suspense so useSearchParams works correctly
export default function InterviewSetupPage() {
  return (
    <Suspense>
      <InterviewSetupContent />
    </Suspense>
  )
}
