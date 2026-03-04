'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Building2 } from 'lucide-react'
import { type Plan } from './types'
import { signUp } from '@/services/api/auth'
import InputField from './InputField'
import PasswordField from './PasswordField'
import GreenButton from './GreenButton'

const PLANS: { key: Plan; name: string; price: string; badge?: string }[] = [
  { key: 'starter', name: 'STARTER', price: 'FREE' },
  { key: 'growth', name: 'GROWTH', price: '$49/MO', badge: 'POPULAR' },
  { key: 'enterprise', name: 'ENTERPRISE', price: 'CUSTOM' },
]

export default function SignUpForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan>('growth')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, profile } = await signUp({ name, email, password })
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, profile }),
      })
      router.push('/dashboard')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Something went wrong. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold">Create account</h2>
        <p className="text-gray-500 text-sm mt-1">Set up your company on InterviewAI</p>
      </div>

      <InputField
        label="COMPANY NAME"
        icon={<Building2 className="w-4 h-4" />}
        type="text"
        placeholder="Acme Corp Ltd."
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
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
        placeholder="Min. 8 characters"
        show={showPassword}
        onToggle={() => setShowPassword((p) => !p)}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div>
        <div className="text-xs text-gray-400 tracking-widest mb-2">SELECT PLAN</div>
        <div className="grid grid-cols-3 gap-2">
          {PLANS.map((plan) => (
            <button
              key={plan.key}
              type="button"
              onClick={() => setSelectedPlan(plan.key)}
              className={`relative flex flex-col items-center justify-center py-3 px-2 rounded-xl border text-center transition-all ${
                selectedPlan === plan.key
                  ? 'border-[#4ade80] bg-[#4ade80]/5'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#4ade80] text-[#0A0D12] text-[9px] font-bold px-2 py-0.5 rounded-full">
                  {plan.badge}
                </span>
              )}
              <span
                className={`text-xs font-bold ${
                  selectedPlan === plan.key ? 'text-[#4ade80]' : 'text-gray-300'
                }`}
              >
                {plan.name}
              </span>
              <span className="text-gray-400 text-[11px] mt-0.5">{plan.price}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <GreenButton disabled={loading}>
        {loading ? 'Creating account…' : 'Create Company Account'}
      </GreenButton>

      <p className="text-center text-gray-600 text-xs">
        By registering you agree to our{' '}
        <span className="text-[#4ade80] cursor-pointer hover:underline">Terms of Service</span>
        {' '}and{' '}
        <span className="text-[#4ade80] cursor-pointer hover:underline">Privacy Policy</span>
      </p>
    </form>
  )
}
