'use client'

import { useState } from 'react'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'

const inputCls = 'w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-[#4ade80]/40 transition-colors'

function PasswordField({ label, value, onChange, placeholder }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold text-muted-foreground tracking-widest">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? '••••••••'}
          className={`${inputCls} pr-10`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

function strength(pw: string): { level: number; label: string; color: string } {
  if (!pw) return { level: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { level: score, label: 'Weak',   color: 'bg-red-400' }
  if (score === 2) return { level: score, label: 'Fair',   color: 'bg-amber-400' }
  if (score === 3) return { level: score, label: 'Good',   color: 'bg-blue-400' }
  return { level: score, label: 'Strong', color: 'bg-[#4ade80]' }
}

export default function SecurityPage() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const pw = strength(next)
  const mismatch = confirm.length > 0 && next !== confirm

  const handleSave = async () => {
    setError('')
    if (!current || !next || !confirm) { setError('Please fill in all fields.'); return }
    if (next !== confirm) { setError('New passwords do not match.'); return }
    if (next.length < 8) { setError('Password must be at least 8 characters.'); return }
    setSaving(true)
    try {
      // TODO: call PUT /auth/password with { currentPassword: current, newPassword: next }
      await new Promise((r) => setTimeout(r, 800))
      setSaved(true)
      setCurrent(''); setNext(''); setConfirm('')
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Failed to update password. Check your current password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Change Password */}
      <section className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-[#4ade80]/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4.5 h-4.5 text-[#4ade80]" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Change Password</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Use a strong, unique password you don't use elsewhere</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 max-w-sm">
          <PasswordField label="CURRENT PASSWORD" value={current} onChange={setCurrent} />
          <PasswordField label="NEW PASSWORD" value={next} onChange={setNext} />

          {/* Password strength bar */}
          {next.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1 rounded-full transition-all ${i <= pw.level ? pw.color : 'bg-muted'}`}
                  />
                ))}
              </div>
              <p className={`text-[10px] font-semibold ${pw.color.replace('bg-', 'text-')}`}>{pw.label}</p>
            </div>
          )}

          <PasswordField label="CONFIRM NEW PASSWORD" value={confirm} onChange={setConfirm} />
          {mismatch && <p className="text-xs text-red-400">Passwords do not match</p>}
          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving || mismatch}
            className="w-full py-2.5 rounded-xl text-sm bg-[#4ade80] text-[#0A0D12] font-semibold hover:bg-[#22c55e] transition-colors disabled:opacity-50 mt-1"
          >
            {saved ? 'Password Updated!' : saving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </section>

      {/* Active Sessions — placeholder */}
      <section className="bg-card border border-border rounded-2xl p-6">
        <div className="mb-5">
          <h3 className="font-semibold text-foreground">Active Sessions</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Devices currently signed into your account</p>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { device: 'MacBook Pro — Chrome', location: 'Istanbul, TR', current: true },
          ].map((s) => (
            <div key={s.device} className="flex items-center justify-between gap-4 p-4 bg-muted/40 border border-border rounded-xl">
              <div>
                <p className="text-sm font-medium text-foreground">{s.device}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.location}</p>
              </div>
              {s.current ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#4ade80]/10 text-[#4ade80]">Current</span>
              ) : (
                <button className="text-xs text-red-400 hover:text-red-500 transition-colors font-medium">Revoke</button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
