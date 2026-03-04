import useSWR from 'swr'
import type { Company } from '@/types/company'

// Must use plain fetch — /api/auth/me is a Next.js route, not the backend API
const localFetcher = (url: string) => fetch(url).then((r) => r.json())

export const useAuth = () => {
  const { data, isLoading } = useSWR<Company>('/api/auth/me', localFetcher)
  return { company: data ?? null, isLoading }
}
