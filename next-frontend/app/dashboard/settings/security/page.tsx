'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, ShieldCheck, Monitor, Smartphone, Globe } from 'lucide-react'

const inputCls = 'w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-[#4ade80]/40 transition-colors'

// ─── UA helpers ───────────────────────────────────────────────────────────────
function parseUA(ua: string) {
  const os =
    /Windows/.test(ua)     ? 'Windows' :
    /Mac OS X/.test(ua)    ? 'macOS'   :
    /iPhone|iPad/.test(ua) ? 'iOS'     :
    /Android/.test(ua)     ? 'Android' :
    /Linux/.test(ua)       ? 'Linux'   : 'Unknown OS'

  const device =
    /iPhone/.test(ua)  ? 'iPhone'         :
    /iPad/.test(ua)    ? 'iPad'           :
    /Android/.test(ua) ? 'Android Device' :
    os === 'macOS'     ? 'Mac'            :
    os === 'Windows'   ? 'PC'             : 'Device'

  const browser =
    /Edg\//.test(ua)     ? 'Edge'    :
    /OPR\//.test(ua)     ? 'Opera'   :
    /Chrome\//.test(ua)  ? 'Chrome'  :
    /Firefox\//.test(ua) ? 'Firefox' :
    /Safari\//.test(ua)  ? 'Safari'  : 'Browser'

  const key = browser === 'Edge' ? 'Edg' : browser
  const browserVersion = ua.match(new RegExp(`${key}\\/(\\d+)`))?.[1] ?? ''

  return { os, device, browser, browserVersion }
}

// ─── Password field ───────────────────────────────────────────────────────────
function PasswordField({ label, value, onChange, placeholder }: {
  label: string; value: string
  onChange: (v: string) => void; placeholder?: string
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

// ─── Password strength ────────────────────────────────────────────────────────
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

// ─── Types ────────────────────────────────────────────────────────────────────
interface SessionInfo {
  device: string; os: string; browser: string; browserVersion: string
  ip: string; city: string; country: string; loginTime: string | null
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SecurityPage() {
  const [current, setCurrent] = useState('')
  const [next, setNext]       = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')

  const [session, setSession]             = useState<SessionInfo | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)

  useEffect(() => {
    const { os, device, browser, browserVersion } = parseUA(navigator.userAgent)
    const loginTime = localStorage.getItem('hireai_login_time') ?? null

    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((geo) => setSession({
        device, os, browser, browserVersion,
        ip: geo.ip ?? '—',
        city: geo.city ?? '—',
        country: geo.country_name ?? '—',
        loginTime,
      }))
      .catch(() => setSession({
        device, os, browser, browserVersion,
        ip: '—', city: '—', country: '—', loginTime,
      }))
      .finally(() => setSessionLoading(false))
  }, [])

  const pw       = strength(next)
  const mismatch = confirm.length > 0 && next !== confirm

  const handleSave = async () => {
    setError('')
    if (!current || !next || !confirm) { setError('Please fill in all fields.'); return }
    if (next !== confirm)              { setError('New passwords do not match.'); return }
    if (next.length < 8)              { setError('Password must be at least 8 characters.'); return }
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

  const DeviceIcon = session?.os === 'iOS' || session?.os === 'Android' ? Smartphone : Monitor

  return (
    <div className="flex flex-col gap-5">

      {/* ── Change Password ── */}
      <section className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-[#4ade80]/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#4ade80]" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Change Password</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Use a strong, unique password you don't use elsewhere</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 max-w-sm">
          <PasswordField label="CURRENT PASSWORD" value={current} onChange={setCurrent} />
          <PasswordField label="NEW PASSWORD" value={next} onChange={setNext} />

          {next.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= pw.level ? pw.color : 'bg-muted'}`} />
                ))}
              </div>
              <p className={`text-[10px] font-semibold ${pw.color.replace('bg-', 'text-')}`}>{pw.label}</p>
            </div>
          )}

          <PasswordField label="CONFIRM NEW PASSWORD" value={confirm} onChange={setConfirm} />
          {mismatch && <p className="text-xs text-red-400">Passwords do not match</p>}
          {error    && <p className="text-xs text-red-400">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving || mismatch}
            className="w-full py-2.5 rounded-xl text-sm bg-[#4ade80] text-[#0A0D12] font-semibold hover:bg-[#22c55e] transition-colors disabled:opacity-50 mt-1"
          >
            {saved ? 'Password Updated!' : saving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </section>

      {/* ── Active Sessions ── */}
      <section className="bg-card border border-border rounded-2xl p-6">
        <div className="mb-5">
          <h3 className="font-semibold text-foreground">Active Sessions</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Devices currently signed into your account</p>
        </div>

        {sessionLoading ? (
          <div className="h-20 bg-muted/40 rounded-xl animate-pulse" />
        ) : session && (
          <div className="flex items-center gap-4 p-4 bg-muted/40 border border-border rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <DeviceIcon className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {session.device} — {session.browser} {session.browserVersion}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Globe className="w-3 h-3 shrink-0" />
                  {session.city}, {session.country}
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground font-mono">{session.ip}</span>
                {session.loginTime && (
                  <>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      Signed in {new Date(session.loginTime).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>

            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#4ade80]/10 text-[#4ade80] shrink-0">
              Current
            </span>
          </div>
        )}
      </section>
    </div>
  )
}
