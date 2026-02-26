'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { JobCard } from '@/components/jobs/JobCard';
import { Job } from '@/types/job';

interface JobListProps {
  jobs: Job[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isFiltered: boolean;
}

const JOBS_PER_PAGE = 20;

export function JobList({ jobs, currentPage, totalPages, onPageChange, isFiltered }: JobListProps) {
  const start = (currentPage - 1) * JOBS_PER_PAGE;
  const paginated = jobs.slice(start, start + JOBS_PER_PAGE);

  if (jobs.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-gray-800 font-bold text-base mb-1">No jobs found</h3>
        <p className="text-gray-400 text-sm">Try adjusting your filters to see more results.</p>
      </motion.div>
    );
  }

  return (
    <div className="flex-1 min-w-0">
      {/* Results count */}
      <AnimatePresence mode="wait">
        <motion.p
          key={jobs.length}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-gray-400 mb-4 font-medium"
        >
          {isFiltered ? (
            <>
              <span className="text-gray-700 font-semibold">{jobs.length}</span> results match your filters
            </>
          ) : (
            <>
              Showing <span className="text-gray-700 font-semibold">{paginated.length}</span> of{' '}
              <span className="text-gray-700 font-semibold">{jobs.length}</span> positions
            </>
          )}
        </motion.p>
      </AnimatePresence>

      {/* Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentPage}-${jobs.length}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {paginated.map((job, index) => (
            <JobCard key={job.id} job={job} index={index} />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-violet-300 hover:text-violet-600 transition-colors"
          >
            ← Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                page === currentPage
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'border border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-violet-300 hover:text-violet-600 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
