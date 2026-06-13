'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';
import {
  ChartIcon,
  CloseIcon,
  HomeIcon,
  SendIcon,
  TargetIcon,
  UsersIcon,
  XenoLogo,
} from './icons';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: HomeIcon },
  { href: '/customers', label: 'Customers', icon: UsersIcon },
  { href: '/segments', label: 'Segments', icon: TargetIcon },
  { href: '/campaigns', label: 'Campaigns', icon: SendIcon },
  { href: '/insights', label: 'Insights', icon: ChartIcon },
];

function NavLinks({ pathname, onLinkClick }: { pathname: string; onLinkClick: () => void }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {NAV_ITEMS.map(item => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onLinkClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <XenoLogo />
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-50 leading-tight">Xeno CRM</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight">AI-native engagement</p>
          </div>
        </div>
        <NavLinks pathname={pathname} onLinkClick={() => setMobileOpen(false)} />
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
          Built for shopper engagement
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="flex items-center justify-between px-5 py-5">
              <div className="flex items-center gap-2.5">
                <XenoLogo />
                <p className="font-semibold text-slate-900 dark:text-slate-50">Xeno CRM</p>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-slate-500 dark:text-slate-400" aria-label="Close menu">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            <NavLinks pathname={pathname} onLinkClick={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 md:px-8 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-5 h-5">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2 md:hidden">
            <XenoLogo className="w-7 h-7" />
            <p className="font-semibold text-slate-900 dark:text-slate-50">Xeno CRM</p>
          </div>
          <div className="flex-1" />
          <ThemeToggle />
        </header>
        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
