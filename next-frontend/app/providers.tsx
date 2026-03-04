'use client'

import { SWRConfig } from 'swr'
import { fetcher } from '@/lib/swr'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ fetcher, revalidateOnFocus: false, shouldRetryOnError: false }}>
      {children}
    </SWRConfig>
  )
}
