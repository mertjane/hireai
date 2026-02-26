'use client';

import { motion } from 'framer-motion';
import { FilterChips } from '@/components/jobs/FilterChips';
import { FilterState, WorkType } from '@/types/job';

interface SidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  totalResults: number;
  departments: string[];
  locations: string[];
}

export function Sidebar({ filters, onFilterChange, totalResults, departments, locations }: SidebarProps) {
  const totalActive =
    filters.workTypes.length + filters.departments.length + filters.locations.length;

  const handleClearAll = () => {
    onFilterChange({ workTypes: [], departments: [], locations: [] });
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
      className="w-72 shrink-0 bg-white border border-gray-100 rounded-2xl p-5 h-fit sticky top-24 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-bold text-gray-900 text-sm">Filters</h2>
          <p className="text-xs text-gray-400 mt-0.5">{totalResults} positions found</p>
        </div>
        {totalActive > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-violet-600 hover:text-violet-800 font-semibold px-2 py-1 rounded-lg hover:bg-violet-50 transition-colors"
          >
            Clear ({totalActive})
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Work Type */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Work Type
          </h3>
          <FilterChips
            options={['remote', 'hybrid', 'on-site']}
            selected={filters.workTypes}
            onChange={(values) =>
              onFilterChange({ ...filters, workTypes: values as WorkType[] })
            }
            colorMap={{
              remote: 'green',
              hybrid: 'blue',
              'on-site': 'orange',
            }}
          />
        </div>

        <div className="border-t border-gray-100" />

        {/* Department */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Department
          </h3>
          <FilterChips
            options={departments}
            selected={filters.departments}
            onChange={(values) => onFilterChange({ ...filters, departments: values })}
          />
        </div>

        <div className="border-t border-gray-100" />

        {/* Location */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Location
          </h3>
          <FilterChips
            options={locations}
            selected={filters.locations}
            onChange={(values) => onFilterChange({ ...filters, locations: values })}
            colorMap={{
              Remote: 'teal',
              London: 'indigo',
              Berlin: 'cyan',
              Amsterdam: 'violet',
              Istanbul: 'rose',
              Ankara: 'pink',
            }}
          />
        </div>
      </div>
    </motion.aside>
  );
}
