import { apiInstance } from '@/services/config/axios.config'

export const fetcher = (url: string) => apiInstance.get(url).then((r) => r.data)
