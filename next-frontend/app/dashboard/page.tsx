"use client";

import { Briefcase, Users, Clock, Activity, Plus } from "lucide-react";
import StatCard from "@/components/layout/dashboard/StatCard";
import RecentActivity from "@/components/layout/dashboard/RecentActivity";
import QuickActions from "@/components/layout/dashboard/QuickActions";
import { useAuth } from "@/hooks/use-auth";

const STATS = [
  {
    icon: Briefcase,
    iconBg: "bg-[#4ade80]/10",
    iconColor: "text-[#4ade80]",
    borderColor: "bg-[#4ade80]",
    value: 12,
    label: "Active Job Posts",
    change: "+3 this month",
    changeType: "positive" as const,
  },
  {
    icon: Users,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    borderColor: "bg-blue-500",
    value: 248,
    label: "Total Applicants",
    change: "+31 this week",
    changeType: "positive" as const,
  },
  {
    icon: Clock,
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-400",
    borderColor: "bg-orange-500",
    value: 34,
    label: "Awaiting Interview",
    change: "-5 vs last week",
    changeType: "negative" as const,
  },
  {
    icon: Activity,
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    borderColor: "bg-purple-500",
    value: 89,
    label: "Interviews Completed",
    change: "+12 this week",
    changeType: "positive" as const,
  },
];

export default function DashboardPage() {
  const { company } = useAuth();
  return (
    <div className="flex flex-col gap-6">
      {/* Greeting row */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">Good morning, {company?.name}</h2>
          <p className="text-gray-500 text-sm mt-1">
            Here is what is happening with your hiring pipeline today.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-[#4ade80] text-[#0A0D12] text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#22c55e] transition-colors">
          <Plus className="w-4 h-4" />
          New Job Post
        </button>
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
        <QuickActions />
      </div>
    </div>
  );
}
