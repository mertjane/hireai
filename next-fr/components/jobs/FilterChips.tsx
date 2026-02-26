'use client';

import { motion } from 'framer-motion';

interface FilterChipsProps {
  options: readonly string[];
  selected: string[];
  onChange: (values: string[]) => void;
  colorMap?: Record<string, string>;
}

const DEFAULT_COLORS = [
  'violet', 'indigo', 'blue', 'cyan', 'teal',
  'green', 'yellow', 'orange', 'rose', 'pink',
];

const COLOR_CLASSES: Record<string, { active: string; inactive: string }> = {
  violet:  { active: 'bg-violet-600 text-white border-violet-600',  inactive: 'bg-white text-violet-700 border-violet-200 hover:border-violet-400 hover:bg-violet-50' },
  indigo:  { active: 'bg-indigo-600 text-white border-indigo-600',  inactive: 'bg-white text-indigo-700 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50' },
  blue:    { active: 'bg-blue-600 text-white border-blue-600',      inactive: 'bg-white text-blue-700 border-blue-200 hover:border-blue-400 hover:bg-blue-50' },
  cyan:    { active: 'bg-cyan-600 text-white border-cyan-600',      inactive: 'bg-white text-cyan-700 border-cyan-200 hover:border-cyan-400 hover:bg-cyan-50' },
  teal:    { active: 'bg-teal-600 text-white border-teal-600',      inactive: 'bg-white text-teal-700 border-teal-200 hover:border-teal-400 hover:bg-teal-50' },
  green:   { active: 'bg-green-600 text-white border-green-600',    inactive: 'bg-white text-green-700 border-green-200 hover:border-green-400 hover:bg-green-50' },
  yellow:  { active: 'bg-yellow-500 text-white border-yellow-500',  inactive: 'bg-white text-yellow-700 border-yellow-200 hover:border-yellow-400 hover:bg-yellow-50' },
  orange:  { active: 'bg-orange-500 text-white border-orange-500',  inactive: 'bg-white text-orange-700 border-orange-200 hover:border-orange-400 hover:bg-orange-50' },
  rose:    { active: 'bg-rose-600 text-white border-rose-600',      inactive: 'bg-white text-rose-700 border-rose-200 hover:border-rose-400 hover:bg-rose-50' },
  pink:    { active: 'bg-pink-600 text-white border-pink-600',      inactive: 'bg-white text-pink-700 border-pink-200 hover:border-pink-400 hover:bg-pink-50' },
};

function getColor(option: string, index: number, colorMap?: Record<string, string>) {
  const key = colorMap?.[option] ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  return COLOR_CLASSES[key] ?? COLOR_CLASSES['violet'];
}

export function FilterChips({ options, selected, onChange, colorMap }: FilterChipsProps) {
  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option, index) => {
        const isActive = selected.includes(option);
        const colors = getColor(option, index, colorMap);

        return (
          <motion.button
            key={option}
            onClick={() => toggle(option)}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 cursor-pointer select-none ${
              isActive ? colors.active : colors.inactive
            }`}
          >
            {option}
          </motion.button>
        );
      })}
    </div>
  );
}
