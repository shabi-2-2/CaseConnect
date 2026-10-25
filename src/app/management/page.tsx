'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Download,
  RefreshCw,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { Sidebar, NavTab } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { StatusDonutChart } from '@/components/charts/StatusDonutChart';
import { WorkloadBarChart } from '@/components/charts/WorkloadBarChart';
import { RegionBarChart } from '@/components/charts/RegionBarChart';
import { ManagementAttentionTable } from '@/components/dashboard/ManagementAttentionTable';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { CaseDetailsModal } from '@/components/dashboard/CaseDetailsModal';
import { KPI_DATA, SAMPLE_CASES } from '@/data/mockData';
import { CaseItem } from '@/types/dashboard';
import { useMounted } from '@/lib/utils';

export default function SeniorManagementDashboard() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mounted = useMounted();

  const formattedDate = mounted
    ? new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Saturday, 24 October 2026';

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 700);
  };

  const handleSelectCaseById = (caseId: string) => {
    const found = SAMPLE_CASES.find(
      (c) => c.id === caseId || c.caseNumber === caseId
    );
    if (found) {
      setSelectedCase(found);
      setActiveTab('overview');
    }
  };

  const handleViewRelatedCase = (relatedCaseNumber: string) => {
    const found = SAMPLE_CASES.find((c) => c.caseNumber === relatedCaseNumber);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Wrapper */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Navbar */}
        <Navbar
          onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
          isSidebarOpen={isSidebarOpenMobile}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectCase={handleSelectCaseById}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div className="space-y-6">
              {/* Role Switch Banner */}
              <div className="flex items-center justify-between rounded-lg bg-blue-50/80 border border-blue-200/80 px-4 py-2 text-xs text-blue-900">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-700" />
                  <span>Logged in as <strong>Senior Management</strong> (AICTE Central HQ Oversight)</span>
                </span>
                <Link
                  href="/"
                  className="flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Switch Role</span>
                </Link>
              </div>

              {/* Main Content Header */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200/80 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 border border-blue-200">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                      Executive Oversight Portal
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
                    Integrated senior management oversight monitoring technical education grievances
                    handled by the <span className="font-semibold text-blue-800">Public Grievance Redressal Cell (PGRC)</span> and the{' '}
                    <span className="font-semibold text-amber-800">Regulation Bureau (RB)</span>.
                  </p>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 sm:self-start md:self-auto">
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    title="Refresh data"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 text-slate-500 ${
                        isRefreshing ? 'animate-spin text-blue-600' : ''
                      }`}
                    />
                    <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
                  </button>

                  <button
                    onClick={() => {
                      alert(
                        'AICTE Executive Briefing PDF Generated: Summary of 1,482 cases across 8 regional directorates downloaded.'
                      );
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#003366] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export Report</span>
                  </button>
                </div>
              </div>

              {/* Section 1: KPI Cards (6 cards) */}
              <section aria-label="Key Performance Indicators">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
                  {KPI_DATA.map((kpi, index) => (
                    <KpiCard
                      key={kpi.id}
                      metric={kpi}
                      index={index}
                      onClick={() => handleKpiCardClick(kpi.id)}
                    />
                  ))}
                </div>
              </section>

              {/* Section 2: Interactive Charts (3 charts) */}
              <section
                aria-label="Analytics & Workload Charts"
                className="grid grid-cols-1 lg:grid-cols-12 gap-5"
              >
                {/* Donut Chart: Cases by status (4 cols) */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.15 }}
                  className="lg:col-span-4"
                >
                  <StatusDonutChart />
                </motion.div>

                {/* Workload Bar Chart: PGRC vs Regulation Bureau (8 cols) */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.2 }}
                  className="lg:col-span-8"
                >
                  <WorkloadBarChart />
                </motion.div>

                {/* Regional Bar Chart: 7 Jurisdictions (full 12 cols) */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.25 }}
                  className="lg:col-span-12"
                >
                  <RegionBarChart />
                </motion.div>
              </section>

              {/* Section 3: Management Attention Table & Recent Activity Feed */}
              <section
                id="management-attention-section"
                aria-label="Management Attention and Activity Feed"
                className="grid grid-cols-1 lg:grid-cols-12 gap-5"
              >
                {/* Management Attention Table (8 cols on lg) */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.3 }}
                  className="lg:col-span-8"
                >
                  <ManagementAttentionTable
                    cases={SAMPLE_CASES}
                    onViewCase={(c) => setSelectedCase(c)}
                    externalSearchQuery={searchQuery}
                  />
                </motion.div>

                {/* Compact Activity Feed (4 cols on lg) */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.35 }}
                  className="lg:col-span-4"
                >
                  <RecentActivityFeed onSelectCase={handleSelectCaseById} />
                </motion.div>
              </section>
            </div>
        </main>
      </div>

      {/* Case Details Modal Dialog */}
      <CaseDetailsModal
        selectedCase={selectedCase}
        onClose={() => setSelectedCase(null)}
        onViewRelatedCase={handleViewRelatedCase}
      />
    </div>
  );
}
