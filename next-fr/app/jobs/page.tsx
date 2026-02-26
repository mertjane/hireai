'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';
import { JobList } from '@/components/jobs/JobList';
import { FilterState, Job } from '@/types/job';
import { fetchJobs } from '@/services/api/jobs.api';

const JOBS_PER_PAGE = 20;

export default function JobListsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    workTypes: [],
    departments: [],
    locations: [],
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchJobs();
        setJobs(data);
      } catch {
        setError('Failed to load jobs. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, []);

  const availableDepartments = useMemo(
    () => [...new Set(jobs.map((j) => j.department))].sort(),
    [jobs]
  );

  const availableLocations = useMemo(
    () => [...new Set(jobs.map((j) => j.location))].sort(),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    let result = jobs.filter((job) => job.status === 'active');

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (job) =>
          job.title.toLowerCase().includes(q) ||
          job.department.toLowerCase().includes(q) ||
          job.location.toLowerCase().includes(q) ||
          job.description.toLowerCase().includes(q)
      );
    }

    if (filters.workTypes.length > 0) {
      result = result.filter((job) => filters.workTypes.includes(job.work_type));
    }

    if (filters.departments.length > 0) {
      result = result.filter((job) => filters.departments.includes(job.department));
    }

    if (filters.locations.length > 0) {
      result = result.filter((job) => filters.locations.includes(job.location));
    }

    return result;
  }, [jobs, filters, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / JOBS_PER_PAGE));

  const isFiltered =
    filters.workTypes.length > 0 ||
    filters.departments.length > 0 ||
    filters.locations.length > 0 ||
    searchQuery.trim().length > 0;

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="bg-white border-b border-gray-100"
        >
          <div className="max-w-screen-xl mx-auto px-6 py-10">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">
              Find Your Next Role
            </h1>
            <p className="text-gray-400 text-sm mb-6">
              {loading ? 'Loading positions...' : `${jobs.length} open positions across top companies`}
            </p>

            {/* Search bar */}
            <div className="relative max-w-xl">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by title, department, or location..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <div className="max-w-screen-xl mx-auto px-6 py-8">
          {/* Error state */}
          {error && (
            <div className="mb-6 px-4 py-3 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-600 font-medium">
              {error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-28 bg-gray-100 rounded-md" />
                      <div className="h-2.5 w-16 bg-gray-100 rounded-md" />
                    </div>
                  </div>
                  <div className="h-4 w-3/4 bg-gray-100 rounded-md mb-3" />
                  <div className="h-3 w-full bg-gray-100 rounded-md mb-2" />
                  <div className="h-3 w-5/6 bg-gray-100 rounded-md" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-7 items-start">
              {/* Sidebar */}
              <div className="hidden lg:block">
                <Sidebar
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  totalResults={filteredJobs.length}
                  departments={availableDepartments}
                  locations={availableLocations}
                />
              </div>

              {/* Job List */}
              <JobList
                jobs={filteredJobs}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                isFiltered={isFiltered}
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
