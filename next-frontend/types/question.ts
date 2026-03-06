export interface Question {
  id: string
  question: string
  category: string
  company_id?: string | null
  is_temporary?: boolean
}
