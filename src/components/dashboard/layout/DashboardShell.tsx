'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Calendar,
  ShieldCheck,
  LucideIcon,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { useMounted } from '@/lib/utils';

export interface DashboardNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
}

interface DashboardShellProps {
  roleBadge: string;
  roleBadgeIcon?: LucideIcon;
  sidebarTitle: string;
  sidebarSubtitle: string;
  sidebarRoleName: string;
  sidebarRoleDetail?: string;
  navItems: DashboardNavItem[];
  activeNavId: string;
  onNavChange?: (id: string) => void;
  sidebarBottomLink?: { href: string; label: string; icon: LucideIcon };
  pageTitle: string;
  pageDescription: string;
  headerActions?: React.ReactNode;
  showSearchInNavbar?: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSelectCase?: (caseId: string) => void;
  onToggleSidebar?: () => void;
  children: React.ReactNode;
}

export function DashboardShell({
  roleBadge,
  roleBadgeIcon: RoleBadgeIcon = ShieldCheck,
  sidebarTitle,
  sidebarSubtitle,
  sidebarRoleName,
  sidebarRoleDetail,
  navItems,
  activeNavId,
  onNavChange,
  sidebarBottomLink,
  pageTitle,
  pageDescription,
  headerActions,
  showSearchInNavbar = false,
  searchQuery = '',
  onSearchChange,
  onSelectCase,
  children,
}: DashboardShellProps) {
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isCollapsed] = useState(false);
  const mounted = useMounted();

  const formattedDate = mounted
    ? new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Saturday, 24 October 2026';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-slate-200/80 bg-[#002b5c] text-white transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isSidebarOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white shadow-md">
              <RoleBadgeIcon className="h-5 w-5 text-amber-300" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-white text-sm tracking-tight">{sidebarTitle}</span>
                <span className="text-[10px] text-white/70 truncate uppercase tracking-wider font-semibold">
                  {sidebarSubtitle}
                </span>
              </div>
            )}
          </div>
        </div>

        {!isCollapsed && (
          <div className="mx-3 mt-3.5 mb-1 rounded-lg bg-white/5 p-2.5 border border-white/10">
            <div className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Role</div>
            <div className="mt-1 text-xs font-semibold text-white">{sidebarRoleName}</div>
            {sidebarRoleDetail && <div className="mt-0.5 text-[10px] text-white/60">{sidebarRoleDetail}</div>}
          </div>
        )}

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          <div className={`px-2 pb-1.5 text-[10px] font-semibold tracking-wider text-white/40 uppercase ${isCollapsed ? 'text-center' : ''}`}>
            {isCollapsed ? '•••' : 'Navigation'}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNavId === item.id;
            const content = (
              <>
                {isActive && (
                  <motion.div
                    layoutId="dashboardActive"
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-amber-400"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-white/70 group-hover:text-white'}`} />
                {!isCollapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
              </>
            );
            if (item.href) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                    isActive ? 'bg-white/15 text-white shadow-xs' : 'text-white/80 hover:bg-white/10 hover:text-white'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
                >
                  {content}
                </Link>
              );
            }
            return (
              <button
                key={item.id}
                onClick={() => {
                  item.onClick?.();
                  onNavChange?.(item.id);
                }}
                title={isCollapsed ? item.label : undefined}
                className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                  isActive ? 'bg-white/15 text-white shadow-xs' : 'text-white/80 hover:bg-white/10 hover:text-white'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
              >
                {content}
              </button>
            );
          })}
          {sidebarBottomLink && (
            <Link
              href={sidebarBottomLink.href}
              className={`mt-4 group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all text-white/80 hover:bg-white/10 hover:text-white ${isCollapsed ? 'justify-center px-2' : ''}`}
            >
              <sidebarBottomLink.icon className="h-4 w-4 shrink-0 text-white/70 group-hover:text-white" />
              {!isCollapsed && <span className="truncate flex-1 text-left">{sidebarBottomLink.label}</span>}
            </Link>
          )}
        </nav>
      </aside>

      {isSidebarOpenMobile && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden" onClick={() => setIsSidebarOpenMobile(false)} />
      )}

      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {showSearchInNavbar ? (
          <Navbar
            onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
            isSidebarOpen={isSidebarOpenMobile}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange || (() => {})}
            onSelectCase={onSelectCase}
          />
        ) : (
          <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md transition-all sm:px-6">
            <div className="flex items-center gap-3 flex-1 max-w-xl">
              <button
                onClick={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-label="Toggle navigation menu"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-900">CaseConnect</span>
                <span className="text-slate-400">/</span>
                <span>{sidebarSubtitle}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Switch Role
              </Link>
            </div>
          </header>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200/80 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 border border-blue-200">
                  <RoleBadgeIcon className="h-3.5 w-3.5 text-blue-600" />
                  {roleBadge}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>{formattedDate}</span>
                </div>
              </div>
              <h1 className="mt-2 font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">{pageTitle}</h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">{pageDescription}</p>
            </div>
            {headerActions && (
              <div className="flex flex-wrap items-center gap-2 sm:self-start md:self-auto">{headerActions}</div>
            )}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
