import AuthLeftPanel from '@/components/auth/AuthLeftPanel'
import AuthRightPanel from '@/components/auth/AuthRightPanel'

export default function AuthPage() {
  return (
    <div
      className="min-h-screen flex bg-[#0A0D12] text-white"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }}
    >
      <AuthLeftPanel />
      <AuthRightPanel />
    </div>
  )
}
