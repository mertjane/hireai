import useSWR from 'swr'
import type { Job } from '@/types/job'

export const useJobs = (companyId: string | null = null) => {
  const { data, isLoading, mutate } = useSWR<{ jobs: Job[] }>(
    companyId ? `/jobs?company_id=${companyId}` : null
  )
  return { jobs: data?.jobs ?? [], isLoading, mutate }
}
