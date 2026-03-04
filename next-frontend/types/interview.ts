export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

export interface Interview {
  id: string
  company_id: string
  candidate_id: string
  job_id: string
  scheduled_at: string
  duration_minutes: number
  token: string
  token_revoke: boolean
  access_link: string
  final_score: number
  status: InterviewStatus
  created_at: string
}
