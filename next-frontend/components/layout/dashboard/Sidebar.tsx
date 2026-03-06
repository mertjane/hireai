"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Bell,
  Mic,
  SlidersHorizontal,
  BarChart2,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useJobs } from "@/hooks/use-jobs";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { company } = useAuth();
  const { jobs } = useJobs(company?.id ?? null);

  const NAV = [
    {
      section: "MAIN",
      items: [
        { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
        {
          label: "Job Listings",
          href: "/dashboard/jobs",
          icon: Briefcase,
          badge: jobs.length,
        },
        {
          label: "Applicants",
          href: "/dashboard/applicants",
          icon: Users,
        },
        {
          label: "Notifications",
          href: "/dashboard/notifications",
          icon: Bell,
        },
      ],
    },
    {
      section: "INTERVIEWS",
      items: [
        {
          label: "Interview Setup",
          href: "/dashboard/interview-setup",
          icon: SlidersHorizontal,
        },
        {
          label: "Interviews",
          href: "/dashboard/interviews",
          icon: BarChart2,
        },
      ],
    },
    {
      section: "ACCOUNT",
      items: [
        { label: "Settings", href: "/dashboard/settings", icon: Settings },
      ],
    },
  ];

  const handleSignOut = async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/auth");
  };

  return (
    <aside className="w-[200px] shrink-0 bg-card border-r border-border flex flex-col py-5 px-3">
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 mb-6">
        <div className="w-8 h-8 bg-[#4ade80] rounded-lg flex items-center justify-center shrink-0">
          <Mic className="w-4 h-4 text-[#0A0D12]" />
        </div>
        <span className="font-semibold text-sm tracking-tight">
          Hire<span className="text-[#4ade80]">AI</span>
        </span>
      </div>

      {/* Company card */}
      <div className="flex items-center gap-2.5 bg-muted rounded-xl px-3 py-2.5 mb-6">
        <div className="w-8 h-8 rounded-lg bg-[#4ade80] flex items-center justify-center text-[#0A0D12] text-xs font-bold shrink-0">
          {company?.name?.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium leading-tight truncate">
            {company?.name ?? "—"}
          </div>
          <div className="text-[10px] text-[#4ade80] font-semibold tracking-widest mt-0.5">
            {company?.plan ?? ""}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-5 flex-1">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="text-[10px] text-muted-foreground tracking-widest font-medium px-2 mb-1.5">
              {group.section}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map(({ label, href, icon: Icon, badge }) => {
                const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`group flex items-center justify-between gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? "bg-[#4ade80]/10 text-[#4ade80]"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform duration-150" />
                        {label}
                      </span>
                      {!!badge && (
                        <span className="text-[10px] bg-muted text-muted-foreground font-medium px-1.5 py-0.5 rounded-full">
                          {badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="group flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mt-4"
      >
        <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" />
        Sign Out
      </button>
    </aside>
  );
}
