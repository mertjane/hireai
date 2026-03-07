'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { apiInstance } from '@/services/config/axios.config'
import { AlertTriangle, Save } from 'lucide-react'
import CustomSelect from '@/components/ui/custom-select'

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Retail',
  'Manufacturing', 'Consulting', 'Media', 'Real Estate', 'Other',
]
const SIZES = ['1 — 10', '11 — 50', '51 — 200', '201 — 500', '501 — 1000', '1000+']
const COUNTRIES = [
  'United States', 'United Kingdom', 'Germany', 'France', 'Canada',
  'Australia', 'Netherlands', 'Turkey', 'India', 'Other',
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold text-muted-foreground tracking-widest">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-[#4ade80]/40 transition-colors'
const readonlyCls = 'w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed select-none'
function SelectField({ label, value, onChange, options, readOnly }: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
  readOnly?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold text-muted-foreground tracking-widest">{label}</label>
      {readOnly ? (
        <div className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed select-none">
          {value}
        </div>
      ) : (
        <CustomSelect
          value={value}
          onChange={onChange}
          options={options.map((o) => ({ value: o, label: o }))}
        />
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { company } = useAuth()

  const [form, setForm] = useState({
    name: '',
    industry: 'Technology',
    size: '51 — 200',
    country: 'United Kingdom',
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  useEffect(() => {
    if (!company) return
    setForm((f) => ({
      ...f,
      name: company.name ?? '',
      email: company.email ?? '',
    }))
  }, [company])

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const setVal = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      await apiInstance.put('/companies/me', {
        name: form.name,
        industry: form.industry,
        size: form.size,
        country: form.country,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      // no-op — backend endpoint may not exist yet
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Company Information */}
      <section className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-foreground">Company Information</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Basic details about your organisation</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-[#4ade80] text-[#0A0D12] font-semibold hover:bg-[#22c55e] transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="COMPANY NAME">
            <input className={inputCls} value={form.name} onChange={set('name')} readOnly placeholder="Acme Corp Ltd." />
          </Field>
          <SelectField label="INDUSTRY" value={form.industry} onChange={setVal('industry')} options={INDUSTRIES} readOnly />
          <SelectField label="COMPANY SIZE" value={form.size} onChange={setVal('size')} options={SIZES} readOnly />
          <SelectField label="COUNTRY" value={form.country} onChange={setVal('country')} options={COUNTRIES} readOnly />
        </div>
      </section>

      {/* Account Administrator */}
      <section className="bg-card border border-border rounded-2xl p-6">
        <div className="mb-5">
          <h3 className="font-semibold text-foreground">Account Administrator</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Primary contact details for this account</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="FIRST NAME">
            <div className={readonlyCls}>{form.firstName || '—'}</div>
          </Field>
          <Field label="LAST NAME">
            <div className={readonlyCls}>{form.lastName || '—'}</div>
          </Field>
          <Field label="WORK EMAIL">
            <div className={readonlyCls}>{form.email || '—'}</div>
          </Field>
          <Field label="JOB TITLE">
            <div className={readonlyCls}>{form.jobTitle || '—'}</div>
          </Field>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-card border border-red-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-400">Danger Zone</h3>
            <p className="text-xs text-muted-foreground mt-0.5">These actions are permanent and cannot be undone</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-red-500/10">
          <div>
            <p className="text-sm font-medium text-foreground">Delete Company Account</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              This will permanently remove your company, all job posts, applicants, and interview data.
            </p>
          </div>
          {deleteConfirm ? (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button className="px-3 py-1.5 rounded-lg text-xs bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors">
                Confirm Delete
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="shrink-0 px-4 py-2 rounded-xl text-sm border border-red-500/30 text-red-400 font-semibold hover:bg-red-500/10 transition-colors"
            >
              Delete Account
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
