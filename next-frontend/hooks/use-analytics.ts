import useSWR from 'swr'

// ─── Response types (match Supabase view columns) ─────────────────────────────

export interface AnalyticsFunnel {
  company_id: string
  total_applied: number
  interviewed: number
  hired: number
  dismissed: number
  hire_rate_pct: number
}

export interface AnalyticsQuality {
  company_id: string
  completed: number
  no_show: number
  cancelled: number
  scheduled: number
  no_show_rate_pct: number
  avg_satisfaction: number | null
}

export interface AnalyticsScores {
  company_id: string
  strong: number
  average: number
  weak: number
  not_scored: number
  avg_score: number | null
  top_score: number | null
}

export interface AnalyticsTrendRow {
  company_id: string
  week_start: string
  applications: number
  hires: number
}

export interface AnalyticsDepartmentRow {
  company_id: string
  department: string
  total_candidates: number
  hired: number
  avg_score: number | null
  no_shows: number
  hire_rate_pct: number
}

export interface AnalyticsTimeToHire {
  company_id: string
  avg_days: number | null
  fastest_days: number | null
  slowest_days: number | null
}

export type DateRange = '30d' | '90d' | '180d' | 'all'

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAnalytics = (range: DateRange = '90d') => {
  const { data: funnel, isLoading: l1 } =
    useSWR<AnalyticsFunnel>('/analytics/funnel')

  const { data: quality, isLoading: l2 } =
    useSWR<AnalyticsQuality>('/analytics/quality')

  const { data: scores, isLoading: l3 } =
    useSWR<AnalyticsScores>('/analytics/scores')

  const { data: trend, isLoading: l4 } =
    useSWR<AnalyticsTrendRow[]>(`/analytics/trend?range=${range}`)

  const { data: departments, isLoading: l5 } =
    useSWR<AnalyticsDepartmentRow[]>('/analytics/departments')

  const { data: timeToHire, isLoading: l6 } =
    useSWR<AnalyticsTimeToHire>('/analytics/time-to-hire')

  return {
    funnel:      funnel ?? null,
    quality:     quality ?? null,
    scores:      scores ?? null,
    trend:       trend ?? [],
    departments: departments ?? [],
    timeToHire:  timeToHire ?? null,
    isLoading: l1 || l2 || l3 || l4 || l5 || l6,
  }
}
