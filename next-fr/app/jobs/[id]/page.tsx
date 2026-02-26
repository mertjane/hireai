'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ApplyDialog } from '@/components/jobs/ApplyDialog';
import { fetchJobById } from '@/services/api/jobs.api';
import { Job } from '@/types/job';

const WORK_TYPE_STYLES: Record<string, string> = {
  remote: 'bg-green-50 text-green-700 border border-green-200',
  hybrid: 'bg-blue-50 text-blue-700 border border-blue-200',
  'on-site': 'bg-orange-50 text-orange-700 border border-orange-200',
};

const DEPARTMENT_COLORS: Record<string, string> = {
  Engineering: 'bg-violet-50 text-violet-700',
  Design: 'bg-pink-50 text-pink-700',
  Marketing: 'bg-yellow-50 text-yellow-700',
  Product: 'bg-teal-50 text-teal-700',
  Sales: 'bg-emerald-50 text-emerald-700',
  HR: 'bg-rose-50 text-rose-700',
  Finance: 'bg-indigo-50 text-indigo-700',
  Data: 'bg-cyan-50 text-cyan-700',
};

const AVATAR_GRADIENTS = [
  'from-violet-500 to-indigo-500',
  'from-pink-500 to-rose-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-purple-500 to-violet-500',
  'from-indigo-500 to-blue-500',
  'from-rose-500 to-pink-500',
];

function hashId(id: string) {
  return id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="max-w-screen-xl mx-auto px-6 pt-6 w-full">
        <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse mb-6" />
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm mb-7 animate-pulse">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gray-200" />
            <div className="flex-1 space-y-3">
              <div className="h-3 w-32 bg-gray-200 rounded-md" />
              <div className="h-6 w-64 bg-gray-200 rounded-md" />
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-gray-200 rounded-full" />
                <div className="h-5 w-20 bg-gray-200 rounded-md" />
                <div className="h-5 w-24 bg-gray-200 rounded-md" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-7">
          <div className="flex-1 space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-7 animate-pulse space-y-3">
                <div className="h-4 w-32 bg-gray-200 rounded-md" />
                <div className="h-3 w-full bg-gray-100 rounded-md" />
                <div className="h-3 w-5/6 bg-gray-100 rounded-md" />
                <div className="h-3 w-4/6 bg-gray-100 rounded-md" />
              </div>
            ))}
          </div>
          <div className="w-72 shrink-0 space-y-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse h-32" />
            <div className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse h-48" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchJobById(id);
        setJob(data);
      } catch {
        setError('not_found');
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  if (loading) return <DetailSkeleton />;

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Job not found</h1>
          <p className="text-gray-400 text-sm mb-6">This position may have been filled or removed.</p>
          <Link
            href="/jobs"
            className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors"
          >
            Browse all jobs
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const companyName = job.companies?.name ?? 'Unknown Company';
  const avatarGradient = AVATAR_GRADIENTS[hashId(job.id) % AVATAR_GRADIENTS.length];
  const departmentStyle = DEPARTMENT_COLORS[job.department] ?? 'bg-gray-100 text-gray-700';
  const workTypeStyle = WORK_TYPE_STYLES[job.work_type];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="max-w-screen-xl mx-auto px-6 pt-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Jobs
          </button>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="max-w-screen-xl mx-auto px-6 pt-6 pb-8"
        >
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center shadow-md shrink-0`}>
                <span className="text-white font-extrabold text-2xl">
                  {companyName.charAt(0)}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-400 mb-0.5">{companyName}</p>
                <h1 className="text-2xl font-extrabold text-gray-900 leading-tight mb-3">
                  {job.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${workTypeStyle}`}>
                    {job.work_type}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${departmentStyle}`}>
                    {job.department}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {job.location}
                  </span>
                  <span className="text-gray-300 text-xs">·</span>
                  <span className="text-xs text-gray-400">Posted {formatDate(job.created_at)}</span>
                </div>
              </div>

              <button
                onClick={() => setDialogOpen(true)}
                className="hidden sm:inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md text-sm shrink-0"
              >
                Apply Now
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Body */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          className="max-w-screen-xl mx-auto px-6 pb-16"
        >
          <div className="flex flex-col lg:flex-row gap-7 items-start">
            {/* Left */}
            <div className="flex-1 min-w-0 space-y-6">
              <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-4">About the Role</h2>
                <p className="text-gray-600 text-sm leading-7">{job.description}</p>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-4">Responsibilities</h2>
                <ul className="space-y-2.5">
                  {[
                    `Collaborate with cross-functional teams within the ${job.department} department`,
                    'Define and implement scalable solutions to complex business problems',
                    'Participate in code reviews, architecture discussions, and planning sessions',
                    'Maintain high standards for quality, reliability, and performance',
                    'Mentor junior team members and contribute to a positive team culture',
                    'Communicate progress and blockers clearly to stakeholders',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-4">Requirements</h2>
                <ul className="space-y-2.5">
                  {[
                    `3+ years of experience in a ${job.department} role`,
                    'Strong communication and collaboration skills',
                    'Proven track record of delivering high-quality work',
                    'Ability to work in a fast-paced, dynamic environment',
                    'Experience working with cross-functional teams',
                    `Proficiency in tools and technologies relevant to ${job.department}`,
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right */}
            <div className="w-full lg:w-72 shrink-0 space-y-4 sticky top-24">
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Interested in this role?</h3>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  Join the team at {companyName} and make an impact.
                </p>
                <button
                  onClick={() => setDialogOpen(true)}
                  className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md text-sm"
                >
                  Apply Now
                </button>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Job Details</h3>
                <dl className="space-y-3">
                  {[
                    { label: 'Department', value: job.department },
                    { label: 'Location', value: job.location },
                    { label: 'Work Type', value: job.work_type },
                    { label: 'Status', value: job.status },
                    { label: 'Posted', value: formatDate(job.created_at) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <dt className="text-xs text-gray-400 font-medium">{label}</dt>
                      <dd className="text-xs font-semibold text-gray-700 capitalize">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Share this job</h3>
                <div className="flex gap-2">
                  {['LinkedIn', 'Twitter', 'Copy Link'].map((s) => (
                    <button
                      key={s}
                      className="flex-1 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:border-violet-300 hover:text-violet-600 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />

      <ApplyDialog
        job={job}
        companyName={companyName}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
