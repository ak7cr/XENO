'use client';

import { useTheme } from '@/lib/theme-provider';
import { MoonIcon, SunIcon } from './icons';

export function ThemeToggle() {
  const { toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
    >
      <SunIcon className="w-4.5 h-4.5 hidden dark:block" />
      <MoonIcon className="w-4.5 h-4.5 dark:hidden" />
    </button>
  );
}
