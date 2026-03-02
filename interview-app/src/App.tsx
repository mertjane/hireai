import { useState, useEffect, useCallback, useRef } from 'react'
import type { Interview, Question, Screen } from './types'
import { useCountdown } from './hooks/use-countdown'
import { useSessionState } from './hooks/use-session-state'
import * as api from './lib/api'
import { ConnectionBanner } from './components/ConnectionBanner'
import { ThemeToggle } from './components/ThemeToggle'
import { StepperBar } from './components/StepperBar'
import { CameraPreview } from './components/CameraPreview'

import { LoadingScreen } from './components/screens/LoadingScreen'
import { ErrorScreen } from './components/screens/ErrorScreen'
import { TooEarlyScreen } from './components/screens/TooEarlyScreen'
import { TooLateScreen } from './components/screens/TooLateScreen'
import { WelcomeScreen } from './components/screens/WelcomeScreen'
import { WaitingScreen } from './components/screens/WaitingScreen'
import { VerifiedScreen } from './components/screens/VerifiedScreen'
import { MicTestScreen } from './components/screens/MicTestScreen'
import { BreakScreen } from './components/screens/BreakScreen'
import { QuestionScreen } from './components/screens/QuestionScreen'
import { CompletedScreen } from './components/screens/CompletedScreen'

// quick browser check for the Web Speech API
function isSpeechSupported(): boolean {
  const w = window as unknown as Record<string, unknown>
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition)
}

// decide what the candidate should see based on how far we are from the scheduled time
function getTimeStatus(scheduledAt: string) {
  const diffSeconds = Math.floor((new Date(scheduledAt).getTime() - Date.now()) / 1000)
  if (diffSeconds > 3600) return 'too-early' as const
  if (diffSeconds < -600) return 'too-late' as const
  if (diffSeconds > 0) return 'waiting' as const
  return 'ready' as const
}

// escalating lockout after wrong PINs
const LOCKOUT_DURATIONS = [3, 10, 30]

// screens where the stepper progress bar should be visible
const STEPPER_SCREENS: Screen[] = ['question', 'break', 'completed']

// screens where leaving the page should show a warning
const ACTIVE_SCREENS: Screen[] = ['mic-test', 'question', 'break']

