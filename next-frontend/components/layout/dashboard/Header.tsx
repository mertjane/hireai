'use client'

import { useAuth } from '@/hooks/use-auth'
import { Search, Bell } from 'lucide-react'


export default function Header() {
  const { company } = useAuth()
  return (
    <header className="h-14 shrink-0 border-b border-white/5 flex items-center justify-end px-6">
      <div className="flex items-center gap-3">
        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <Search className="w-4 h-4" />
        </button>
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
        </button>
        <div className="flex items-center gap-2 ml-1">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-[11px] font-bold">
            {company?.name?.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-sm text-gray-300">{company?.name}</span>
        </div>
      </div>
    </header>
  )
}
