'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Scale,
  Building2,
  FolderKanban,
  CopyCheck,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Link2,
  Users,
  FileText,
} from 'lucide-react';
import { motion } from 'framer-motion';

export type RbNavTab =
  | 'overview'
  | 'cases'
  | 'institutions'
  | 'related-pgrc'
  | 'overlaps'
  | 'coordination'
  | 'reports';

interface RbSidebarProps {
  activeTab?: RbNavTab;
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

export function RbSidebar({
  activeTab,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
  badgeCounts,
}: RbSidebarProps) {
  const pathname = usePathname();

  const currentTab: RbNavTab = React.useMemo(() => {
    if (activeTab) return activeTab;
    if (!pathname) return 'overview';
    if (pathname === '/regulation-dashboard/cases' || pathname.startsWith('/regulation-dashboard/cases/')) return 'cases';
    if (pathname === '/regulation-dashboard/institutions' || pathname.startsWith('/regulation-dashboard/institutions/')) return 'institutions';
    if (pathname === '/regulation-dashboard/related-pgrc-cases') return 'related-pgrc';
    if (pathname === '/regulation-dashboard/overlaps') return 'overlaps';
    if (pathname === '/regulation-dashboard/coordination') return 'coordination';
    if (pathname === '/regulation-dashboard/reports') return 'reports';
    return 'overview';
  }, [activeTab, pathname]);

  const navItems = [
    {
      id: 'overview' as RbNavTab,
      label: 'Enforcement Docket',
      icon: FileText,
      href: '/regulation-dashboard',
      badge: null,
    },
    {
      id: 'cases' as RbNavTab,
      label: 'RB Cases',
      icon: FolderKanban,
      href: '/regulation-dashboard/cases',
      badge: badgeCounts?.cases ? String(badgeCounts.cases) : null,
      badgeColor: 'bg-amber-400/20 text-amber-200 border border-amber-400/30',
    },
    {
      id: 'institutions' as RbNavTab,
      label: 'Institution Search',
      icon: Building2,
      href: '/regulation-dashboard/institutions',
      badge: null,
    },
    {
      id: 'related-pgrc' as RbNavTab,
      label: 'Related PGRC Cases',
      icon: Link2,
      href: '/regulation-dashboard/related-pgrc-cases',
      badge: null,
    },
    {
      id: 'overlaps' as RbNavTab,
      label: 'Overlap Review Queue',
      icon: CopyCheck,
      href: '/regulation-dashboard/overlaps',
      badge: badgeCounts?.overlaps ? String(badgeCounts.overlaps) : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'coordination' as RbNavTab,
      label: 'Coordination Workspace',
      icon: Users,
      href: '/regulation-dashboard/coordination',
      badge: badgeCounts?.coordination ? String(badgeCounts.coordination) : null,
      badgeColor: 'bg-blue-500 text-white',
    },
    {
      id: 'reports' as RbNavTab,
      label: 'RB Reports',
      icon: BarChart3,
      href: '/regulation-dashboard/reports',
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-slate-200/80 bg-[#002b5c] text-white transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Header / Brand */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white shadow-md">
              <Scale className="h-5 w-5 text-amber-300" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-white text-sm tracking-tight">CaseConnect</span>
                <span className="text-[10px] text-amber-200 truncate uppercase tracking-wider font-semibold">
                  Regulation Bureau
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Role Badge */}
        {!isCollapsed && (
          <div className="mx-3 mt-3.5 mb-1 rounded-lg bg-white/5 p-2.5 border border-white/10">
            <div className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Active Console</div>
            <div className="mt-1 text-xs font-semibold text-white flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Regulation Bureau Official
            </div>
            <div className="mt-0.5 text-[10px] text-white/60">Compliance &amp; Statutory Enforcement</div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {!isCollapsed && (
            <div className="px-2 pb-1.5 text-[10px] font-semibold tracking-wider text-white/40 uppercase">
              Regulatory Modules
            </div>
          )}

          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onCloseMobile}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white/15 text-white shadow-xs font-semibold'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="activeRbTabIndicator"
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-amber-400"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive ? 'text-amber-300' : 'text-white/70 group-hover:text-white'
                  }`}
                />

                {!isCollapsed && <span className="truncate flex-1">{item.label}</span>}

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
        </nav>

        <div className="border-t border-white/10 p-3" />
      </aside>
    </>
  );
}
