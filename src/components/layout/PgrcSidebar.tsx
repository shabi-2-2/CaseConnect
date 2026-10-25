'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  CopyCheck,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Link2,
  Users,
  FileCheck2,
} from 'lucide-react';
import { motion } from 'framer-motion';

export type PgrcNavTab =
  | 'overview'
  | 'cases'
  | 'institutions'
  | 'related-rb'
  | 'overlaps'
  | 'coordination'
  | 'reports';

interface PgrcSidebarProps {
  activeTab?: PgrcNavTab;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  badgeCounts?: {
    cases?: number;
    overlaps?: number;
    coordination?: number;
  };
}

export function PgrcSidebar({
  activeTab,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
  badgeCounts,
}: PgrcSidebarProps) {
  const pathname = usePathname();

  const currentTab: PgrcNavTab = React.useMemo(() => {
    if (activeTab) return activeTab;
    if (!pathname) return 'overview';
    if (pathname === '/pgrc-dashboard/cases' || pathname.startsWith('/pgrc-dashboard/cases/')) return 'cases';
    if (pathname === '/pgrc-dashboard/institutions' || pathname.startsWith('/pgrc-dashboard/institutions/')) return 'institutions';
    if (pathname === '/pgrc-dashboard/related-rb-cases') return 'related-rb';
    if (pathname === '/pgrc-dashboard/overlaps') return 'overlaps';
    if (pathname === '/pgrc-dashboard/coordination') return 'coordination';
    if (pathname === '/pgrc-dashboard/reports') return 'reports';
    return 'overview';
  }, [activeTab, pathname]);

  const navItems = [
    {
      id: 'overview' as PgrcNavTab,
      label: 'PGRC Overview',
      icon: LayoutDashboard,
      href: '/pgrc-dashboard',
      badge: null,
    },
    {
      id: 'cases' as PgrcNavTab,
      label: 'PGRC Cases',
      icon: FolderKanban,
      href: '/pgrc-dashboard/cases',
      badge: badgeCounts?.cases ? String(badgeCounts.cases) : null,
      badgeColor: 'bg-white/10 text-white',
    },
    {
      id: 'institutions' as PgrcNavTab,
      label: 'Institution Search',
      icon: Building2,
      href: '/pgrc-dashboard/institutions',
      badge: null,
    },
    {
      id: 'related-rb' as PgrcNavTab,
      label: 'Related RB Cases',
      icon: Link2,
      href: '/pgrc-dashboard/related-rb-cases',
      badge: null,
    },
    {
      id: 'overlaps' as PgrcNavTab,
      label: 'Overlap Review Queue',
      icon: CopyCheck,
      href: '/pgrc-dashboard/overlaps',
      badge: badgeCounts?.overlaps ? String(badgeCounts.overlaps) : null,
      badgeColor: 'bg-purple-400/20 text-purple-200 border border-purple-400/30',
    },
    {
      id: 'coordination' as PgrcNavTab,
      label: 'Coordination Workspace',
      icon: Users,
      href: '/pgrc-dashboard/coordination',
      badge: badgeCounts?.coordination ? String(badgeCounts.coordination) : null,
      badgeColor: 'bg-amber-400/20 text-amber-200 border border-amber-400/30',
    },
    {
      id: 'reports' as PgrcNavTab,
      label: 'PGRC Reports',
      icon: BarChart3,
      href: '/pgrc-dashboard/reports',
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-slate-200/80 bg-[#002b5c] text-white transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand / Logo Header */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <Link href="/pgrc-dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white shadow-md">
              <ShieldCheck className="h-5 w-5 text-amber-300" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-white text-sm tracking-tight flex items-center gap-1">
                  CaseConnect
                </span>
                <span className="text-[10px] text-white/70 truncate uppercase tracking-wider font-semibold">
                  PGRC Official
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className="hidden h-7 w-7 items-center justify-center rounded-md border border-white/20 text-white/70 hover:bg-white/10 hover:text-white lg:flex focus:outline-none"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Role Badge */}
        {!isCollapsed && (
          <div className="mx-3 mt-3.5 mb-1 rounded-lg bg-white/5 p-2.5 border border-white/10">
            <div className="text-[10px] uppercase font-bold text-white/60 tracking-wider">
              Role
            </div>
            <div className="mt-1 text-xs font-semibold text-white">
              PGRC Official
            </div>
            <div className="mt-0.5 text-[10px] text-white/60">
              Public Grievance Redressal Cell
            </div>
          </div>
        )}

        {/* Navigation List */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          <div
            className={`px-2 pb-1.5 text-[10px] font-semibold tracking-wider text-white/40 uppercase ${
              isCollapsed ? 'text-center' : ''
            }`}
          >
            {isCollapsed ? '•••' : 'PGRC Navigation'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onCloseMobile}
                title={isCollapsed ? item.label : undefined}
                className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white/15 text-white shadow-xs'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="pgrcNavIndicator"
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-amber-400"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive
                      ? 'text-amber-300'
                      : 'text-white/70 group-hover:text-white'
                  }`}
                />

                {!isCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {!isCollapsed && item.badge && (
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      item.badgeColor || 'bg-white/10 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-white/10 mt-3">
            <Link
              href="/management"
              className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all text-white/70 hover:bg-white/10 hover:text-white ${
                isCollapsed ? 'justify-center px-2' : ''
              }`}
            >
              <ShieldCheck className="h-4 w-4 shrink-0 text-white/60 group-hover:text-white" />
              {!isCollapsed && (
                <span className="truncate flex-1 text-left">Senior Management</span>
              )}
            </Link>
            <Link
              href="/"
              className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all text-white/70 hover:bg-white/10 hover:text-white ${
                isCollapsed ? 'justify-center px-2' : ''
              }`}
            >
              <FileCheck2 className="h-4 w-4 shrink-0 text-white/60 group-hover:text-white" />
              {!isCollapsed && (
                <span className="truncate flex-1 text-left">Switch Role / Home</span>
              )}
            </Link>
          </div>
        </nav>

        {/* Bottom AICTE System Info */}
        <div className="border-t border-white/10 p-3">
          {!isCollapsed ? (
            <div className="rounded-lg bg-white/5 p-2.5 border border-white/10 text-[11px] text-white/80">
              <div className="flex items-center gap-1.5 font-semibold text-white">
                <FileCheck2 className="h-3.5 w-3.5 text-amber-300" />
                <span>AICTE CaseConnect v1.0.4</span>
              </div>
              <p className="mt-1 text-[10px] text-white/60 leading-tight">
                PGRC Official Desk • AICTE HQ
              </p>
            </div>
          ) : (
            <div className="flex justify-center text-white/50">
              <FileCheck2 className="h-4 w-4" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
