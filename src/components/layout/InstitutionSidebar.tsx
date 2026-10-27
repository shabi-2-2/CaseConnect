'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  BellRing,
  FolderKanban,
  SendHorizontal,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ArrowRightLeft,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useInstitution } from '@/lib/institution-context';

export type InstitutionNavTab =
  | 'overview'
  | 'notices'
  | 'cases'
  | 'compliance'
  | 'profile';

interface InstitutionSidebarProps {
  activeTab?: InstitutionNavTab;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  badgeCounts?: {
    notices?: number;
    cases?: number;
    compliance?: number;
  };
}

export function InstitutionSidebar({
  activeTab,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
  badgeCounts,
}: InstitutionSidebarProps) {
  const pathname = usePathname();
  const { activeCode, setActiveCode, activeInstitution, availableInstitutions } = useInstitution();
  const [showSwitchModal, setShowSwitchModal] = React.useState(false);

  const currentTab: InstitutionNavTab = React.useMemo(() => {
    if (activeTab) return activeTab;
    if (!pathname) return 'overview';
    if (pathname === '/institution-dashboard/notices' || pathname.startsWith('/institution-dashboard/notices/')) return 'notices';
    if (pathname === '/institution-dashboard/cases' || pathname.startsWith('/institution-dashboard/cases/')) return 'cases';
    if (pathname === '/institution-dashboard/compliance' || pathname.startsWith('/institution-dashboard/compliance/')) return 'compliance';
    if (pathname === '/institution-dashboard/profile') return 'profile';
    return 'overview';
  }, [activeTab, pathname]);

  const navItems = [
    {
      id: 'overview' as InstitutionNavTab,
      label: 'Institution Overview',
      icon: Building2,
      href: '/institution-dashboard',
      badge: null,
    },
    {
      id: 'notices' as InstitutionNavTab,
      label: 'Grievance Notices',
      icon: BellRing,
      href: '/institution-dashboard/notices',
      badge: badgeCounts?.notices ? String(badgeCounts.notices) : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'cases' as InstitutionNavTab,
      label: 'Case Dossiers',
      icon: FolderKanban,
      href: '/institution-dashboard/cases',
      badge: badgeCounts?.cases ? String(badgeCounts.cases) : null,
      badgeColor: 'bg-blue-500 text-white',
    },
    {
      id: 'compliance' as InstitutionNavTab,
      label: 'Compliance & Replies',
      icon: SendHorizontal,
      href: '/institution-dashboard/compliance',
      badge: badgeCounts?.compliance ? String(badgeCounts.compliance) : null,
      badgeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'profile' as InstitutionNavTab,
      label: 'Campus Profile & Nodal',
      icon: UserCheck,
      href: '/institution-dashboard/profile',
      badge: null,
    },
  ];

  return (
    <>
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-slate-200/80 bg-[#002b5c] text-white transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        aria-label="Institution Portal Navigation"
      >
        {/* Brand & Collapse Header */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-white shadow-md">
                <Building2 className="h-5 w-5 text-emerald-300" />
              </div>
              <div className="flex flex-col truncate">
                <span className="font-bold text-white text-sm tracking-tight flex items-center gap-1.5">
                  CaseConnect
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-300 border border-emerald-400/20">
                    CAMPUS
                  </span>
                </span>
                <span className="text-[10px] text-white/70 truncate uppercase tracking-wider font-semibold">
                  Institution Portal
                </span>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-white">
              <Building2 className="h-5 w-5 text-emerald-300" />
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Institution Identity Card & Fast Switcher */}
        {!isCollapsed && (
          <div className="mx-3 mt-3.5 mb-1 rounded-xl bg-white/10 p-3 border border-white/10 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
                Approved Campus
              </span>
              <button
                onClick={() => setShowSwitchModal(true)}
                className="text-[10px] text-white/80 hover:text-white flex items-center gap-1 bg-white/10 hover:bg-white/20 px-1.5 py-0.5 rounded transition-colors"
                title="Switch test institution"
              >
                <ArrowRightLeft className="h-2.5 w-2.5" />
                <span>Switch</span>
              </button>
            </div>
            <div className="mt-1 text-xs font-bold text-white truncate" title={activeInstitution.name}>
              {activeInstitution.name}
            </div>
            <div className="mt-0.5 flex items-center justify-between text-[10px] text-white/70">
              <span className="font-mono text-emerald-200">ID: {activeInstitution.code}</span>
              <span>{activeInstitution.region}</span>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          {!isCollapsed && (
            <div className="px-2 pb-1.5 text-[10px] font-semibold tracking-wider text-white/40 uppercase">
              Compliance Ledger
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
                    ? 'bg-white/15 text-white shadow-xs'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicatorInst"
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-emerald-400"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}

                <Icon
                  className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-emerald-300' : 'text-white/70 group-hover:text-white'
                  }`}
                />

                {!isCollapsed && (
                  <>
                    <span className="truncate flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                          item.badgeColor || 'bg-white/20 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3" />
      </aside>

      {/* Switch Institution Modal for Evaluators */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Switch Active Institution</h3>
                <p className="text-xs text-slate-500">Select campus profile to evaluate isolated compliance data</p>
              </div>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2 max-h-80 overflow-y-auto pr-1">
              {availableInstitutions.map((inst) => {
                const isSelected = inst.code === activeCode;
                return (
                  <button
                    key={inst.code}
                    onClick={() => {
                      setActiveCode(inst.code);
                      setShowSwitchModal(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 text-slate-900 font-semibold'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900">{inst.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">ID: {inst.code}</span>
                        <span>•</span>
                        <span>{inst.region} Region</span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 text-right">
              <button
                onClick={() => setShowSwitchModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
