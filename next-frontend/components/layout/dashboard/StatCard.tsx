import { type LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  iconBg: string
  iconColor: string
  borderColor: string
  value: string | number
  label: string
  change: string
  changeType: 'positive' | 'negative'
}

export default function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  borderColor,
  value,
  label,
  change,
  changeType,
}: StatCardProps) {
  return (
    <div className="flex-1 bg-[#0D1117] rounded-xl border border-white/5 p-5 relative overflow-hidden">
      {/* Top color bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${borderColor}`} />

      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>

      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-gray-500 text-sm mb-3">{label}</div>
      <div
        className={`text-xs font-medium ${
          changeType === 'positive' ? 'text-[#4ade80]' : 'text-red-400'
        }`}
      >
        {change}
      </div>
    </div>
  )
}
