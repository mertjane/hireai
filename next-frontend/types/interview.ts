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
  feedback_rating: number | null
  feedback_comment: string | null
  ai_comment?: string | null
}

// a question assigned to an interview, with the candidate's answer
export interface InterviewQuestion {
  id: string
  interview_id: string
  question_id: string
  q_timer: number
  q_answer: string | null
  questions: {
    id: string
    question: string
    category: string
  }
}
