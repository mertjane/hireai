import useSWR from 'swr'
import type { Question } from '@/types/question'

// fetch all questions from the bank — supports mutate for refresh after create
export const useQuestions = () => {
  const { data, isLoading, error, mutate } = useSWR<Question[]>('/questions')
  return {
    questions: data ?? [],
    isLoading,
    error: error ? (error?.message ?? 'Failed to load questions') : null,
    mutate,
  }
}
