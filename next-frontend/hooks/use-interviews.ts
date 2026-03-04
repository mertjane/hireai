import useSWR from 'swr'
import type { Interview } from '@/types/interview'

// fetch interviews — optionally filtered by job
export const useInterviews = (jobId?: string | null) => {
  const key = jobId ? `/interviews?job_id=${jobId}` : '/interviews'
  const { data, isLoading, mutate } = useSWR<Interview[]>(key)
  return { interviews: data ?? [], isLoading, mutate }
}
