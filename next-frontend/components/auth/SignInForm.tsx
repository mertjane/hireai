'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail } from 'lucide-react'
import { signIn } from '@/services/api/auth'
import InputField from './InputField'
import PasswordField from './PasswordField'
import GreenButton from './GreenButton'

export default function SignInForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, refreshToken, profile } = await signIn({ email, password })
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, refreshToken, profile }),
      })
      router.push('/dashboard')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Invalid email or password'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">Welcome back</h2>
        <p className="text-gray-500 text-sm mt-1">Sign in to your company dashboard</p>
      </div>

      <div className="flex flex-col gap-4">
        <InputField
          label="WORK EMAIL"
          icon={<Mail className="w-4 h-4" />}
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordField
          label="PASSWORD"
          placeholder="Enter your password"
          show={showPassword}
          onToggle={() => setShowPassword((p) => !p)}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && <p className="text-red-400 text-sm -mt-2">{error}</p>}

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-white/20 bg-white/5 accent-[#4ade80]"
          />
          Remember me
        </label>
        <button type="button" className="text-[#4ade80] hover:underline text-sm">
          Forgot password?
        </button>
      </div>

      <GreenButton disabled={loading}>
        {loading ? 'Signing in…' : 'Sign In to Dashboard'}
      </GreenButton>
    </form>
  )
}
