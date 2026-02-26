export type CandidateStatus = 'pending' | 'in_progress' | 'dismissed';

export interface Candidate {
  id: string;
  company_id: string;
  job_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  cv_url: string | null;
  status: CandidateStatus;
  agg_score: number;
  applied_at: string;
}

export interface CandidateFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  cv_file: File | null;
}

export const INITIAL_FORM_DATA: CandidateFormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  cv_file: null,
};
