'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import {
  BarChart3,
  Download,
  PieChart as PieIcon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Building2,
  FileText,
  ChevronRight,
  Layers,
  TrendingUp,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { useManagementData } from '@/lib/managementStore';
import { useMounted } from '@/lib/utils';
import { BureauType } from '@/types/dashboard';

export default function ReportsAndAnalyticsPage() {
  const shouldReduceMotion = useReducedMotion();
  const mounted = useMounted();
  const { cases, overlaps } = useManagementData();

  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filters
  const [bureauFilter, setBureauFilter] = useState<'ALL' | BureauType>('ALL');
  const [timeframeFilter, setTimeframeFilter] = useState<'ALL' | '30D' | '90D' | 'ACADEMIC_YEAR'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Dynamic categories
  const categories = useMemo(() => {
    const set = new Set(cases.map((c) => c.category));
    return Array.from(set).sort();
  }, [cases]);

  // Filtered dataset
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (bureauFilter !== 'ALL' && c.bureau !== bureauFilter) return false;
      if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;

      if (timeframeFilter !== 'ALL') {
        const subDate = new Date(c.submissionDate).getTime();
        const now = new Date('2026-10-25').getTime(); // Baseline reference date
        const daysDiff = (now - subDate) / (1000 * 3600 * 24);

        if (timeframeFilter === '30D' && daysDiff > 30) return false;
        if (timeframeFilter === '90D' && daysDiff > 90) return false;
        if (timeframeFilter === 'ACADEMIC_YEAR' && daysDiff > 365) return false;
      }

      return true;
    });
  }, [cases, bureauFilter, timeframeFilter, categoryFilter]);

  // Key KPI metrics calculated directly from filtered records
  const totalCases = filteredCases.length;
  const pendingCases = filteredCases.filter((c) => c.status === 'Pending').length;
  const underProcessCases = filteredCases.filter((c) => c.status === 'Under Process').length;
  const disposedCases = filteredCases.filter((c) => c.status === 'Disposed').length;
  const overdueCases = filteredCases.filter((c) => c.status === 'Overdue').length;

  const pgrcOverdue = filteredCases.filter((c) => c.bureau === 'PGRC' && c.status === 'Overdue').length;
  const rbOverdue = filteredCases.filter(
    (c) => c.bureau === 'Regulation Bureau' && c.status === 'Overdue'
  ).length;

  const resolutionRate = totalCases > 0 ? Math.round((disposedCases / totalCases) * 100) : 0;

  // 1. Status Chart Data
  const statusChartData = useMemo(() => {
    const colors = {
      Pending: '#F59E0B',
      'Under Process': '#6366F1',
      Disposed: '#10B981',
      Overdue: '#EF4444',
    };

    return [
      { name: 'Pending', value: pendingCases, color: colors.Pending },
      { name: 'Under Process', value: underProcessCases, color: colors['Under Process'] },
      { name: 'Disposed', value: disposedCases, color: colors.Disposed },
      { name: 'Overdue (Breach)', value: overdueCases, color: colors.Overdue },
    ].filter((item) => item.value > 0);
  }, [pendingCases, underProcessCases, disposedCases, overdueCases]);

  // 2. Complaint Inflow & Disposal Trend Over Time
  const trendData = useMemo(() => {
    return [
      { month: 'May 2026', received: 18, disposed: 14 },
      { month: 'Jun 2026', received: 26, disposed: 20 },
      { month: 'Jul 2026', received: 34, disposed: 28 },
      { month: 'Aug 2026', received: 42, disposed: 35 },
      { month: 'Sep 2026', received: 38, disposed: 31 },
      { month: 'Oct 2026', received: filteredCases.length || 29, disposed: disposedCases || 22 },
    ];
  }, [filteredCases.length, disposedCases]);

  // 3. Bureau Workload by Category
  const bureauWorkloadData = useMemo(() => {
    const catMap: Record<string, { category: string; pgrc: number; regulation: number }> = {};

    filteredCases.forEach((c) => {
      if (!catMap[c.category]) {
        catMap[c.category] = { category: c.category, pgrc: 0, regulation: 0 };
      }
      if (c.bureau === 'PGRC') {
        catMap[c.category].pgrc += 1;
      } else {
        catMap[c.category].regulation += 1;
      }
    });

    return Object.values(catMap).slice(0, 6);
  }, [filteredCases]);

  // 4. Region Distribution
  const regionData = useMemo(() => {
    const regMap: Record<string, { region: string; active: number; disposed: number }> = {};

    filteredCases.forEach((c) => {
      const reg = c.region || 'Northern';
      if (!regMap[reg]) {
        regMap[reg] = { region: reg, active: 0, disposed: 0 };
      }
      if (c.status === 'Disposed') {
        regMap[reg].disposed += 1;
      } else {
        regMap[reg].active += 1;
      }
    });

    return Object.values(regMap);
  }, [filteredCases]);

  // 5. Overlap Outcomes
  const overlapOutcomesData = useMemo(() => {
    const outcomeCounts: Record<string, number> = {
      'Awaiting Review': 0,
      'Confirmed Related': 0,
      'Confirmed Duplicate': 0,
      'Separate Matters': 0,
      'Further Investigation': 0,
    };

    overlaps.forEach((ovr) => {
      if (ovr.reviewStatus === 'Awaiting Review') outcomeCounts['Awaiting Review']++;
      else if (ovr.reviewStatus === 'Confirmed Related') outcomeCounts['Confirmed Related']++;
      else if (ovr.reviewStatus === 'Confirmed Duplicate') outcomeCounts['Confirmed Duplicate']++;
      else if (ovr.reviewStatus === 'Separate Matters') outcomeCounts['Separate Matters']++;
      else outcomeCounts['Further Investigation']++;
    });

    return [
      { name: 'Awaiting Review', count: outcomeCounts['Awaiting Review'], color: '#F59E0B' },
      { name: 'Confirmed Related', count: outcomeCounts['Confirmed Related'], color: '#3B82F6' },
      { name: 'Confirmed Duplicate', count: outcomeCounts['Confirmed Duplicate'], color: '#EF4444' },
      { name: 'Separate Matters', count: outcomeCounts['Separate Matters'], color: '#10B981' },
      { name: 'Further Investigation', count: outcomeCounts['Further Investigation'], color: '#8B5CF6' },
    ];
  }, [overlaps]);

  // 6. Top Institutions by Complaint Distribution
  const topInstitutions = useMemo(() => {
    const countMap: Record<
      string,
      { code: string; name: string; state: string; total: number; pending: number; overdue: number }
    > = {};

    filteredCases.forEach((c) => {
      if (!countMap[c.institutionCode]) {
        countMap[c.institutionCode] = {
          code: c.institutionCode,
          name: c.institutionName,
          state: c.state,
          total: 0,
          pending: 0,
          overdue: 0,
        };
      }
      countMap[c.institutionCode].total += 1;
      if (c.status === 'Pending' || c.status === 'Under Process') {
        countMap[c.institutionCode].pending += 1;
      }
      if (c.status === 'Overdue') {
        countMap[c.institutionCode].overdue += 1;
      }
    });

    return Object.values(countMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredCases]);

  // 7. Long-pending / Overdue cases list
  const longPendingCases = useMemo(() => {
    return filteredCases
      .filter((c) => c.status === 'Overdue' || c.status === 'Pending')
      .sort((a, b) => new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime())
      .slice(0, 5);
  }, [filteredCases]);

  // CSV Export Function
  const exportToCSV = () => {
    const headers = [
      'Case ID',
      'Institution Name',
      'Institution Code',
      'Bureau',
      'Category',
      'Priority',
      'Status',
      'Date Received',
      'Expected Disposal',
      'Assigned Officer',
      'Has Overlap Alert',
      'Management Flagged',
      'Subject',
    ];

    const rows = filteredCases.map((c) => [
      `"${c.caseNumber}"`,
      `"${c.institutionName.replace(/"/g, '""')}"`,
      `"${c.institutionCode}"`,
      `"${c.bureau}"`,
      `"${c.category}"`,
      `"${c.priority}"`,
      `"${c.status}"`,
      `"${c.submissionDate}"`,
      `"${c.expectedDisposalDate}"`,
      `"${c.assignedOfficer.replace(/"/g, '""')}"`,
      `"${c.hasOverlapAlert ? 'YES' : 'NO'}"`,
      `"${c.managementFlagged ? 'YES' : 'NO'}"`,
      `"${c.subject.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `AICTE_Management_Grievance_Report_${new Date().toISOString().substring(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stagger animation definitions
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.25 },
    },
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      {/* Sidebar */}
      <Sidebar
        activeTab="reports"
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Content with Proper Sidebar Margin & Transition */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Navbar
          onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
          isSidebarOpen={isSidebarOpenMobile}
          searchQuery=""
          onSearchChange={() => {}}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Header & Controls */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Link href="/management" className="hover:text-blue-600 transition-colors">
                    Senior Management
                  </Link>
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                  <span className="text-slate-800 font-semibold">Reports & Analytics</span>
                </div>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                  Executive Reports & Grievance Intelligence
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comprehensive performance analytics, disposal ratios, regional workloads, and overlap audit logs
                </p>
              </div>

              {/* CSV Export Action Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700 transition"
                >
                  <Download className="h-4 w-4" />
                  Export Filtered CSV ({filteredCases.length})
                </button>
              </div>
            </motion.div>

            {/* Fictional Demonstration Data Notice Banner */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 flex items-start gap-2.5"
            >
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Demonstration Dataset Active:</span> All complaints,
                resolution velocities, and overlap correlation metrics shown on this page are
                fictional demonstration records generated for the AICTE Smart India Hackathon prototype.
              </div>
            </motion.div>

            {/* Filter Bar */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {/* Bureau Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium">Bureau:</span>
                    <select
                      value={bureauFilter}
                      onChange={(e) => setBureauFilter(e.target.value as 'ALL' | BureauType)}
                      className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="ALL">All Bureaus (Combined)</option>
                      <option value="PGRC">PGRC only</option>
                      <option value="Regulation Bureau">Regulation Bureau only</option>
                    </select>
                  </div>

                  {/* Timeframe Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium">Time Horizon:</span>
                    <select
                      value={timeframeFilter}
                      onChange={(e) =>
                        setTimeframeFilter(
                          e.target.value as 'ALL' | '30D' | '90D' | 'ACADEMIC_YEAR'
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="ALL">All Recorded History</option>
                      <option value="30D">Last 30 Days</option>
                      <option value="90D">Last 90 Days</option>
                      <option value="ACADEMIC_YEAR">Current Academic Cycle (2026-27)</option>
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium">Category:</span>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="ALL">All Categories</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  Data reflects real-time prototype state
                </div>
              </div>
            </motion.div>

            {/* Quick Computed Metrics */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Filtered Volume</span>
                  <FileText className="h-4 w-4 text-blue-500" />
                </div>
                <div className="mt-1 text-2xl font-bold text-slate-900">{totalCases}</div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  {disposedCases} Disposed • {pendingCases + underProcessCases} Active
                </div>
              </motion.div>

              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs text-emerald-700">
                  <span>Resolution Clearance</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="mt-1 text-2xl font-bold text-emerald-800">{resolutionRate}%</div>
                <div className="mt-0.5 text-[11px] text-emerald-600">Disposal rate across filters</div>
              </motion.div>

              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs text-rose-700">
                  <span>Overdue Cases by Bureau</span>
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                </div>
                <div className="mt-1 text-2xl font-bold text-rose-800">{overdueCases}</div>
                <div className="mt-0.5 text-[11px] text-rose-600">
                  {pgrcOverdue} in PGRC • {rbOverdue} in Regulation
                </div>
              </motion.div>

              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs text-purple-700">
                  <span>Cross-Bureau Overlaps</span>
                  <Sparkles className="h-4 w-4 text-purple-600" />
                </div>
                <div className="mt-1 text-2xl font-bold text-purple-800">{overlaps.length}</div>
                <div className="mt-0.5 text-[11px] text-purple-600">
                  {overlaps.filter((o) => o.reviewStatus === 'Confirmed Related').length} Confirmed
                  Related
                </div>
              </motion.div>
            </motion.div>

            {/* Trend Chart: Inflow vs Disposal Over Time */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">
                    Complaint Inflow & Resolution Velocity Trend
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Monthly case receipts vs case disposals across current monitoring cycle
                  </p>
                </div>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>

              <div className="mt-4 h-64 w-full">
                {!mounted ? (
                  <div className="h-full w-full animate-pulse bg-slate-100 rounded-lg" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorDisposed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px',
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        height={32}
                        formatter={(value) => (
                          <span className="text-xs text-slate-700">
                            {value === 'received' ? 'Complaints Lodged' : 'Complaints Resolved'}
                          </span>
                        )}
                      />
                      <Area
                        type="monotone"
                        dataKey="received"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorReceived)"
                        name="received"
                      />
                      <Area
                        type="monotone"
                        dataKey="disposed"
                        stroke="#10B981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorDisposed)"
                        name="disposed"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>

            {/* Row 1 Charts: Status Donut & Bureau Workload */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 gap-6 lg:grid-cols-2"
            >
              {/* Chart 1: Status Distribution */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900">
                      Disposal & Status Breakdown
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Pending vs Under Process vs Disposed vs SLA Breaches
                    </p>
                  </div>
                  <PieIcon className="h-4 w-4 text-slate-400" />
                </div>

                <div className="mt-4 h-64 w-full">
                  {!mounted ? (
                    <div className="h-full w-full animate-pulse bg-slate-100 rounded-lg" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={95}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${value} cases`, 'Volume']}
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            fontSize: '12px',
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          iconType="circle"
                          formatter={(value) => <span className="text-xs text-slate-700">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chart 2: Bureau Workload Comparison */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900">
                      Bureau Workload by Grievance Category
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Comparative caseload: PGRC (Blue) vs Regulation Bureau (Emerald)
                    </p>
                  </div>
                  <BarChart3 className="h-4 w-4 text-slate-400" />
                </div>

                <div className="mt-4 h-64 w-full">
                  {!mounted ? (
                    <div className="h-full w-full animate-pulse bg-slate-100 rounded-lg" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={bureauWorkloadData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis
                          dataKey="category"
                          tick={{ fontSize: 10, fill: '#64748B' }}
                          tickLine={false}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                          height={45}
                        />
                        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            fontSize: '12px',
                          }}
                        />
                        <Legend
                          verticalAlign="top"
                          height={30}
                          formatter={(value) => (
                            <span className="text-xs text-slate-700">
                              {value === 'pgrc' ? 'PGRC Cell' : 'Regulation Bureau'}
                            </span>
                          )}
                        />
                        <Bar dataKey="pgrc" fill="#3B82F6" radius={[4, 4, 0, 0]} name="pgrc" />
                        <Bar
                          dataKey="regulation"
                          fill="#10B981"
                          radius={[4, 4, 0, 0]}
                          name="regulation"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Row 2 Charts: Regional Distribution & Overlap Outcomes */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 gap-6 lg:grid-cols-2"
            >
              {/* Chart 3: Regional Distribution */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900">
                      Regional Case Load & Outcomes
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Active cases vs disposed cases by AICTE region
                    </p>
                  </div>
                  <Layers className="h-4 w-4 text-slate-400" />
                </div>

                <div className="mt-4 h-64 w-full">
                  {!mounted ? (
                    <div className="h-full w-full animate-pulse bg-slate-100 rounded-lg" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={regionData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis
                          dataKey="region"
                          tick={{ fontSize: 11, fill: '#64748B' }}
                          tickLine={false}
                        />
                        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            fontSize: '12px',
                          }}
                        />
                        <Legend
                          verticalAlign="top"
                          height={30}
                          formatter={(value) => (
                            <span className="text-xs text-slate-700">
                              {value === 'active' ? 'Active / In Progress' : 'Disposed / Closed'}
                            </span>
                          )}
                        />
                        <Bar dataKey="active" fill="#6366F1" radius={[4, 4, 0, 0]} name="active" />
                        <Bar
                          dataKey="disposed"
                          fill="#10B981"
                          radius={[4, 4, 0, 0]}
                          name="disposed"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chart 4: Overlap Detection Outcomes */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900">
                      Overlap Detection Review Outcomes
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Current status of flagged parallel cross-bureau cases
                    </p>
                  </div>
                  <Sparkles className="h-4 w-4 text-purple-600" />
                </div>

                <div className="mt-4 h-64 w-full">
                  {!mounted ? (
                    <div className="h-full w-full animate-pulse bg-slate-100 rounded-lg" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={overlapOutcomesData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={140}
                          tick={{ fontSize: 11, fill: '#475569' }}
                          tickLine={false}
                        />
                        <Tooltip
                          formatter={(value) => [`${value} alerts`, 'Count']}
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            fontSize: '12px',
                          }}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                          {overlapOutcomesData.map((entry, index) => (
                            <Cell key={`cell-overlap-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Row 3: Tables Section - Institution Concentration & Long Pending */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 gap-6 lg:grid-cols-2"
            >
              {/* Table 1: Top Institutions by Complaint Volume */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold text-sm text-slate-900">
                      Institution Complaint Concentration
                    </h3>
                  </div>
                  <Link
                    href="/management/institutions"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Directory <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[400px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-500 uppercase">
                        <th className="py-2">Institution</th>
                        <th className="py-2">State</th>
                        <th className="py-2 text-center">Total</th>
                        <th className="py-2 text-center">Pending</th>
                        <th className="py-2 text-center">Overdue</th>
                        <th className="py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {topInstitutions.map((inst) => (
                        <tr key={inst.code} className="hover:bg-slate-50/70">
                          <td className="py-2.5 font-medium text-slate-900 max-w-[170px] truncate">
                            {inst.name}
                          </td>
                          <td className="py-2.5 text-slate-600">{inst.state}</td>
                          <td className="py-2.5 text-center font-bold text-slate-800">
                            {inst.total}
                          </td>
                          <td className="py-2.5 text-center text-amber-700 font-medium">
                            {inst.pending}
                          </td>
                          <td className="py-2.5 text-center">
                            {inst.overdue > 0 ? (
                              <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                                {inst.overdue}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="py-2.5 text-right">
                            <Link
                              href={`/management/institutions/${inst.code}`}
                              className="text-blue-600 hover:underline text-[11px]"
                            >
                              Profile
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table 2: Long-Pending & Breached SLA Cases */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-rose-600" />
                    <h3 className="font-semibold text-sm text-slate-900">
                      Critical / Long-Pending Cases
                    </h3>
                  </div>
                  <Link
                    href="/management/cases"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    All Cases <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[400px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-500 uppercase">
                        <th className="py-2">Case ID</th>
                        <th className="py-2">Bureau</th>
                        <th className="py-2">Received</th>
                        <th className="py-2">Target SLA</th>
                        <th className="py-2">Status</th>
                        <th className="py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {longPendingCases.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 font-mono font-medium text-blue-600">
                            {c.caseNumber}
                          </td>
                          <td className="py-2.5 text-slate-600 text-[11px]">{c.bureau}</td>
                          <td className="py-2.5 text-slate-500 text-[11px]">{c.submissionDate}</td>
                          <td className="py-2.5 text-rose-600 font-medium text-[11px]">
                            {c.expectedDisposalDate}
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                c.status === 'Overdue'
                                  ? 'bg-rose-100 text-rose-800 font-bold'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            <Link
                              href={`/management/cases/${c.caseNumber}`}
                              className="text-blue-600 hover:underline text-[11px]"
                            >
                              Dossier
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
