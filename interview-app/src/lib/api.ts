import type { Interview, Question } from '../types'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1'

// Generic fetch helper that throws on non-OK responses
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error || `Request failed (${res.status})`)
  }
  return res.json()
}

export function fetchInterview(token: string): Promise<Interview> {
  return request(`${API_BASE}/interviews/token/${token}`)
}

export function fetchQuestions(token: string): Promise<Question[]> {
  return request(`${API_BASE}/interview-questions/token/${token}`)
}

export function verifyPin(token: string, pin: string): Promise<{ verified: boolean }> {
  return request(`${API_BASE}/interviews/token/${token}/verify-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  })
}

export function submitAnswer(questionId: string, token: string, answer: string): Promise<Question> {
  return request(`${API_BASE}/interview-questions/${questionId}/answer`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, q_answer: answer }),
  })
}

export function completeInterview(token: string): Promise<Interview> {
  return request(`${API_BASE}/interviews/token/${token}/complete`, {
    method: 'POST',
  })
}

// Offline retry queue — stores failed answer submissions for later retry
interface QueuedAnswer {
  questionId: string
  token: string
  answer: string
}

const retryQueue: QueuedAnswer[] = []

// Add a failed answer to the retry queue
export function enqueueAnswer(questionId: string, token: string, answer: string) {
  retryQueue.push({ questionId, token, answer })
}

// Attempt to flush all queued answers — returns count of remaining failures
export async function flushQueue(): Promise<number> {
  const pending = [...retryQueue]
  retryQueue.length = 0

  for (const item of pending) {
    try {
      await submitAnswer(item.questionId, item.token, item.answer)
    } catch {
      // Still failing — re-queue for next attempt
      retryQueue.push(item)
    }
  }
  return retryQueue.length
}

export function getQueueLength(): number {
  return retryQueue.length
}
