'use client'

import { useAuth } from '@/hooks/use-auth'
import { Check, Zap } from 'lucide-react'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    period: 'Free forever',
    features: [
      '3 active job listings',
      '50 applicants / month',
      '10 AI interviews / month',
      'Basic scoring',
      'Email support',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 49,
    period: 'per month',
    badge: 'Popular',
    features: [
      'Unlimited job listings',
      '500 applicants / month',
      '100 AI interviews / month',
      'Advanced AI scoring',
      'Team members (3)',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    period: 'Custom pricing',
    features: [
      'Everything in Growth',
      'Unlimited interviews',
      'Unlimited team members',
      'Custom voice & language',
      'SSO & advanced security',
      'Dedicated account manager',
    ],
  },
]

export default function BillingPage() {
  const { company } = useAuth()
  const currentPlan = (company?.plan ?? 'starter').toLowerCase()

  return (
    <div className="flex flex-col gap-5">
      {/* Current plan summary */}
      <section className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground tracking-widest mb-1">CURRENT PLAN</p>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground capitalize">{currentPlan} Plan</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4ade80]/10 text-[#4ade80]">Active</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Next billing cycle: April 1, 2026</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#4ade80]/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#4ade80]" />
          </div>
        </div>
      </section>

      {/* Plan cards */}
      <div className="grid grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const active = plan.id === currentPlan
          return (
            <div
              key={plan.id}
              className={`relative bg-card border rounded-2xl p-5 flex flex-col gap-4 transition-colors overflow-hidden ${
                active ? 'border-[#4ade80]/30' : 'border-border'
              }`}
            >
              {/* Top color bar for active */}
              {active && <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#4ade80]" />}

              {plan.badge && (
                <span className="absolute top-4 right-4 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#4ade80]/10 text-[#4ade80]">
                  {plan.badge}
                </span>
              )}

              <div>
                <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  {plan.price === null ? (
                    <span className="text-2xl font-bold text-foreground">Custom</span>
                  ) : plan.price === 0 ? (
                    <span className="text-2xl font-bold text-foreground">Free</span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-foreground">${plan.price}</span>
                      <span className="text-xs text-muted-foreground">/mo</span>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{plan.period}</p>
              </div>

              <ul className="flex flex-col gap-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-[#4ade80] shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {active ? (
                <div className="w-full py-2 rounded-xl text-xs font-semibold text-center bg-[#4ade80]/10 text-[#4ade80]">
                  Current Plan
                </div>
              ) : (
                <button className="w-full py-2 rounded-xl text-xs font-semibold border border-border text-foreground hover:border-[#4ade80]/30 hover:text-[#4ade80] transition-colors">
                  {plan.price === null ? 'Contact Sales' : 'Upgrade'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Billing history placeholder */}
      <section className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold text-foreground mb-4">Billing History</h3>
        <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
          No invoices yet.
        </div>
      </section>
    </div>
  )
}
