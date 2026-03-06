'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Users, Bell, Shield, CreditCard } from 'lucide-react'

const SETTINGS_NAV = [
  { label: 'Company Profile', href: '/dashboard/settings/profile', icon: Building2 },
  { label: 'Team Members',    href: '/dashboard/settings/team',    icon: Users },
  { label: 'Notifications',  href: '/dashboard/settings/notifications', icon: Bell },
  { label: 'Security',       href: '/dashboard/settings/security', icon: Shield },
  { label: 'Billing and Plan', href: '/dashboard/settings/billing', icon: CreditCard },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold">Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">Manage your company account and preferences</p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Settings sidebar nav */}
        <div className="w-52 shrink-0 bg-card border border-border rounded-2xl overflow-hidden">
          <ul className="flex flex-col py-1.5">
            {SETTINGS_NAV.map(({ label, href, icon: Icon }) => {
              const active = pathname === href
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      active
                        ? 'text-foreground font-medium bg-muted'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#4ade80]' : ''}`} />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}
