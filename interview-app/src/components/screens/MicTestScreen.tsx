import { useState, useEffect, useRef, useCallback } from 'react'
import { useSpeechRecognition } from '../../hooks/use-speech-recognition'
import { useTimer } from '../../hooks/use-timer'

const MIC_TEST_TIMEOUT = 300

interface Props {
  onComplete: () => void
}

export function MicTestScreen({ onComplete }: Props) {
  const [testStarted, setTestStarted] = useState(false)
  const [micPassed, setMicPassed] = useState(false)
  const { transcript, isListening, isSupported, error, start, stop } = useSpeechRecognition()
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const timer = useTimer(MIC_TEST_TIMEOUT, useCallback(() => {
    stop()
    onCompleteRef.current()
  }, [stop]))

  useEffect(() => {
    timer.start()
    return () => { timer.stop(); stop() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (transcript.trim().length > 0 && !micPassed) setMicPassed(true)
  }, [transcript, micPassed])

  // keyboard shortcut — Enter/Space to start test or start interview
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (!testStarted) {
          e.preventDefault()
          setTestStarted(true)
          start()
        } else if (micPassed || error) {
          e.preventDefault()
          timer.stop()
          stop()
          onCompleteRef.current()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [testStarted, micPassed, error, start, stop, timer])

  const handleStartTest = async () => {
    setTestStarted(true)
    await start()
  }

  const handleRetryMic = async () => { await start() }

  const handleStartInterview = () => {
    timer.stop()
    stop()
    onComplete()
  }

  const timerMinutes = String(Math.floor(timer.timeLeft / 60)).padStart(2, '0')
  const timerSeconds = String(timer.timeLeft % 60).padStart(2, '0')
  const timerDisplay = `Time remaining: ${timerMinutes}:${timerSeconds}`

  const isPermissionError = error === 'not-allowed' || error?.includes('denied') || error?.includes('Permission')

  return (
    <section className="flex min-h-screen w-full items-center justify-center p-8" role="main" aria-label="Microphone test">
      <div className="glass-card mx-auto w-full max-w-[640px] animate-slide-up text-center">
        <h1 className="mb-3 text-3xl font-bold">Welcome! Let's test your microphone</h1>
        <p className="text-sm text-text-secondary">
          Click "Start Test" and say a few words to make sure your mic is working.
        </p>

        {!testStarted && (
          <button
            onClick={handleStartTest}
            className="my-6 rounded-lg border-2 border-accent bg-card px-7 py-2.5 font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
            autoFocus
          >
            Start Test <span className="ml-1 text-xs opacity-60">(Enter)</span>
          </button>
        )}

        {testStarted && (
          <div className="my-6">
            <p className="mb-2 text-sm text-text-secondary">What we hear:</p>

            {isListening && (
              <div className="mb-3 flex items-end justify-center gap-1" aria-hidden="true">
                <span className="wave-bar" />
                <span className="wave-bar" />
                <span className="wave-bar" />
                <span className="wave-bar" />
                <span className="wave-bar" />
              </div>
            )}

            <div className="glass-card mb-4 min-h-[60px] text-left text-base italic text-text-primary">
              {transcript || (isListening ? 'Listening...' : '')}
            </div>

            {error && !isSupported && (
              <p className="min-h-[1.5em] text-sm font-semibold text-error" role="alert">
                Speech recognition not supported in this browser.
              </p>
            )}

            {isPermissionError && (
              <div className="mb-4 rounded-lg border border-error bg-error/10 p-4 text-sm text-error" role="alert">
                <p className="mb-2 font-semibold">Microphone access was denied.</p>
                <p className="mb-3 text-text-secondary">
                  Click the lock/camera icon in your address bar, allow microphone access, then click Retry.
                </p>
                <button
                  onClick={handleRetryMic}
                  className="rounded-lg border border-error bg-transparent px-5 py-1.5 text-sm font-semibold text-error transition-colors hover:bg-error hover:text-white"
                >
                  Retry Microphone
                </button>
              </div>
            )}

            {error && isSupported && !isPermissionError && (
              <p className="min-h-[1.5em] text-sm font-semibold text-error" role="alert">
                Could not start microphone. Please check permissions.
              </p>
            )}

            {micPassed && (
              <p className="min-h-[1.5em] text-sm font-semibold text-success" aria-live="polite">
                Microphone working!
              </p>
            )}
          </div>
        )}

        <p className="my-3 font-mono text-sm text-text-secondary">{timerDisplay}</p>

        <button
          onClick={handleStartInterview}
          disabled={!micPassed && !error && testStarted && isSupported}
          className="mt-2 rounded-lg bg-accent px-8 py-3 font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Start Interview <span className="ml-1 text-xs opacity-60">(Enter)</span>
        </button>
      </div>
    </section>
  )
}
