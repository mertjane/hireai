'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export function Navbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm"
    >
      <div className="max-w-screen-xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="text-gray-900 font-bold text-lg tracking-tight">
              Hire<span className="text-violet-600">AI</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-7">
            <Link
              href="/jobs"
              className="text-violet-600 font-semibold text-sm border-b-2 border-violet-600 pb-0.5"
            >
              Jobs
            </Link>
            <Link href="#" className="text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors">
              Companies
            </Link>
            <Link href="#" className="text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors">
              Candidates
            </Link>
            <Link href="#" className="text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors">
              Resources
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-violet-600 border border-violet-200 rounded-xl hover:bg-violet-50 transition-colors">
              Post a Job
            </button>
            <button className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <span className="text-white text-xs font-bold">MK</span>
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
