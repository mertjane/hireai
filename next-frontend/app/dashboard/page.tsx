'use client'

import { useMemo } from 'react'
import { Briefcase, Users, Clock, Activity, Plus } from 'lucide-react'
import Link from 'next/link'
import StatCard from '@/components/layout/dashboard/StatCard'
import RecentActivity from '@/components/layout/dashboard/RecentActivity'
import QuickActions from '@/components/layout/dashboard/QuickActions'
import { useAuth } from '@/hooks/use-auth'
import { useJobs } from '@/hooks/use-jobs'
import { useCandidates } from '@/hooks/use-candidates'
import { useInterviews } from '@/hooks/use-interviews'

export default function DashboardPage() {
  const { company } = useAuth()
  const { jobs } = useJobs(company?.id ?? null)
  const { candidates } = useCandidates()
  const { interviews } = useInterviews()

  // compute real stats from API data
  const stats = useMemo(() => {
    const activeJobs = jobs.filter((j) => j.status === 'active').length
    const totalApplicants = candidates.length
    const scheduled = interviews.filter((i) => i.status === 'scheduled').length
    const completed = interviews.filter((i) => i.status === 'completed').length
    return { activeJobs, totalApplicants, scheduled, completed }
  }, [jobs, candidates, interviews])

  // pick a time-appropriate greeting
  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const STATS = [
    {
      icon: Briefcase,
      iconBg: 'bg-[#4ade80]/10',
      iconColor: 'text-[#4ade80]',
      borderColor: 'bg-[#4ade80]',
      value: stats.activeJobs,
      label: 'Active Job Posts',
      change: `${jobs.length} total`,
      changeType: 'positive' as const,
    },
    {
      icon: Users,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      borderColor: 'bg-blue-500',
      value: stats.totalApplicants,
      label: 'Total Applicants',
      change: `across ${jobs.length} jobs`,
      changeType: 'positive' as const,
    },
    {
      icon: Clock,
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-400',
      borderColor: 'bg-orange-500',
      value: stats.scheduled,
      label: 'Scheduled Interviews',
      change: 'awaiting completion',
      changeType: 'positive' as const,
    },
    {
      icon: Activity,
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
      borderColor: 'bg-purple-500',
      value: stats.completed,
      label: 'Interviews Completed',
      change: `${interviews.length} total`,
      changeType: 'positive' as const,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* greeting row */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">{greeting}, {company?.name}</h2>
          <p className="text-gray-500 text-sm mt-1">
            Here is what is happening with your hiring pipeline today.
          </p>
        </div>
        <Link
          href="/dashboard/jobs"
          className="flex items-center gap-2 bg-[#4ade80] text-[#0A0D12] text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#22c55e] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Job Post
        </Link>
      </div>

      {/* stats row */}
      <div className="flex gap-4">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* bottom row */}
      <div className="grid grid-cols-[1fr_280px] gap-4">
        <RecentActivity />
        <QuickActions />
      </div>
    </div>
  )
}
