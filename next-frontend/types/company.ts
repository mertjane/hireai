export interface Company {
  id: string
  name: string
  email: string
  firebase_uuid: string
  plan?: string
  created_at?: string
}

export interface AuthResponse {
  profile: Company
  token: string
}

export interface SignInData {
  email: string
  password: string
}

export interface SignUpData {
  name: string
  email: string
  password: string
}
