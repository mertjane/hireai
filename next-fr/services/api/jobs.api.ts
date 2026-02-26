import { Job } from "@/types/job";
import { apiInstance } from "../config/axios.config";

interface JobsResponse {
  jobs: Job[];
}

export const fetchJobs = async (): Promise<Job[]> => {
  const response = await apiInstance.get<JobsResponse>("/jobs");

  return response.data.jobs;
};

export const fetchJobById = async (id: string): Promise<Job> => {
  const response = await apiInstance.get<{ jobs: Job }>(`/jobs/${id}`);

  return response.data.jobs;
};
