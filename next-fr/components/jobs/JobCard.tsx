'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Job } from '@/types/job';

interface JobCardProps {
  job: Job;
  index: number;
}

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

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1d ago';
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function JobCard({ job, index }: JobCardProps) {
  const companyName = job.companies?.name ?? 'Unknown Company';
  const avatarGradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
  const departmentStyle = DEPARTMENT_COLORS[job.department] ?? 'bg-gray-100 text-gray-700';
  const workTypeStyle = WORK_TYPE_STYLES[job.work_type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: 'easeOut' }}
      whileHover={{ y: -3, boxShadow: '0 12px 40px -8px rgba(0,0,0,0.12)' }}
      className="group bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:border-violet-100 transition-all duration-200 cursor-pointer"
    >
      <Link href={`/jobs/${job.id}`} className="flex flex-col h-full">
        {/* Header: Avatar + Company + Date */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center shadow-sm shrink-0`}
            >
              <span className="text-white font-bold text-sm">
                {companyName.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">{companyName}</p>
              <p className="text-xs text-gray-400">{formatDate(job.created_at)}</p>
            </div>
          </div>

          {/* Work Type Badge */}
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${workTypeStyle}`}>
            {job.work_type}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-violet-700 transition-colors line-clamp-2">
          {job.title}
        </h3>

        {/* Department + Location */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${departmentStyle}`}>
            {job.department}
          </span>
          <span className="text-gray-300 text-xs">·</span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {job.location}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 flex-1 mb-4">
          {job.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <span className="text-xs text-gray-400 font-medium capitalize">{job.status}</span>
          <span className="text-xs font-semibold text-violet-600 group-hover:text-violet-800 flex items-center gap-1 transition-colors">
            View Details
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
