export type WorkType = 'remote' | 'hybrid' | 'on-site';
export type JobStatus = 'draft' | 'active' | 'closed';

export interface Company {
  id: string;
  name: string;
}

export interface Job {
  id: string;
  company_id: string;
  title: string;
  department: string;
  location: string;
  work_type: WorkType;
  status: JobStatus;
  description: string;
  created_at: string;
  updated_at: string;
  companies?: Company;
}

export interface FilterState {
  workTypes: WorkType[];
  departments: string[];
  locations: string[];
}
