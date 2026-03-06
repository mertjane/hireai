'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { avatarColor } from '@/lib/colors'
import { UserPlus, MoreHorizontal, Crown, Mail } from 'lucide-react'

type Role = 'Admin' | 'Manager' | 'Viewer'

interface Member {
  id: string
  name: string
  email: string
  role: Role
  status: 'active' | 'invited'
}

const ROLE_STYLES: Record<Role, string> = {
  Admin:   'bg-[#4ade80]/10 text-[#4ade80]',
  Manager: 'bg-blue-400/10 text-blue-400',
  Viewer:  'bg-muted text-muted-foreground',
}

function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${ROLE_STYLES[role]}`}>
      {role === 'Admin' && <Crown className="w-2.5 h-2.5" />}
      {role}
    </span>
  )
}

export default function TeamPage() {
  const { company } = useAuth()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('Manager')
  const [showInvite, setShowInvite] = useState(false)

  // Placeholder members — replace with real API data when team endpoint is available
  const members: Member[] = company
    ? [{ id: company.id, name: company.name, email: company.email, role: 'Admin', status: 'active' }]
    : []

  const handleInvite = () => {
    if (!inviteEmail.trim()) return
    // TODO: call POST /team/invite with { email: inviteEmail, role: inviteRole }
    setInviteEmail('')
    setShowInvite(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground">Team Members</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-[#4ade80] text-[#0A0D12] font-semibold hover:bg-[#22c55e] transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Invite Member
          </button>
        </div>

        {/* Invite form */}
        {showInvite && (
          <div className="px-6 py-4 bg-muted/40 border-b border-border flex items-end gap-3">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground tracking-widest">EMAIL</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-[#4ade80]/40 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground tracking-widest">ROLE</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
                className="bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-[#4ade80]/40 transition-colors cursor-pointer"
              >
                <option value="Manager">Manager</option>
                <option value="Viewer">Viewer</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <button
              onClick={handleInvite}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-[#4ade80] text-[#0A0D12] font-semibold hover:bg-[#22c55e] transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              Send Invite
            </button>
            <button
              onClick={() => setShowInvite(false)}
              className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Members list */}
        {members.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No team members yet.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {members.map((m) => {
              const initials = m.name.slice(0, 2).toUpperCase()
              const color = avatarColor(m.id)
              return (
                <li key={m.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                  <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center text-foreground text-xs font-bold shrink-0`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-tight truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  </div>
                  <RoleBadge role={m.role} />
                  {m.status === 'invited' && (
                    <span className="text-[10px] text-amber-400 font-semibold px-2 py-0.5 rounded-full bg-amber-400/10">
                      Pending
                    </span>
                  )}
                  <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Roles info */}
      <section className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold text-foreground mb-4">Role Permissions</h3>
        <div className="grid grid-cols-3 gap-3">
          {([
            { role: 'Admin' as Role,   perms: ['Full access', 'Manage team', 'Billing', 'Delete account'] },
            { role: 'Manager' as Role, perms: ['Manage jobs', 'Manage applicants', 'Setup interviews', 'View results'] },
            { role: 'Viewer' as Role,  perms: ['View jobs', 'View applicants', 'View interviews'] },
          ]).map(({ role, perms }) => (
            <div key={role} className="bg-muted/40 border border-border rounded-xl p-4">
              <RoleBadge role={role} />
              <ul className="mt-3 flex flex-col gap-1.5">
                {perms.map((p) => (
                  <li key={p} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
