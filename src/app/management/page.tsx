'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Download,
  RefreshCw,
  ShieldCheck,
  LayoutDashboard,
  Building2,
  FolderKanban,
  CopyCheck,
  BarChart3,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { StatusDonutChart } from '@/components/charts/StatusDonutChart';
import { WorkloadBarChart } from '@/components/charts/WorkloadBarChart';
import { RegionBarChart } from '@/components/charts/RegionBarChart';
import { ManagementAttentionTable } from '@/components/dashboard/ManagementAttentionTable';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { CaseDetailsModal } from '@/components/dashboard/CaseDetailsModal';
import { PlaceholderView } from '@/components/dashboard/PlaceholderView';
import { KPI_DATA } from '@/data/mockData';
import { CaseItem } from '@/types/dashboard';
import { useMounted } from '@/lib/utils';
import { fetchComplaints } from '@/lib/complaints-api';

export type NavTab = 'overview' | 'institutions' | 'cases' | 'overlaps' | 'reports';

export default function SeniorManagementDashboard() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [allCases, setAllCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const mounted = useMounted();

  const loadCases = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      setError(null);
      const data = await fetchComplaints();
      setAllCases(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
      if (showRefresh) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCases(false);
    pollingRef.current = setInterval(() => loadCases(false), 8000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const formattedDate = mounted
    ? new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Saturday, 24 October 2026';

  const handleRefresh = () => {
    loadCases(true);
  };

  const handleSelectCaseById = (caseId: string) => {
    const found = allCases.find((c) => c.id === caseId || c.caseNumber === caseId);
    if (found) {
      setSelectedCase(found);
      setActiveTab('overview');
    }
  };

  const handleViewRelatedCase = (relatedCaseNumber: string) => {
    const found = allCases.find((c) => c.caseNumber === relatedCaseNumber);
    if (found) {
      setSelectedCase(found);
    }
  };

  const handleKpiCardClick = (kpiId: string) => {
    if (kpiId === 'open-overlap-alerts') {
      setSearchQuery('Apex');
    } else if (kpiId === 'overdue-cases') {
      setSearchQuery('Overdue');
    }
    const tableElement = document.getElementById('management-attention-section');
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navItems = [
    { id: 'overview' as NavTab, label: 'Overview', icon: LayoutDashboard, badge: null },
    { id: 'institutions' as NavTab, label: 'Institution Directory', icon: Building2, badge: null },
    { id: 'cases' as NavTab, label: 'All Cases', icon: FolderKanban, badge: '1,482' },
    { id: 'overlaps' as NavTab, label: 'Overlap Detection Centre', icon: CopyCheck, badge: '18', badgeColor: 'bg-purple-100 text-purple-700 font-bold' },
    { id: 'reports' as NavTab, label: 'Reports & Analytics', icon: BarChart3, badge: null },
  ];

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
              <ShieldCheck className="h-5 w-5 text-amber-300" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-white text-sm tracking-tight">CaseConnect</span>
                <span className="text-[10px] text-white/70 truncate uppercase tracking-wider font-semibold">Senior Management</span>
              </div>
            )}
          </div>
        </div>

        {!isCollapsed && (
          <div className="mx-3 mt-3.5 mb-1 rounded-lg bg-white/5 p-2.5 border border-white/10">
            <div className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Role</div>
            <div className="mt-1 text-xs font-semibold text-white">Senior Management</div>
            <div className="mt-0.5 text-[10px] text-white/60">AICTE Central HQ Oversight</div>
          </div>
        )}

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          <div className={`px-2 pb-1.5 text-[10px] font-semibold tracking-wider text-white/40 uppercase ${isCollapsed ? 'text-center' : ''}`}>
            {isCollapsed ? '•••' : 'Main Navigation'}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (isSidebarOpenMobile) setIsSidebarOpenMobile(false);
                }}
                title={isCollapsed ? item.label : undefined}
                className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                  isActive ? 'bg-white/15 text-white shadow-xs' : 'text-white/80 hover:bg-white/10 hover:text-white'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mgmtActive"
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-amber-400"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-white/70 group-hover:text-white'}`} />
                {!isCollapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
                {!isCollapsed && item.badge && (
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.badgeColor || 'bg-slate-100/20 text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          <Link href="/pgrc-dashboard" className={`mt-4 group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all text-white/80 hover:bg-white/10 hover:text-white ${isCollapsed ? 'justify-center px-2' : ''}`}>
            <ShieldCheck className="h-4 w-4 shrink-0 text-white/70 group-hover:text-white" />
            {!isCollapsed && <span className="truncate flex-1 text-left">PGRC Official Dashboard</span>}
          </Link>
          <Link href="/" className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all text-white/80 hover:bg-white/10 hover:text-white ${isCollapsed ? 'justify-center px-2' : ''}`}>
            <FileText className="h-4 w-4 shrink-0 text-white/70 group-hover:text-white" />
            {!isCollapsed && <span className="truncate flex-1 text-left">Switch Role / Home</span>}
          </Link>
        </nav>
      </aside>

      {isSidebarOpenMobile && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden" onClick={() => setIsSidebarOpenMobile(false)} />
      )}

      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <Navbar
          onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
          isSidebarOpen={isSidebarOpenMobile}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectCase={handleSelectCaseById}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {activeTab !== 'overview' ? (
            <PlaceholderView tab={activeTab} onBackToOverview={() => setActiveTab('overview')} />
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200/80 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 border border-blue-200">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                      Senior Management
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                  <h1 className="mt-2 font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">
                    Institution Complaint Monitoring & Status Dashboard
                  </h1>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
                    Integrated senior management oversight monitoring technical education grievances handled by PGRC and Regulation Bureau.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:self-start md:self-auto">
                  <Link href="/pgrc-dashboard" className="inline-flex items-center gap-1.5 rounded-lg border border-[#002b5c]/30 bg-white px-3 py-2 text-xs font-semibold text-[#002b5c] shadow-2xs hover:bg-[#002b5c]/5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>PGRC Official Dashboard</span>
                  </Link>
                  <button onClick={handleRefresh} disabled={isRefreshing} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                    <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
                  </button>
                  <button onClick={() => alert('AICTE Executive Briefing PDF Generated: Summary of 1,482 cases across 8 regional directorates downloaded.')} className="inline-flex items-center gap-1.5 rounded-lg bg-[#003366] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    <Download className="h-3.5 w-3.5" />
                    <span>Export Report</span>
                  </button>
                </div>
              </div>

              <section aria-label="Key Performance Indicators">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
                  {KPI_DATA.map((kpi, index) => (
                    <KpiCard key={kpi.id} metric={kpi} index={index} onClick={() => handleKpiCardClick(kpi.id)} />
                  ))}
                </div>
              </section>

              <section aria-label="Analytics & Workload Charts" className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }} className="lg:col-span-4">
                  <StatusDonutChart />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }} className="lg:col-span-8">
                  <WorkloadBarChart />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.25 }} className="lg:col-span-12">
                  <RegionBarChart />
                </motion.div>
              </section>

              <section id="management-attention-section" aria-label="Management Attention and Activity Feed" className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.3 }} className="lg:col-span-8">
                  <ManagementAttentionTable cases={allCases} onViewCase={(c) => setSelectedCase(c)} externalSearchQuery={searchQuery} />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.35 }} className="lg:col-span-4">
                  <RecentActivityFeed onSelectCase={handleSelectCaseById} />
                </motion.div>
              </section>
            </div>
          )}
        </main>
      </div>

      <CaseDetailsModal
        selectedCase={selectedCase}
        onClose={() => setSelectedCase(null)}
        onViewRelatedCase={handleViewRelatedCase}
        onStatusUpdated={(updated) => {
          setAllCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          setSelectedCase(updated);
        }}
        allowStatusEdit={true}
      />
    </div>
  );
}
