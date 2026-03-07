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
    <div className="group flex-1 bg-card rounded-xl border border-border p-5 relative overflow-hidden">
      {/* Top color bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${borderColor}`} />

      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
        <Icon className={`w-5 h-5 ${iconColor} group-hover:scale-110 transition-transform duration-200`} />
      </div>

      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-muted-foreground text-sm mb-3">{label}</div>
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
