import { Plus, Mail, BarChart2 } from 'lucide-react'

const ACTIONS = [
  {
    icon: Plus,
    iconBg: 'bg-[#4ade80]/10',
    iconColor: 'text-[#4ade80]',
    label: 'Create Job Post',
    description: 'Add a new vacancy',
  },
  {
    icon: Mail,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    label: 'Send Invite Links',
    description: 'Invite candidates to interview',
  },
  {
    icon: BarChart2,
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-400',
    label: 'Review Results',
    description: '89 completed interviews',
  },
]

export default function QuickActions() {
  return (
    <div className="bg-[#0D1117] border border-white/5 rounded-xl p-5">
      <h2 className="font-semibold mb-4">Quick Actions</h2>
      <ul className="flex flex-col gap-2">
        {ACTIONS.map(({ icon: Icon, iconBg, iconColor, label, description }) => (
          <li key={label}>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/8 border border-white/5 hover:border-white/10 transition-colors text-left">
              <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
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
