import useSWR from 'swr'
import type { InterviewQuestion } from '@/types/interview'

// fetch questions + answers for a specific interview
export const useInterviewQuestions = (interviewId: string | null) => {
  const key = interviewId ? `/interview-questions?interview_id=${interviewId}` : null
  const { data, isLoading, error } = useSWR<InterviewQuestion[]>(key)
  return { questions: data ?? [], isLoading, error }
}
