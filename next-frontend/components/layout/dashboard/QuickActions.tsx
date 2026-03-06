'use client'

import { useRouter } from 'next/navigation'
import { Plus, SlidersHorizontal, BarChart2 } from 'lucide-react'

interface Props {
  onCreateJob: () => void
  completedCount: number
}

export default function QuickActions({ onCreateJob, completedCount }: Props) {
  const router = useRouter()

  const ACTIONS = [
    {
      icon: Plus,
      iconBg: 'bg-[#4ade80]/10',
      iconColor: 'text-[#4ade80]',
      label: 'Create Job Post',
      description: 'Add a new vacancy',
      onClick: onCreateJob,
    },
    {
      icon: SlidersHorizontal,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      label: 'Setup Interview',
      description: 'Configure and send interview links',
      onClick: () => router.push('/dashboard/interview-setup'),
    },
    {
      icon: BarChart2,
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
      label: 'Review Results',
      description: `${completedCount} completed interview${completedCount !== 1 ? 's' : ''}`,
      onClick: () => router.push('/dashboard/results'),
    },
  ]

  return (
    <div className="bg-[#0D1117] border border-white/5 rounded-xl p-5">
      <h2 className="font-semibold mb-4">Quick Actions</h2>
      <ul className="flex flex-col gap-2">
        {ACTIONS.map(({ icon: Icon, iconBg, iconColor, label, description, onClick }) => (
          <li key={label}>
            <button
              onClick={onClick}
              className="group w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/[0.08] border border-white/5 hover:border-white/10 transition-colors text-left"
            >
              <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${iconColor} group-hover:scale-110 transition-transform duration-200`} />
              </div>
              <div>
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{description}</div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
