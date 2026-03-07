import Sidebar from '@/components/layout/dashboard/Sidebar'
import Header from '@/components/layout/dashboard/Header'
import SessionGuard from '@/components/layout/dashboard/SessionGuard'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen overflow-hidden flex bg-background text-foreground">
      <SessionGuard />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
