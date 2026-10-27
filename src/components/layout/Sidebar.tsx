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
  FileCheck2,
} from 'lucide-react';
import { motion } from 'framer-motion';

export type NavTab =
  | 'overview'
  | 'institutions'
  | 'cases'
  | 'overlaps'
  | 'reports';

interface SidebarProps {
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  activeTab,
  onTabChange,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();

  // Determine active tab based on pathname or prop
  const currentTab: NavTab = React.useMemo(() => {
    if (activeTab) return activeTab;
    if (!pathname) return 'overview';
    if (pathname.startsWith('/management/institutions')) return 'institutions';
    if (pathname.startsWith('/management/cases')) return 'cases';
    if (pathname.startsWith('/management/overlaps')) return 'overlaps';
    if (pathname.startsWith('/management/reports')) return 'reports';
    return 'overview';
  }, [activeTab, pathname]);

  const navItems = [
    {
      id: 'overview' as NavTab,
      label: 'Overview',
      icon: LayoutDashboard,
      href: '/management',
      badge: null,
    },
    {
      id: 'institutions' as NavTab,
      label: 'Institution Directory',
      icon: Building2,
      href: '/management/institutions',
      badge: null,
    },
    {
      id: 'cases' as NavTab,
      label: 'All Cases',
      icon: FolderKanban,
      href: '/management/cases',
      badge: '1,482',
    },
    {
      id: 'overlaps' as NavTab,
      label: 'Overlap Detection Centre',
      icon: CopyCheck,
      href: '/management/overlaps',
      badge: '18',
      badgeColor: 'bg-purple-100 text-purple-700 font-bold',
    },
    {
      id: 'reports' as NavTab,
      label: 'Reports & Analytics',
      icon: BarChart3,
      href: '/management/reports',
      badge: null,
    },
  ];

  const handleNavClick = (id: NavTab) => {
    if (onTabChange) {
      onTabChange(id);
    }
    if (isOpenMobile) {
      onCloseMobile();
    }
  };

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
          <Link href="/management" className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white shadow-md">
              <ShieldCheck className="h-5 w-5 text-amber-300" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-white text-sm tracking-tight flex items-center gap-1">
                  CaseConnect
                </span>
                <span className="text-[10px] text-white/70 truncate uppercase tracking-wider font-semibold">
                  Senior Management
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
              Senior Management
            </div>
            <div className="mt-0.5 text-[10px] text-white/60">
              AICTE Central HQ Oversight
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
            {isCollapsed ? '•••' : 'Main Navigation'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => handleNavClick(item.id)}
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
                    layoutId="activeIndicator"
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
                National Grievance Oversight • HQ New Delhi
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
