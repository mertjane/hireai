'use client'

import { useState } from 'react'

interface NotifRow {
  id: string
  label: string
  description: string
  email: boolean
  inApp: boolean
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative w-9 h-5 rounded-full transition-colors ${value ? 'bg-[#4ade80]' : 'bg-muted'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </button>
  )
}

const INITIAL: NotifRow[] = [
  { id: 'new_application',   label: 'New Application',        description: 'When a candidate applies to a job listing',       email: true,  inApp: true  },
  { id: 'interview_done',    label: 'Interview Completed',     description: 'When a candidate finishes an AI interview',       email: true,  inApp: true  },
  { id: 'interview_sched',   label: 'Interview Scheduled',     description: 'Confirmation when you set up a new interview',    email: false, inApp: true  },
  { id: 'score_ready',       label: 'Score Available',         description: 'When AI scoring is complete for an interview',    email: true,  inApp: true  },
  { id: 'no_show',           label: 'Candidate No-Show',       description: 'When a candidate misses their interview',         email: true,  inApp: true  },
  { id: 'help_request',      label: 'Candidate Help Request',  description: 'When a candidate requests help during interview',  email: true,  inApp: true  },
  { id: 'weekly_digest',     label: 'Weekly Digest',           description: 'Weekly summary of hiring activity',               email: true,  inApp: false },
]

export default function NotificationsSettingsPage() {
  const [rows, setRows] = useState<NotifRow[]>(INITIAL)
  const [saved, setSaved] = useState(false)

  const toggle = (id: string, field: 'email' | 'inApp') => {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: !r[field] } : r))
  }

  const handleSave = () => {
    // TODO: persist to backend
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground">Notification Preferences</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Choose how you receive updates about your hiring activity</p>
          </div>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-sm bg-[#4ade80] text-[#0A0D12] font-semibold hover:bg-[#22c55e] transition-colors"
          >
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>

        {/* Column headers */}
        <div className="grid px-6 py-2.5 border-b border-border" style={{ gridTemplateColumns: '1fr 80px 80px' }}>
          <span className="text-[10px] font-semibold text-muted-foreground tracking-widest">EVENT</span>
          <span className="text-[10px] font-semibold text-muted-foreground tracking-widest text-center">EMAIL</span>
          <span className="text-[10px] font-semibold text-muted-foreground tracking-widest text-center">IN-APP</span>
        </div>

        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={row.id} className="grid items-center px-6 py-4 hover:bg-muted/30 transition-colors" style={{ gridTemplateColumns: '1fr 80px 80px' }}>
              <div>
                <p className="text-sm font-medium text-foreground">{row.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{row.description}</p>
              </div>
              <div className="flex justify-center">
                <Toggle value={row.email} onChange={() => toggle(row.id, 'email')} />
              </div>
              <div className="flex justify-center">
                <Toggle value={row.inApp} onChange={() => toggle(row.id, 'inApp')} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