export default function App() {
  const [screen, setScreen] = useState<Screen>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [interview, setInterview] = useState<Interview | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [pinError, setPinError] = useState<string | null>(null)

  // brute-force protection
  const [pinAttempts, setPinAttempts] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState<number>(0)
  const [lockoutMsg, setLockoutMsg] = useState<string | null>(null)

  // persisted across page reloads via sessionStorage
  const [pinVerified, setPinVerified] = useSessionState('pinVerified', false)
  const [micTestPassed, setMicTestPassed] = useSessionState('micTestPassed', false)
  const [currentIndex, setCurrentIndex] = useSessionState('currentQuestionIndex', 0)
  const [welcomeSeen, setWelcomeSeen] = useSessionState('welcomeSeen', false)

  // extract token from URL on first visit, persist in sessionStorage for reloads
  const tokenRef = useRef<string | null>(null)
  if (tokenRef.current === null) {
    const urlToken = new URLSearchParams(window.location.search).get('token')
    if (urlToken) {
      // save for future reloads then clean the URL bar
      try { sessionStorage.setItem('interviewToken', urlToken) } catch { /* ignore */ }
      window.history.replaceState({}, '', window.location.pathname)
      tokenRef.current = urlToken
    } else {
      // no token in URL — check sessionStorage from a previous visit
      try { tokenRef.current = sessionStorage.getItem('interviewToken') } catch { /* ignore */ }
    }
  }
  const token = tokenRef.current

  const countdown = useCountdown(interview?.scheduled_at ?? null)

  // keep a ref to screen so the beforeunload handler always has the latest value
  const screenRef = useRef(screen)
  screenRef.current = screen

  // warn before closing the tab during an active interview
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (ACTIVE_SCREENS.includes(screenRef.current)) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // flush queued answers when the browser comes back online
  useEffect(() => {
    const handleOnline = () => { api.flushQueue() }
    window.addEventListener('online', handleOnline)

    // also retry every 30s in case connectivity is flaky
    const interval = setInterval(() => {
      if (navigator.onLine && api.getQueueLength() > 0) {
        api.flushQueue()
      }
    }, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      clearInterval(interval)
    }
  }, [])

  // load interview data on mount
  useEffect(() => {
    if (!token) {
      setErrorMsg('No interview token provided. Please use the link sent to your email.')
      setScreen('error')
      return
    }

    if (!isSpeechSupported()) {
      setErrorMsg('Please use Google Chrome for this interview. Your browser does not support speech recognition.')
      setScreen('error')
      return
    }

    let cancelled = false

    async function load() {
      try {
        const [interviewData, questionsData] = await Promise.all([
          api.fetchInterview(token!),
          api.fetchQuestions(token!),
        ])

        if (cancelled) return

        if (interviewData.token_revoke) {
          setErrorMsg('This interview link has been revoked. Please contact the hiring team.')
          setScreen('error')
          return
        }

        setInterview(interviewData)
        setQuestions(questionsData)

        if (interviewData.status === 'completed') {
          setScreen('completed')
          return
        }

        const timeStatus = getTimeStatus(interviewData.scheduled_at)

        if (timeStatus === 'too-early') { setScreen('too-early'); return }
        if (timeStatus === 'too-late') { setScreen('too-late'); return }

        const unanswered = questionsData.findIndex((q) => !q.q_answer)
        if (unanswered === -1) { setScreen('completed'); return }
        setCurrentIndex(unanswered)

        // show welcome screen on first visit
        if (!welcomeSeen) {
          setScreen('welcome')
          return
        }

        if (pinVerified) {
          setScreen(timeStatus === 'ready' ? (micTestPassed ? 'question' : 'mic-test') : 'verified')
        } else {
          setScreen('waiting')
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
          setScreen('error')
        }
      }
    }

    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // auto-advance when countdown hits zero and PIN is already verified
  useEffect(() => {
    if (!countdown.isReady || !pinVerified) return
    if (screen === 'verified' || screen === 'waiting') {
      setScreen(micTestPassed ? 'question' : 'mic-test')
    }
  }, [countdown.isReady, pinVerified, screen, micTestPassed])

  // show expired screen if the candidate waited too long
  useEffect(() => {
    if (countdown.isTooLate && (screen === 'waiting' || screen === 'verified')) {
      setScreen('too-late')
    }
  }, [countdown.isTooLate, screen])

  // clear lockout message once the cooldown period ends
  useEffect(() => {
    if (lockoutUntil <= Date.now()) return
    const timer = setTimeout(() => { setLockoutMsg(null) }, lockoutUntil - Date.now())
    return () => clearTimeout(timer)
  }, [lockoutUntil])

  // welcome screen continue handler
  const handleWelcomeContinue = useCallback(() => {
    setWelcomeSeen(true)
    if (pinVerified) {
      const timeStatus = interview ? getTimeStatus(interview.scheduled_at) : 'waiting'
      setScreen(timeStatus === 'ready' ? (micTestPassed ? 'question' : 'mic-test') : 'verified')
    } else {
      setScreen('waiting')
    }
  }, [setWelcomeSeen, pinVerified, interview, micTestPassed])

  // PIN verification with brute-force lockout
  const handlePinComplete = useCallback(async (pin: string) => {
    if (!token) return
    if (lockoutUntil > Date.now()) return

    try {
      await api.verifyPin(token, pin)
      setPinError(null)
      setPinAttempts(0)
      setPinVerified(true)

      if (interview && getTimeStatus(interview.scheduled_at) === 'ready') {
        setScreen(micTestPassed ? 'question' : 'mic-test')
      } else {
        setScreen('verified')
      }
    } catch (err) {
      const newAttempts = pinAttempts + 1
      setPinAttempts(newAttempts)

      if (newAttempts >= 3) {
        const tier = Math.min(newAttempts - 3, LOCKOUT_DURATIONS.length - 1)
        const duration = LOCKOUT_DURATIONS[tier]
        setLockoutUntil(Date.now() + duration * 1000)
        setLockoutMsg(`Too many attempts. Try again in ${duration}s.`)
        setPinError(null)
      } else {
        setPinError(err instanceof Error ? err.message : 'Invalid PIN')
      }
    }
  }, [token, interview, micTestPassed, setPinVerified, pinAttempts, lockoutUntil])

  const handleMicTestComplete = useCallback(() => {
    setMicTestPassed(true)
    setScreen('question')
  }, [setMicTestPassed])

  // submit answer then move to break or completion
  const handleAnswerSubmit = useCallback(async (answer: string) => {
    const q = questions[currentIndex]
    if (!q || !token) return

    try {
      await api.submitAnswer(q.id, token, answer)
      // mark it locally so the stepper shows a checkmark
      setQuestions((prev) => prev.map((item, i) => i === currentIndex ? { ...item, q_answer: answer } : item))
    } catch {
      api.enqueueAnswer(q.id, token, answer)
      // still mark locally for UI consistency
      setQuestions((prev) => prev.map((item, i) => i === currentIndex ? { ...item, q_answer: answer } : item))
    }

    const nextIndex = currentIndex + 1

    if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex)
      setScreen('break')
    } else {
      try { await api.completeInterview(token) } catch { /* will retry */ }
      setScreen('completed')
    }
  }, [questions, currentIndex, token, setCurrentIndex])

  const handleBreakComplete = useCallback(() => {
    setScreen('question')
  }, [])

  const isPinLocked = lockoutUntil > Date.now()
  const showStepper = STEPPER_SCREENS.includes(screen) && questions.length > 0
  // show camera toggle during the active interview portion
  const showCamera = ['mic-test', 'question', 'break'].includes(screen)

  return (
    <>
      <ThemeToggle />
      <ConnectionBanner />
      {showStepper && <StepperBar questions={questions} currentIndex={currentIndex} candidateName={interview?.candidate_name} />}
      {showCamera && <CameraPreview />}

      {/* extra top padding when stepper is visible so content doesn't hide behind it */}
      <div className={showStepper ? 'pt-14' : ''}>
        {(() => {
          switch (screen) {
            case 'loading':
              return <LoadingScreen />
            case 'error':
              return <ErrorScreen message={errorMsg} />
            case 'too-early':
              return <TooEarlyScreen scheduledAt={interview?.scheduled_at ?? ''} />
            case 'too-late':
              return <TooLateScreen />
            case 'welcome':
              return (
                <WelcomeScreen
                  questionCount={questions.length}
                  candidateName={interview?.candidate_name}
                  companyName={interview?.company_name}
                  jobTitle={interview?.job_title}
                  onContinue={handleWelcomeContinue}
                />
              )
            case 'waiting':
              return (
                <WaitingScreen
                  formatted={countdown.formatted}
                  onPinComplete={handlePinComplete}
                  pinError={lockoutMsg || pinError}
                  pinDisabled={isPinLocked}
                />
              )
            case 'verified':
              return <VerifiedScreen formatted={countdown.formatted} />
            case 'mic-test':
              return <MicTestScreen onComplete={handleMicTestComplete} />
            case 'break':
              return (
                <BreakScreen
                  nextIndex={currentIndex}
                  totalQuestions={questions.length}
                  onComplete={handleBreakComplete}
                />
              )
            case 'question':
              return (
                <QuestionScreen
                  key={questions[currentIndex]?.id}
                  question={questions[currentIndex]}
                  index={currentIndex}
                  total={questions.length}
                  onSubmit={handleAnswerSubmit}
                />
              )
            case 'completed':
              return <CompletedScreen />
          }
        })()}
      </div>
    </>
  )
}
