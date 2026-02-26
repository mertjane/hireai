import { apiInstance } from '../config/axios.config';

interface ApplyParams {
  company_id: string;
  job_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  cv_file?: File | null;
  job_title?: string;
  company_name?: string;
}

export const applyToJob = async (params: ApplyParams): Promise<void> => {
  const formData = new FormData();
  formData.append('company_id', params.company_id);
  formData.append('job_id', params.job_id);
  formData.append('first_name', params.first_name);
  formData.append('last_name', params.last_name);
  formData.append('email', params.email);
  formData.append('phone', params.phone);
  if (params.cv_file) {
    formData.append('cv', params.cv_file);
  }
  if (params.job_title) formData.append('job_title', params.job_title);
  if (params.company_name) formData.append('company_name', params.company_name);

  await apiInstance.post('/candidates', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
