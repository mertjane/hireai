import { useState, useEffect } from 'react'
import { apiInstance } from '@/services/config/axios.config'
import type { Question } from '@/types/question'

export const useQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    apiInstance
      .get<Question[]>('/questions')
      .then((r) => {
        setQuestions(Array.isArray(r.data) ? r.data : [])
      })
      .catch((err) => {
        setError(err?.response?.data?.error ?? err.message ?? 'Failed to load questions')
      })
      .finally(() => setIsLoading(false))
  }, [])

  return { questions, isLoading, error }
}
