import { useState, useRef, useCallback } from 'react'

// Extend Window for vendor-prefixed SpeechRecognition (Safari uses webkitSpeechRecognition)
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent {
  error: string
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as SpeechRecognitionConstructor | null
}

// Safari-safe speech recognition hook
// Safari requires getUserMedia() before SpeechRecognition.start() works
export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  // Track whether we should auto-restart on unexpected end
  const shouldListenRef = useRef(false)

  const isSupported = getSpeechRecognition() !== null

  // Request mic permission first (the Safari fix), then create and start recognition
  const start = useCallback(async () => {
    const Ctor = getSpeechRecognition()
    if (!Ctor) {
      setError('Speech recognition not supported')
      return
    }

    setError(null)
    setTranscript('')

    try {
      // Safari needs explicit getUserMedia before speech recognition works
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const recognition = new Ctor()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let text = ''
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript
        }
        setTranscript(text)
      }

      // Auto-restart if recognition stops while we still want it running
      recognition.onend = () => {
        if (shouldListenRef.current) {
          try {
            recognition.start()
          } catch {
            // Ignore — page might be navigating away
          }
        } else {
          setIsListening(false)
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // no-speech and aborted are normal during continuous listening
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setError(event.error)
        }
      }

      recognitionRef.current = recognition
      shouldListenRef.current = true
      recognition.start()
      setIsListening(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone access denied')
    }
  }, [])

  const stop = useCallback(() => {
    shouldListenRef.current = false

    if (recognitionRef.current) {
      // Detach onend so the auto-restart doesn't fire
      recognitionRef.current.onend = null
      try {
        recognitionRef.current.stop()
      } catch {
        // noop
      }
      recognitionRef.current = null
    }

    // Release the media stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }

    setIsListening(false)
  }, [])

  return { transcript, isListening, isSupported, error, start, stop, setTranscript }
}
