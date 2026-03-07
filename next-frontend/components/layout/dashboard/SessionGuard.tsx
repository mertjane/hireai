'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mic } from 'lucide-react'

export default function SessionGuard() {
  const router = useRouter()
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const handle = async () => {
      setExpired(true)
      // Clear server-side session cookies
      await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {})
      // Small delay so the user sees the overlay before redirect
      setTimeout(() => router.replace('/auth'), 1800)
    }

    window.addEventListener('auth:session-expired', handle)
    return () => window.removeEventListener('auth:session-expired', handle)
  }, [router])

  if (!expired) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-background/90 backdrop-blur-md flex flex-col items-center justify-center gap-5">
      {/* Logo mark */}
      <div className="w-12 h-12 bg-[#4ade80] rounded-2xl flex items-center justify-center">
        <Mic className="w-5 h-5 text-[#0A0D12]" />
      </div>

      {/* Spinner */}
      <div className="w-8 h-8 rounded-full border-2 border-border border-t-[#4ade80] animate-spin" />

      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">Session expired</p>
        <p className="text-xs text-muted-foreground mt-1">Redirecting you to sign in…</p>
      </div>
    </div>
  )
}
