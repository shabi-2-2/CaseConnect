'use client';

import React from 'react';
import { Search, Menu, X, Sparkles } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { ProfileDropdown } from './ProfileDropdown';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectCase?: (caseId: string) => void;
}

export function Navbar({
  onToggleSidebar,
  isSidebarOpen,
  searchQuery,
  onSearchChange,
  onSelectCase,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md transition-all sm:px-6">
      {/* Left side: Mobile menu toggle + Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          aria-label="Toggle navigation menu"
        >
          {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        {/* Global Search */}
        <div className="relative w-full max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search cases, institution code, city, or bureau..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50/60 py-1.5 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right side: System status pill + Notification bell + User profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Live SLA & AICTE System Pill */}
        <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1 text-[11px] font-medium text-emerald-800 md:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span>SLA Tracking Active</span>
        </div>

        {/* Overlap Alert Quick Pill */}
        <div className="hidden items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50/80 px-2.5 py-1 text-[11px] font-medium text-purple-700 xl:flex">
          <Sparkles className="h-3 w-3 text-purple-600" />
          <span>18 Overlap Flags</span>
        </div>

        <div className="h-5 w-px bg-slate-200" />

        {/* Notifications */}
        <NotificationDropdown onSelectCase={onSelectCase} />

        {/* Profile */}
        <ProfileDropdown />
      </div>
    </header>
  );
}
