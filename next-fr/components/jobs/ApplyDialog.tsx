'use client';

import { useState, useRef, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Job } from '@/types/job';
import { CandidateFormData, INITIAL_FORM_DATA } from '@/types/candidate';
import { applyToJob } from '@/services/api/apply-job.api';

interface ApplyDialogProps {
  job: Job;
  companyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormStep = 'form' | 'submitting' | 'success';

interface FieldError {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

function validate(data: CandidateFormData): FieldError {
  const errors: FieldError = {};
  if (!data.first_name.trim()) errors.first_name = 'Required';
  if (!data.last_name.trim()) errors.last_name = 'Required';
  if (!data.email.trim()) errors.email = 'Required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Invalid email';
  if (!data.phone.trim()) errors.phone = 'Required';
  return errors;
}

export function ApplyDialog({ job, companyName, open, onOpenChange }: ApplyDialogProps) {
  const [form, setForm] = useState<CandidateFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<FieldError>({});
  const [step, setStep] = useState<FormStep>('form');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setForm(INITIAL_FORM_DATA);
      setErrors({});
      setStep('form');
    }, 300);
  };

  const handleChange = (field: keyof CandidateFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FieldError]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFile = useCallback((file: File | null) => {
    if (!file) return;
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) return;
    if (file.size > 5 * 1024 * 1024) return;
    setForm((prev) => ({ ...prev, cv_file: file }));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0] ?? null;
      handleFile(file);
    },
    [handleFile]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setStep('submitting');
    try {
      await applyToJob({
        company_id: job.company_id,
        job_id: job.id,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        cv_file: form.cv_file,
        job_title: job.title,
        company_name: companyName,
      });
      setStep('success');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const message = axiosErr?.response?.data?.error ?? 'Something went wrong. Please try again.';
      setStep('form');
      setErrors({ email: message });
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
        </Dialog.Overlay>

        {/* Content */}
        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl outline-none max-h-[90vh] overflow-y-auto"
          >
            <AnimatePresence mode="wait">
              {/* ── FORM STATE ── */}
              {step !== 'success' && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
                    <div>
                      <Dialog.Title className="text-base font-bold text-gray-900">
                        Apply for Position
                      </Dialog.Title>
                      <Dialog.Description className="text-sm text-gray-400 mt-0.5">
                        {job.title} · {companyName}
                      </Dialog.Description>
                    </div>
                    <Dialog.Close asChild>
                      <button
                        onClick={handleClose}
                        className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </Dialog.Close>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          First Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={form.first_name}
                          onChange={(e) => handleChange('first_name', e.target.value)}
                          placeholder="Jane"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-gray-900 placeholder-gray-300 outline-none transition-all ${
                            errors.first_name
                              ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                              : 'border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100'
                          }`}
                        />
                        {errors.first_name && (
                          <p className="text-xs text-rose-500 mt-1">{errors.first_name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Last Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={form.last_name}
                          onChange={(e) => handleChange('last_name', e.target.value)}
                          placeholder="Doe"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-gray-900 placeholder-gray-300 outline-none transition-all ${
                            errors.last_name
                              ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                              : 'border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100'
                          }`}
                        />
                        {errors.last_name && (
                          <p className="text-xs text-rose-500 mt-1">{errors.last_name}</p>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="jane@example.com"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-gray-900 placeholder-gray-300 outline-none transition-all ${
                          errors.email
                            ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                            : 'border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100'
                        }`}
                      />
                      {errors.email && (
                        <p className="text-xs text-rose-500 mt-1">{errors.email}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="+90 555 000 0000"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-gray-900 placeholder-gray-300 outline-none transition-all ${
                          errors.phone
                            ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                            : 'border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100'
                        }`}
                      />
                      {errors.phone && (
                        <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>
                      )}
                    </div>

                    {/* CV Upload */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Upload CV
                        <span className="ml-1 font-normal text-gray-400">(optional)</span>
                      </label>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        className={`w-full border-2 border-dashed rounded-2xl px-4 py-5 text-center transition-all duration-150 ${
                          dragOver
                            ? 'border-violet-400 bg-violet-50'
                            : form.cv_file
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/40'
                        }`}
                      >
                        {form.cv_file ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-semibold text-gray-800 truncate max-w-[240px]">
                                {form.cv_file.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {(form.cv_file.size / 1024).toFixed(0)} KB · Click to replace
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-2">
                              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                              </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-700">
                              Drag & drop or <span className="text-violet-600">browse</span>
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">PDF, DOC, DOCX · Max 5MB</p>
                          </div>
                        )}
                      </button>
                    </div>

                    {/* Submit */}
                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={step === 'submitting'}
                        className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-violet-700 hover:to-indigo-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm"
                      >
                        {step === 'submitting' ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Submitting...
                          </>
                        ) : (
                          'Apply Now'
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* ── SUCCESS STATE ── */}
              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="flex flex-col items-center justify-center text-center px-8 py-14"
                >
                  {/* Animated checkmark */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center mb-6 shadow-lg"
                  >
                    <motion.svg
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="w-10 h-10 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <motion.path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
                      />
                    </motion.svg>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    <h2 className="text-xl font-extrabold text-gray-900 mb-2">
                      Thank you for applying!
                    </h2>
                    <p className="text-gray-400 text-sm leading-relaxed mb-1">
                      Your application for <span className="font-semibold text-gray-700">{job.title}</span>
                    </p>
                    <p className="text-gray-400 text-sm mb-7">
                      at <span className="font-semibold text-gray-700">{companyName}</span> has been received.
                    </p>
                    <p className="text-gray-400 text-xs mb-8">
                      We&apos;ll review your application and get back to you soon.
                    </p>

                    <button
                      onClick={handleClose}
                      className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-2xl hover:bg-gray-700 transition-colors"
                    >
                      Back to Jobs
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
