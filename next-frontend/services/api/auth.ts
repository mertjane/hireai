import { apiInstance } from '../config/axios.config'
import type { AuthResponse, SignInData, SignUpData } from '@/types/company'

export async function signIn(data: SignInData): Promise<AuthResponse> {
  const res = await apiInstance.post<AuthResponse>('/auth/login', data)
  return res.data
}

export async function signUp(data: SignUpData): Promise<AuthResponse> {
  await apiInstance.post('/auth/register', data)
  // Backend register doesn't return a token — sign in immediately after
  return signIn({ email: data.email, password: data.password })
}
