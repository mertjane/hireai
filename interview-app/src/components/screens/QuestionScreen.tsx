import { useState, useEffect, useCallback, useRef } from 'react'
import type { Question } from '../../types'
import { useSpeechRecognition } from '../../hooks/use-speech-recognition'
import { useSpeechSynthesis } from '../../hooks/use-speech-synthesis'
import { useTimer } from '../../hooks/use-timer'
import { TransitionOverlay } from '../TransitionOverlay'
import { ConfirmDialog } from '../ConfirmDialog'
import { Toast } from '../Toast'

const DEFAULT_TIMER = 120
const REPLAY_WINDOW = 10000
const TRANSITION_DURATION = 3000
const EARLY_SUBMIT_RATIO = 0.3
const SILENCE_THRESHOLD = 15 // seconds of no new speech before warning

interface Props {
  question: Question
  index: number
  total: number
  onSubmit: (answer: string) => void
}

export function QuestionScreen({ question, index, total, onSubmit }: Props) {
  const [showTransition, setShowTransition] = useState(true)
  const [replayAvailable, setReplayAvailable] = useState(false)
  const [canSubmit, setCanSubmit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [flowStarted, setFlowStarted] = useState(false)

  // confirmation dialog state
  const [showConfirm, setShowConfirm] = useState(false)

  // warnings
  const [emptyTranscriptWarning, setEmptyTranscriptWarning] = useState(false)
  const [silenceWarning, setSilenceWarning] = useState(false)
  const [show30sToast, setShow30sToast] = useState(false)

  // track when we last saw new speech for silence detection
  const lastSpeechRef = useRef<number>(0)

  const stt = useSpeechRecognition()
  const tts = useSpeechSynthesis()
  const onSubmitRef = useRef(onSubmit)
  onSubmitRef.current = onSubmit
  const transcriptRef = useRef('')

  const questionText = question.questions?.question || 'No question text available'
  const duration = question.q_timer > 0 ? question.q_timer : DEFAULT_TIMER

  useEffect(() => {
    transcriptRef.current = stt.transcript
    // whenever transcript changes, record it as recent speech
    if (stt.transcript.trim()) {
      lastSpeechRef.current = Date.now()
      setSilenceWarning(false)
    }
  }, [stt.transcript])

  // auto-submit on timer expire
  const handleExpire = useCallback(() => {
    stt.stop()
    onSubmitRef.current(transcriptRef.current || '(no answer)')
  }, [stt])

  const timer = useTimer(duration, handleExpire)

  // show submit button after 30% elapsed
  useEffect(() => {
    if (!timer.running) return
    const elapsed = duration - timer.timeLeft
    if (elapsed >= duration * EARLY_SUBMIT_RATIO) setCanSubmit(true)
  }, [timer.timeLeft, timer.running, duration])

  // warn at 50% if transcript is still empty
  useEffect(() => {
    if (!timer.running) return
    const elapsed = duration - timer.timeLeft
    if (elapsed >= duration * 0.5 && !stt.transcript.trim() && !emptyTranscriptWarning) {
      setEmptyTranscriptWarning(true)
    }
    if (stt.transcript.trim()) setEmptyTranscriptWarning(false)
  }, [timer.timeLeft, timer.running, duration, stt.transcript, emptyTranscriptWarning])

  // show toast when 30 seconds remain
  useEffect(() => {
    if (!timer.running) return
    if (timer.timeLeft === 30 && !show30sToast) setShow30sToast(true)
  }, [timer.timeLeft, timer.running, show30sToast])

  // silence detection — warn if no new speech for SILENCE_THRESHOLD seconds
  useEffect(() => {
    if (!timer.running || !stt.isListening) return

    const check = setInterval(() => {
      const gap = (Date.now() - lastSpeechRef.current) / 1000
      if (gap >= SILENCE_THRESHOLD && lastSpeechRef.current > 0) {
        setSilenceWarning(true)
      }
    }, 3000)

    return () => clearInterval(check)
  }, [timer.running, stt.isListening])

  // transition -> TTS -> start recording
  useEffect(() => {
    const timeout = setTimeout(async () => {
      setShowTransition(false)
      setFlowStarted(true)

      await tts.speak(questionText)

      setReplayAvailable(true)
      setTimeout(() => setReplayAvailable(false), REPLAY_WINDOW)

      lastSpeechRef.current = Date.now()
      await stt.start()
      timer.start()
    }, TRANSITION_DURATION)

    return () => {
      clearTimeout(timeout)
      tts.cancel()
      stt.stop()
      timer.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id])

  // keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // R to replay during replay window
      if (e.key === 'r' && replayAvailable && !tts.isSpeaking) {
        tts.speak(questionText)
      }
      // Enter to submit when allowed
      if (e.key === 'Enter' && canSubmit && !submitting && !showConfirm) {
        setShowConfirm(true)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [replayAvailable, canSubmit, submitting, showConfirm, tts, questionText])

  // user clicked submit -> show confirmation dialog
  const handleSubmitClick = () => {
    if (submitting) return
    setShowConfirm(true)
  }

  // confirmed submission
  const handleConfirm = () => {
    setShowConfirm(false)
    setSubmitting(true)
    timer.stop()
    stt.stop()
    onSubmitRef.current(stt.transcript || '(no answer)')
  }

  const handleReplay = () => { tts.speak(questionText) }

  return (
    <>
      <TransitionOverlay text={`Question ${index + 1}`} visible={showTransition} />

      {/* confirmation dialog before submitting */}
      {showConfirm && (
        <ConfirmDialog
          title="Submit your answer?"
          message={stt.transcript ? `"${stt.transcript.slice(0, 120)}${stt.transcript.length > 120 ? '...' : ''}"` : 'No answer recorded yet.'}
          confirmLabel="Submit"
          cancelLabel="Keep talking"
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {/* last 30 seconds warning toast */}
      {show30sToast && (
        <Toast
          message="30 seconds remaining"
          type="warning"
          duration={4000}
          onDismiss={() => setShow30sToast(false)}
        />
      )}

      <section className="flex min-h-screen w-full items-center justify-center p-8" role="main" aria-label={`Question ${index + 1} of ${total}`}>
        <div className="glass-card mx-auto w-full max-w-[640px] animate-slide-up">
          {/* header */}
          <div className="mb-6">
            <div className="flex items-center justify-between pb-3">
              <span className="text-sm text-text-secondary">
                Question {index + 1} / {total}
              </span>
              <span
                className={`font-mono text-2xl font-bold transition-colors ${
                  timer.isWarning ? 'animate-pulse-warning text-error' : 'text-text-primary'
                }`}
                aria-live="polite"
                aria-label={`${timer.formatted} remaining`}
              >
                {timer.formatted}
              </span>
            </div>
            {/* time progress bar — fills left to right as time elapses */}
            <div className="h-1 w-full overflow-hidden rounded-full bg-secondary/40">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                  timer.isWarning ? 'bg-error' : 'bg-accent'
                }`}
                style={{ width: `${((duration - timer.timeLeft) / duration) * 100}%` }}
              />
            </div>
          </div>

          {/* question text */}
          <p className="mb-6 text-xl leading-relaxed">{questionText}</p>

          {/* replay button */}
          {replayAvailable && (
            <button
              onClick={handleReplay}
              disabled={tts.isSpeaking}
              className="mb-6 rounded-lg border border-accent bg-card px-5 py-2 text-sm text-accent transition-colors hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Replay question"
            >
              &#9654; Replay <span className="ml-1 text-xs text-text-secondary">(R)</span>
            </button>
          )}

          {/* recording indicator with wave bars */}
          {stt.isListening && (
            <div className="mb-4 flex items-center gap-3 text-sm text-error" aria-live="polite">
              <span className="inline-block h-3 w-3 animate-pulse-rec rounded-full bg-error" />
              <span>Listening...</span>
              <div className="flex items-end gap-0.5">
                <span className="wave-bar" />
                <span className="wave-bar" />
                <span className="wave-bar" />
                <span className="wave-bar" />
                <span className="wave-bar" />
              </div>
            </div>
          )}

          {/* silence warning */}
          {silenceWarning && flowStarted && (
            <div className="mb-4 rounded-lg border border-warning bg-warning/10 p-3 text-sm text-warning" role="alert">
              Are you still there? We haven't heard anything for a while.
            </div>
          )}

          {/* empty transcript warning at 50% */}
          {emptyTranscriptWarning && flowStarted && !silenceWarning && (
            <div className="mb-4 rounded-lg border border-warning bg-warning/10 p-3 text-sm text-warning" role="alert">
              We can't hear you. Check your microphone.
            </div>
          )}

          {/* mic not supported */}
          {flowStarted && !stt.isSupported && (
            <div className="mb-6 rounded-lg border border-error bg-error/10 p-4 text-sm text-error" role="alert">
              Microphone access is required. Please allow microphone permission and reload.
            </div>
          )}

          {/* live transcript area */}
          <div className="mb-6 min-h-[3rem] rounded-lg border border-secondary/30 bg-card/50 p-4 text-sm italic text-text-secondary">
            {stt.transcript || (flowStarted ? 'Your answer will appear here...' : '')}
          </div>

          {/* submit button */}
          {canSubmit && (
            <button
              onClick={handleSubmitClick}
              disabled={submitting}
              className="rounded-lg bg-accent px-8 py-3 font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Submit answer"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Submitting...
                </span>
              ) : (
                <>Submit Answer <span className="ml-1 text-xs opacity-60">(Enter)</span></>
              )}
            </button>
          )}
        </div>
      </section>
    </>
  )
}
