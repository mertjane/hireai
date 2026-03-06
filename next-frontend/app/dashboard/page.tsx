'use client'

import { useState, useMemo } from 'react'
import { Briefcase, Users, Clock, Activity } from 'lucide-react'
import StatCard from '@/components/layout/dashboard/StatCard'
import RecentActivity from '@/components/layout/dashboard/RecentActivity'
import QuickActions from '@/components/layout/dashboard/QuickActions'
import JobModal from '@/components/layout/dashboard/JobModal'
import { useAuth } from '@/hooks/use-auth'
import { useJobs } from '@/hooks/use-jobs'
import { useCandidates } from '@/hooks/use-candidates'
import { useInterviews } from '@/hooks/use-interviews'

export default function DashboardPage() {
  const { company } = useAuth()
  const { jobs, mutate: mutateJobs } = useJobs(company?.id ?? null)
  const { candidates } = useCandidates()
  const { interviews } = useInterviews()

  const [jobModalOpen, setJobModalOpen] = useState(false)

  const activeJobs = useMemo(() => jobs.filter((j) => j.status === 'active').length, [jobs])
  const totalApplicants = candidates.length
  const awaitingInterview = useMemo(() => candidates.filter((c) => c.status === 'in_progress').length, [candidates])
  const completedInterviews = useMemo(() => interviews.filter((i) => i.status === 'completed').length, [interviews])

  const STATS = [
    {
      icon: Briefcase,
      iconBg: 'bg-[#4ade80]/10',
      iconColor: 'text-[#4ade80]',
      borderColor: 'bg-[#4ade80]',
      value: activeJobs,
      label: 'Active Job Posts',
      change: `${jobs.length} total`,
      changeType: 'positive' as const,
    },
    {
      icon: Users,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      borderColor: 'bg-blue-500',
      value: totalApplicants,
      label: 'Total Applicants',
      change: `${candidates.filter((c) => c.status === 'pending').length} pending invite`,
      changeType: 'positive' as const,
    },
    {
      icon: Clock,
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-400',
      borderColor: 'bg-orange-500',
      value: awaitingInterview,
      label: 'Awaiting Interview',
      change: 'interview link sent',
      changeType: 'negative' as const,
    },
    {
      icon: Activity,
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
      borderColor: 'bg-purple-500',
      value: completedInterviews,
      label: 'Interviews Completed',
      change: `${interviews.length} total scheduled`,
      changeType: 'positive' as const,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting row */}
      <div>
        <h2 className="text-xl font-bold">Good morning, {company?.name}</h2>
        <p className="text-gray-500 text-sm mt-1">
          Here is what is happening with your hiring pipeline today.
        </p>
      </div>

      {/* Stats row */}
      <div className="flex gap-4">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-[1fr_280px] gap-4">
        <RecentActivity />
        <QuickActions
          onCreateJob={() => setJobModalOpen(true)}
          completedCount={completedInterviews}
        />
      </div>

      {jobModalOpen && (
        <JobModal
          onClose={() => setJobModalOpen(false)}
          onSuccess={() => { mutateJobs(); setJobModalOpen(false) }}
        />
      )}
    </div>
  )
}
