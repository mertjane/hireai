'use client'

import { useAuth } from '@/hooks/use-auth'
import NotificationsDropdown from './NotificationsDropdown'


export default function Header() {
  const { company } = useAuth()
  return (
    <header className="h-14 shrink-0 border-b border-white/5 flex items-center justify-end px-6">
      <div className="flex items-center gap-3">
        <NotificationsDropdown />
        <div className="flex items-center gap-2 ml-1">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-[11px] font-bold hover:ring-2 hover:ring-[#4ade80]/50 transition-all duration-200 cursor-default">
            {company?.name?.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-sm text-gray-300">{company?.name}</span>
        </div>
      </div>
    </header>
  )
}
