'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { X, Plus, Minus, ChevronDown, Send, GripVertical, CalendarIcon, Check, Clock, Copy, ExternalLink, Search } from 'lucide-react'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { useJobs } from '@/hooks/use-jobs'
import { useAuth } from '@/hooks/use-auth'
import { useQuestions } from '@/hooks/use-questions'
import { useCandidates } from '@/hooks/use-candidates'
import { apiInstance } from '@/services/config/axios.config'
import { avatarColor, getJobChipColor } from '@/lib/colors'
import type { Question } from '@/types/question'

const ALL = 'all'

interface SelectedQuestion {
  question: Question
  timer: number
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

export default function InterviewSetupPage() {
  const { company } = useAuth()
  const { jobs } = useJobs(company?.id ?? null)
  const [selectedJob, setSelectedJob] = useState<string>(ALL)
  const { questions, isLoading: qLoading, error: qError, mutate: mutateQuestions } = useQuestions()
  const { candidates } = useCandidates(selectedJob === ALL ? undefined : selectedJob)

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
    tts: true,
    speechToText: true,
    allowRetakes: false,
    expireAfter7Days: true,
  })
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ success: number; failed: number } | null>(null)

  // holds the interview links created after sending
  const [createdLinks, setCreatedLinks] = useState<{ name: string; url: string }[]>([])
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  // question bank search and creation
  const [qSearch, setQSearch] = useState('')
  const [showCreateQ, setShowCreateQ] = useState(false)
  const [newQText, setNewQText] = useState('')
  const [newQCategory, setNewQCategory] = useState('')
  const [creatingQ, setCreatingQ] = useState(false)

  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const selectedJob_obj = useMemo(() => jobs.find((j) => j.id === selectedJob), [jobs, selectedJob])

  // group questions by category, filtered by search term
  const grouped = useMemo(() => {
    const map: Record<string, Question[]> = {}
    const term = qSearch.toLowerCase()
    for (const q of questions) {
      // skip questions that don't match the search
      if (term && !q.question.toLowerCase().includes(term) && !q.category.toLowerCase().includes(term)) continue
      const cat = q.category || 'GENERAL'
      if (!map[cat]) map[cat] = []
      map[cat].push(q)
    }
    return map
  }, [questions, qSearch])

  // existing categories for the dropdown when creating a new question
  const existingCategories = useMemo(() => {
    return Array.from(new Set(questions.map((q) => q.category).filter(Boolean)))
  }, [questions])

  // create a new question and add it to the bank
  const handleCreateQuestion = async () => {
    if (!newQText.trim() || !newQCategory.trim() || creatingQ) return
    setCreatingQ(true)
    try {
      await apiInstance.post('/questions', {
        question: newQText.trim(),
        category: newQCategory.trim(),
      })
      mutateQuestions()
      setNewQText('')
      setNewQCategory('')
      setShowCreateQ(false)
    } catch (err) {
      console.error('[questions] create failed', err)
    } finally {
      setCreatingQ(false)
    }
  }

  const eligibleCandidates = candidates.filter((c) => c.status !== 'in_progress')
  const visibleChecked = eligibleCandidates.filter((c) => checkedCandidates.has(c.id)).length
  const allChecked = eligibleCandidates.length > 0 && visibleChecked === eligibleCandidates.length
  const someChecked = visibleChecked > 0 && !allChecked

  const toggleAll = () => {
    if (allChecked) {
      setCheckedCandidates(new Set())
    } else {
      setCheckedCandidates(new Set(eligibleCandidates.map((c) => c.id)))
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
            duration_minutes: settings.duration_minutes,
            job_title: jobs.find((j) => j.id === candidate.job_id)?.title,
            company_name: company?.name,
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
        failed++
      }
    }

    setSending(false)
    setSendResult({ success, failed })
    setCreatedLinks(links)
    if (success > 0) {
      setCheckedCandidates(new Set())
      setSelected([])
    }
  }

  const canSend = visibleChecked > 0 && selected.length > 0

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">Interview Setup</h2>
          <p className="text-gray-500 text-sm mt-1">
            {selectedJob_obj ? `${selectedJob_obj.title} — ` : ''}configure questions and send interview links
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <select
              value={selectedJob}
              onChange={(e) => { setSelectedJob(e.target.value); setCheckedCandidates(new Set()) }}
              className="appearance-none bg-[#0D1117] border border-white/10 rounded-xl px-4 pr-8 py-2.5 text-sm text-gray-300 outline-none focus:border-white/20 cursor-pointer"
            >
              <option value={ALL}>All Jobs</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          </div>
          <button
            onClick={handleSendLinks}
            disabled={!canSend}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-[#4ade80] text-[#0A0D12] font-semibold hover:bg-[#22c55e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            Send Interview Links
            {visibleChecked > 0 && (
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
              {sendResult.failed > 0 && `${sendResult.failed} failed.`}
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

      {/* 3-column layout */}
      <div className="flex gap-4 items-start">

        {/* Column 1 — Candidates */}
        <div className="w-72 shrink-0 bg-[#0D1117] border border-white/5 rounded-2xl flex flex-col">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 shrink-0">
            <span className="text-sm font-semibold">Candidates</span>
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

          <div className="overflow-y-auto max-h-[calc(100vh-300px)] min-h-[320px] py-1">
            {candidates.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-600 text-xs text-center px-4">
                {selectedJob === ALL ? 'Select a job to see candidates' : 'No candidates found'}
              </div>
            ) : (
              candidates.map((c) => {
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
                      <p className="text-xs font-medium text-white truncate leading-tight">
                        {c.first_name} {c.last_name}
                      </p>
                      {isActive ? (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 inline-block bg-amber-400/10 text-amber-400">
                          Interview Active
                        </span>
                      ) : job && (
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 inline-block ${chip.bg} ${chip.text}`}>
                          {job.title.length > 40 ? job.title.slice(0, 40) + '…' : job.title}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Column 2 — Interview Questions */}
        <div className="flex-1 bg-[#0D1117] border border-white/5 rounded-2xl flex flex-col">
          <div className="px-5 py-3.5 border-b border-white/5 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Interview Questions</h3>
              <span className="text-xs text-gray-500">
                {selected.length} question{selected.length !== 1 ? 's' : ''}
              </span>
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

              {/* Duration select */}
              <div className="relative shrink-0">
                <select
                  value={settings.duration_minutes}
                  onChange={(e) => setSettings((s) => ({ ...s, duration_minutes: Number(e.target.value) }))}
                  className="appearance-none bg-[#0A0D12] border border-white/10 rounded-xl px-3 pr-7 py-1.5 text-xs text-gray-300 outline-none focus:border-white/20 cursor-pointer"
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(100vh-360px)] min-h-[280px] p-4">
            {selected.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
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

        {/* Column 3 — Question Bank + Settings */}
        <div className="w-72 shrink-0 flex flex-col gap-4">

          {/* Question Bank */}
          <div className="bg-[#0D1117] border border-white/5 rounded-2xl flex flex-col">
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
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateQuestion}
                      disabled={!newQText.trim() || !newQCategory.trim() || creatingQ}
                      className="flex-1 bg-[#4ade80] text-[#0A0D12] text-xs font-semibold py-1.5 rounded-lg hover:bg-[#22c55e] transition-colors disabled:opacity-40"
                    >
                      {creatingQ ? 'Adding...' : 'Add'}
                    </button>
                    <button
                      onClick={() => { setShowCreateQ(false); setNewQText(''); setNewQCategory('') }}
                      className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="overflow-y-auto max-h-[320px] p-4">
              {qLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />
                  ))}
                </div>
              ) : qError ? (
                <p className="text-xs text-red-400">{qError}</p>
              ) : Object.keys(grouped).length === 0 ? (
                <p className="text-xs text-gray-400">No questions found.</p>
              ) : (
                <div className="flex flex-col gap-5">
                  {Object.entries(grouped).map(([cat, qs]) => {
                    const cs = catStyle(cat)
                    return (
                      <div key={cat}>
                        <p className={`text-[10px] font-bold tracking-widest mb-2 ${cs.text}`}>
                          {cat.toUpperCase()}
                        </p>
                        <div className="flex flex-col gap-1">
                          {qs.map((q) => {
                            const isAdded = selected.some((s) => s.question.id === q.id)
                            return (
                              <div
                                key={q.id}
                                onClick={() => addQuestion(q)}
                                className={`flex items-start justify-between gap-2 px-2 py-2 rounded-lg transition-colors ${isAdded ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/5 cursor-pointer'}`}
                              >
                                <p className="text-xs text-gray-300 leading-snug">{q.question}</p>
                                <button
                                  onClick={(e) => { e.stopPropagation(); addQuestion(q) }}
                                  disabled={isAdded}
                                  className="w-5 h-5 rounded-full bg-white/10 hover:bg-[#4ade80] hover:text-[#0A0D12] text-gray-400 flex items-center justify-center shrink-0 transition-colors disabled:cursor-not-allowed"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
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

          {/* Interview Settings */}
          <div className="bg-[#0D1117] border border-white/5 rounded-2xl p-5">
            <h3 className="font-semibold text-sm mb-4">Interview Settings</h3>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[10px] text-gray-500 tracking-widest font-semibold mb-2">DEFAULT ANSWER TIME</p>
                <div className="relative">
                  <select
                    value={settings.defaultTimer}
                    onChange={(e) => setSettings((s) => ({ ...s, defaultTimer: Number(e.target.value) }))}
                    className="w-full appearance-none bg-[#0A0D12] border border-white/10 rounded-xl px-4 pr-8 py-2.5 text-sm text-gray-300 outline-none focus:border-white/20 cursor-pointer"
                  >
                    <option value={30}>30 seconds</option>
                    <option value={60}>60 seconds</option>
                    <option value={90}>90 seconds</option>
                    <option value={120}>120 seconds</option>
                    <option value={180}>180 seconds</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {[
                { key: 'tts' as const, label: 'ElevenLabs Voice (TTS)', sub: 'Questions are read aloud to candidate' },
                { key: 'speechToText' as const, label: 'Speech-to-Text Recording', sub: 'Candidate answers transcribed automatically' },
                { key: 'allowRetakes' as const, label: 'Allow retakes', sub: 'Candidate can redo a question once' },
                { key: 'expireAfter7Days' as const, label: 'Expire link after 7 days', sub: 'Invite link becomes invalid after deadline' },
              ].map(({ key, label, sub }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-white">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                  </div>
                  <Toggle value={settings[key]} onChange={(v) => setSettings((s) => ({ ...s, [key]: v }))} />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Sending overlay */}
      {sending && <SendingOverlay />}
    </div>
  )
}
