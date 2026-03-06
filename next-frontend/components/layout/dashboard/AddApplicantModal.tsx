'use client'

import { useState, useRef } from 'react'
import { X, Upload } from 'lucide-react'
import CustomSelect from '@/components/ui/custom-select'
import type { Job } from '@/types/job'

interface Props {
  companyId: string
  jobs: Job[]
  onClose: () => void
  onSuccess: () => void
}

export default function AddApplicantModal({ companyId, jobs, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', job_id: '' })
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.job_id) { setError('Please select a position'); return }
    setSaving(true)
    setError(null)

    const fd = new FormData()
    fd.append('company_id', companyId)
    fd.append('job_id', form.job_id)
    fd.append('first_name', form.first_name)
    fd.append('last_name', form.last_name)
    fd.append('email', form.email)
    fd.append('phone', form.phone)
    const selectedJob = jobs.find((j) => j.id === form.job_id)
    if (selectedJob) fd.append('job_title', selectedJob.title)
    if (cvFile) fd.append('cv', cvFile)

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'
      const res = await fetch(`${baseUrl}/candidates`, { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to add applicant')
      }
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add applicant')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full bg-[#0A0D12] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-white/20 transition-colors'
  const labelCls = 'text-[10px] font-semibold text-gray-500 tracking-widest block mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md bg-[#0D1117] border border-white/10 rounded-2xl p-6 flex flex-col gap-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">Add Applicant</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>FIRST NAME</label>
              <input required placeholder="John" className={inputCls} value={form.first_name} onChange={set('first_name')} />
            </div>
            <div>
              <label className={labelCls}>LAST NAME</label>
              <input required placeholder="Doe" className={inputCls} value={form.last_name} onChange={set('last_name')} />
            </div>
          </div>

          <div>
            <label className={labelCls}>EMAIL</label>
            <input type="email" required placeholder="john@example.com" className={inputCls} value={form.email} onChange={set('email')} />
          </div>

          <div>
            <label className={labelCls}>PHONE</label>
            <input required placeholder="+1 234 567 8900" className={inputCls} value={form.phone} onChange={set('phone')} />
          </div>

          <div>
            <label className={labelCls}>POSITION</label>
            <CustomSelect
              value={form.job_id}
              onChange={(v) => setForm((f) => ({ ...f, job_id: v }))}
              options={[{ value: '', label: 'Select a position' }, ...jobs.map((j) => ({ value: j.id, label: j.title }))]}
            />
          </div>

          <div>
            <label className={labelCls}>CV / RESUME (optional)</label>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setCvFile(e.target.files?.[0] ?? null)} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 bg-[#0A0D12] border border-dashed border-white/10 rounded-xl px-3 py-3 text-sm text-gray-500 hover:border-white/20 hover:text-gray-300 transition-colors"
            >
              <Upload className="w-4 h-4" />
              {cvFile ? cvFile.name : 'Click to upload PDF, DOC, DOCX'}
            </button>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-white/10 text-gray-300 hover:border-white/20 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-[#4ade80] text-[#0A0D12] font-semibold hover:bg-[#22c55e] transition-colors disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Applicant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
