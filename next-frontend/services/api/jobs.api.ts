import type { Job, WorkType, JobStatus } from "@/types/job";
import { apiInstance } from "../config/axios.config";

interface JobsResponse {
  jobs: Job[];
}

export interface JobPayload {
  title: string;
  department: string;
  location: string;
  work_type: WorkType;
  status: JobStatus;
  description: string;
}

export const fetchJobs = async (): Promise<Job[]> => {
  const response = await apiInstance.get<JobsResponse>("/jobs");
  return response.data.jobs;
};

export const fetchJobById = async (id: string): Promise<Job> => {
  const response = await apiInstance.get<{ jobs: Job }>(`/jobs/${id}`);
  return response.data.jobs;
};

export const createJob = async (payload: JobPayload): Promise<Job> => {
  const response = await apiInstance.post<Job>("/jobs", payload);
  return response.data;
};

export const updateJob = async (id: string, payload: Partial<JobPayload>): Promise<Job> => {
  const response = await apiInstance.put<Job>(`/jobs/${id}`, payload);
  return response.data;
};
