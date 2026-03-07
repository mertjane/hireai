'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, LineChart, Line, CartesianGrid,
} from 'recharts'
import { useAnalytics, type DateRange } from '@/hooks/use-analytics'

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  green:  '#4ade80',
  yellow: '#facc15',
  red:    '#f87171',
  blue:   '#60a5fa',
  purple: '#a78bfa',
  gray:   '#6b7280',
  grid:   'rgba(128,128,128,0.12)',
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
      {label && <p className="text-muted-foreground mb-1.5">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="font-semibold" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function ChartCard({
  title, subtitle, children, className = '',
}: {
  title: string; subtitle?: string; children: React.ReactNode; className?: string
}) {
  return (
    <div className={`bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 ${className}`}>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-muted rounded-xl animate-pulse ${className}`} />
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [range, setRange] = useState<DateRange>('90d')
  const { funnel, quality, scores, trend, departments, timeToHire, isLoading } = useAnalytics(range)

  const RANGES: { key: DateRange; label: string }[] = [
    { key: '30d',  label: 'Last 30 days' },
    { key: '90d',  label: 'Last 3 months' },
    { key: '180d', label: 'Last 6 months' },
    { key: 'all',  label: 'All time' },
  ]

  const funnelBars = funnel ? [
    { name: 'Applied',     value: funnel.total_applied, color: C.blue   },
    { name: 'Interviewed', value: funnel.interviewed,   color: C.purple },
    { name: 'Hired',       value: funnel.hired,         color: C.green  },
    { name: 'Dismissed',   value: funnel.dismissed,     color: C.red    },
  ] : []

  const donutData = quality ? [
    { name: 'Completed', value: quality.completed, color: C.green  },
    { name: 'Scheduled', value: quality.scheduled, color: C.blue   },
    { name: 'No Show',   value: quality.no_show,   color: C.red    },
    { name: 'Cancelled', value: quality.cancelled, color: C.yellow },
  ] : []

  const scoreBars = scores ? [
    { name: '70+',      value: scores.strong,     color: C.green  },
    { name: '50–69',    value: scores.average,    color: C.yellow },
    { name: '<50',      value: scores.weak,       color: C.red    },
    { name: 'Unscored', value: scores.not_scored, color: C.gray   },
  ] : []

  const trendData = trend.map((row) => ({
    week: new Date(row.week_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    Applications: row.applications,
    Hires: row.hires,
  }))

  const deptMax = departments.length > 0
    ? Math.max(...departments.map((d) => d.total_candidates))
    : 1

  return (
    <div className="flex flex-col gap-5 relative">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Analytics</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Hiring performance and pipeline insights</p>
        </div>
        <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                range === r.key
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Row 1: Hiring Funnel + Interview Quality ── */}
      <div className="grid grid-cols-12 gap-4">

        {/* Hiring Funnel */}
        <ChartCard
          title="Hiring Funnel"
          subtitle={funnel ? `Overall hire rate: ${funnel.hire_rate_pct}%` : undefined}
          className="col-span-7"
        >
          {isLoading || !funnel ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {funnelBars.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="w-20 text-right text-xs text-muted-foreground shrink-0">{item.name}</span>
                    <div className="flex-1 bg-muted rounded-full h-8 overflow-hidden">
                      <div
                        className="h-full rounded-full flex items-center px-3 transition-all"
                        style={{
                          width: `${Math.max((item.value / funnel.total_applied) * 100, 5)}%`,
                          backgroundColor: item.color + '28',
                          borderLeft: `3px solid ${item.color}`,
                        }}
                      >
                        <span className="text-xs font-bold" style={{ color: item.color }}>{item.value}</span>
                      </div>
                    </div>
                    <span className="w-9 text-right text-xs text-muted-foreground shrink-0">
                      {Math.round((item.value / funnel.total_applied) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Applied → Interviewed</span>
                  <span className="text-xs font-bold" style={{ color: C.purple }}>
                    {funnel.total_applied > 0 ? Math.round((funnel.interviewed / funnel.total_applied) * 100) : 0}%
                  </span>
                </div>
                <span className="text-border">·</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Interviewed → Hired</span>
                  <span className="text-xs font-bold" style={{ color: C.green }}>
                    {funnel.interviewed > 0 ? Math.round((funnel.hired / funnel.interviewed) * 100) : 0}%
                  </span>
                </div>
              </div>
            </>
          )}
        </ChartCard>

        {/* Interview Quality Donut */}
        <ChartCard
          title="Interview Quality"
          subtitle={quality ? `No-show rate: ${quality.no_show_rate_pct}%` : undefined}
          className="col-span-5"
        >
          {isLoading || !quality ? (
            <div className="flex items-center gap-5">
              <Skeleton className="w-[120px] h-[120px] rounded-full shrink-0" />
              <div className="flex flex-col gap-2 flex-1">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-4" />)}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-5">
              <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={38} outerRadius={56} strokeWidth={0} dataKey="value">
                      {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-bold text-foreground">{quality.completed}</span>
                  <span className="text-[9px] text-muted-foreground">done</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                {donutData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-xs text-muted-foreground truncate">{d.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-foreground shrink-0">{d.value}</span>
                  </div>
                ))}
                {quality.avg_satisfaction != null && (
                  <div className="mt-1 pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Satisfaction</span>
                    <span className="text-xs font-semibold" style={{ color: C.yellow }}>★ {quality.avg_satisfaction}/5</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Row 2: Weekly Trend ── */}
      <ChartCard title="Application Volume" subtitle="Weekly applications vs hires over time">
        {isLoading ? (
          <Skeleton className="h-[220px]" />
        ) : trendData.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center">
            <p className="text-xs text-muted-foreground">No trend data for this period</p>
          </div>
        ) : (
          <>
            {trendData.length === 1 && (
              <p className="text-[10px] text-muted-foreground -mb-2">Only one week of data — more weeks will build the trend line.</p>
            )}
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: C.gray }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: C.gray }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="Applications" stroke={C.blue} strokeWidth={2} dot={{ r: 3, fill: C.blue }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="Hires" stroke={C.green} strokeWidth={2} dot={{ r: 3, fill: C.green }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-0.5 rounded-full" style={{ backgroundColor: C.blue }} />
                <span className="text-xs text-muted-foreground">Applications</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-0.5 rounded-full" style={{ backgroundColor: C.green }} />
                <span className="text-xs text-muted-foreground">Hires</span>
              </div>
            </div>
          </>
        )}
      </ChartCard>

      {/* ── Row 3: Score Distribution + Department Performance ── */}
      <div className="grid grid-cols-12 gap-4">

        {/* Score Distribution */}
        <ChartCard
          title="Score Distribution"
          subtitle={scores ? `Avg: ${scores.avg_score ?? '—'} · Top: ${scores.top_score ?? '—'}` : undefined}
          className="col-span-5"
        >
          {isLoading || !scores ? (
            <Skeleton className="h-[180px]" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={scoreBars} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.gray }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: C.gray }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(128,128,128,0.06)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Candidates">
                  {scoreBars.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Department Performance */}
        <ChartCard
          title="Performance by Department"
          subtitle="Candidates · avg score · hire rate"
          className="col-span-7"
        >
          {isLoading || departments.length === 0 ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-7" />)}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {departments.map((dept) => (
                  <div key={dept.department} className="flex items-center gap-3">
                    <span className="w-24 text-right text-xs text-muted-foreground shrink-0 truncate">
                      {dept.department}
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-7 overflow-hidden">
                      <div
                        className="h-full rounded-full flex items-center px-3 transition-all"
                        style={{
                          width: `${Math.max((dept.total_candidates / deptMax) * 100, 8)}%`,
                          backgroundColor: C.green + '22',
                          borderLeft: `3px solid ${C.green}`,
                        }}
                      >
                        <span className="text-[10px] font-bold" style={{ color: C.green }}>
                          {dept.total_candidates}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] text-muted-foreground w-12 text-right">
                        avg {dept.avg_score ?? '—'}
                      </span>
                      <span
                        className="text-[10px] font-bold w-10 text-right"
                        style={{
                          color: dept.hire_rate_pct >= 12 ? C.green
                               : dept.hire_rate_pct >= 8  ? C.yellow
                               : C.red,
                        }}
                      >
                        {dept.hire_rate_pct}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border">
                <span>← candidate count</span>
                <span>avg score · hire rate →</span>
              </div>
            </>
          )}
        </ChartCard>
      </div>

      {/* ── Row 4: Time-to-Interview ── */}
      <div className="grid grid-cols-3 gap-4">
        {isLoading || !timeToHire ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : (
          [
            {
              label: 'Avg. Time to Interview',
              value: timeToHire.avg_days != null ? `${timeToHire.avg_days} days` : '—',
              color: C.blue,
              desc: 'From application to scheduled interview',
            },
            {
              label: 'Fastest Interview',
              value: timeToHire.fastest_days != null ? `${timeToHire.fastest_days} day` : '—',
              color: C.green,
              desc: 'Shortest time from apply to schedule',
            },
            {
              label: 'Slowest Interview',
              value: timeToHire.slowest_days != null ? `${timeToHire.slowest_days} days` : '—',
              color: C.red,
              desc: 'Longest wait in current pipeline',
            },
          ].map((card) => (
            <div key={card.label} className="bg-card border border-border rounded-2xl p-5">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="text-2xl font-bold mt-1.5" style={{ color: card.color }}>{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
            </div>
          ))
        )}
      </div>

    </div>
  )
}
