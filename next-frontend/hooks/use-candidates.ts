import useSWR from 'swr'
import type { Candidate } from '@/types/candidate'

export const useCandidates = (jobId?: string | null) => {
  const key = jobId ? `/candidates?job_id=${jobId}` : '/candidates'
  const { data, isLoading, mutate } = useSWR<Candidate[]>(key)
  return { candidates: data ?? [], isLoading, mutate }
}
