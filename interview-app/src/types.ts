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
  final_score: number | null
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  created_at: string
  // optional fields the backend may return via joins
  candidate_name?: string
  company_name?: string
  job_title?: string
}

export interface Question {
  id: string
  interview_id: string
  question_id: string
  q_timer: number
  q_answer: string | null
  questions: {
    id: string
    question: string
  }
}

export type Screen =
  | 'loading'
  | 'error'
  | 'too-early'
  | 'too-late'
  | 'welcome'
  | 'waiting'
  | 'verified'
  | 'mic-test'
  | 'break'
  | 'question'
  | 'completed'
