'use client';

import React from 'react';
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
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
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
  const navItems = [
    {
      id: 'overview' as NavTab,
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'institutions' as NavTab,
      label: 'Institution Directory',
      icon: Building2,
      badge: null,
    },
    {
      id: 'cases' as NavTab,
      label: 'All Cases',
      icon: FolderKanban,
      badge: '1,482',
    },
    {
      id: 'overlaps' as NavTab,
      label: 'Overlap Detection Centre',
      icon: CopyCheck,
      badge: '18',
      badgeColor: 'bg-purple-100 text-purple-700 font-bold',
    },
    {
      id: 'reports' as NavTab,
      label: 'Reports & Analytics',
      icon: BarChart3,
      badge: null,
    },
  ];

  const handleNavClick = (id: NavTab) => {
    onTabChange(id);
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
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-slate-200/80 bg-white transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand / Logo Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* AICTE emblem emblem block */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#003366] text-white shadow-md">
              <ShieldCheck className="h-5 w-5 text-amber-300" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-1">
                  AICTE <span className="font-normal text-xs text-blue-700">Oversight</span>
                </span>
                <span className="text-[10px] text-slate-500 truncate uppercase tracking-wider font-semibold">
                  PGRC & Regulation Bureau
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className="hidden h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:flex focus:outline-none"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Bureau Badges */}
        {!isCollapsed && (
          <div className="mx-3 mt-3.5 mb-1 rounded-lg bg-slate-50 p-2.5 border border-slate-100">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Integrated Bureaus
            </div>
            <div className="mt-1 flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-blue-800">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                PGRC
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5 text-amber-800">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Regulation Bureau
              </span>
            </div>
          </div>
        )}

        {/* Navigation List */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          <div className={`px-2 pb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase ${isCollapsed ? 'text-center' : ''}`}>
            {isCollapsed ? '•••' : 'Main Navigation'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-900 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-blue-600"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive
                      ? 'text-blue-700'
                      : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />

                {!isCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {!isCollapsed && item.badge && (
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      item.badgeColor || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom AICTE System Info */}
        <div className="border-t border-slate-200/80 p-3">
          {!isCollapsed ? (
            <div className="rounded-lg bg-slate-50/80 p-2.5 border border-slate-100 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <FileCheck2 className="h-3.5 w-3.5 text-blue-600" />
                <span>AICTE Portal v1.0.4</span>
              </div>
              <p className="mt-1 text-[10px] text-slate-500 leading-tight">
                National Grievance Oversight • HQ New Delhi
              </p>
            </div>
          ) : (
            <div className="flex justify-center text-slate-400">
              <FileCheck2 className="h-4 w-4" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
