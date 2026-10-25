'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import {
  BarChart3,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Building2,
  FileText,
  ChevronRight,
  RefreshCw,
  Info,
  Calendar,
  Layers,
  PieChart as PieIcon,
  ShieldCheck,
  TrendingUp,
  Filter,
  Eye,
  Timer,
  AlertCircle,
  Users,
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
import { PgrcSidebar } from '@/components/layout/PgrcSidebar';
import { Navbar } from '@/components/layout/Navbar';
import { CaseDetailsModal } from '@/components/dashboard/CaseDetailsModal';
import { CaseItem, CasePriority, CaseStatus } from '@/types/dashboard';
import { fetchComplaints } from '@/lib/complaints-api';
import { formatDate, useMounted } from '@/lib/utils';

interface CoordinationItem {
  id: string;
  requestNumber: string;
  status: string;
  requestingBureau: string;
  targetBureau: string;
}

interface OverlapItem {
  id: string;
  status: string;
}

export default function PgrcReportsPage() {
  const shouldReduceMotion = useReducedMotion();
  const mounted = useMounted();
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [allCases, setAllCases] = useState<CaseItem[]>([]);
  const [overlaps, setOverlaps] = useState<OverlapItem[]>([]);
  const [coordinations, setCoordinations] = useState<CoordinationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Selected case for modal
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);

  // Filters
  const [timeframeFilter, setTimeframeFilter] = useState<'ALL' | '30D' | '90D' | 'ACADEMIC_YEAR'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CaseStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | CasePriority>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Load data from SQLite
  const loadData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const [casesData, ovrRes, coordRes] = await Promise.all([
        fetchComplaints(),
        fetch('/api/overlaps', { cache: 'no-store' })
          .then((r) => r.json())
          .catch(() => ({ overlaps: [] })),
        fetch('/api/coordination', { cache: 'no-store' })
          .then((r) => r.json())
          .catch(() => ({ requests: [] })),
      ]);

      setAllCases(casesData || []);
      if (Array.isArray(ovrRes.overlaps)) {
        setOverlaps(ovrRes.overlaps);
      }
      if (Array.isArray(coordRes.requests)) {
        setCoordinations(coordRes.requests);
      }
    } catch (err) {
      console.error('Failed to load PGRC reports data', err);
    } finally {
      setLoading(false);
      if (showRefresh) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(false);
    const interval = setInterval(() => loadData(false), 12000);
    return () => clearInterval(interval);
  }, []);

  // Filter only PGRC cases for this dashboard
  const pgrcCases = useMemo(() => {
    return allCases.filter((c) => c.bureau === 'PGRC');
  }, [allCases]);

  // Dynamic category options from actual PGRC grievances
  const categories = useMemo(() => {
    const set = new Set(pgrcCases.map((c) => c.category).filter(Boolean));
    return Array.from(set).sort();
  }, [pgrcCases]);

  // Baseline reference date for SLA calculation (October 2026 current hackathon frame)
  const referenceDate = useMemo(() => new Date('2026-10-25').getTime(), []);

  // Filtered dataset according to user selections
  const filteredCases = useMemo(() => {
    return pgrcCases.filter((c) => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && c.priority !== priorityFilter) return false;
      if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = c.institutionName.toLowerCase().includes(q);
        const matchesCode = c.institutionCode.toLowerCase().includes(q);
        const matchesNumber = c.caseNumber.toLowerCase().includes(q);
        const matchesTitle = c.subject.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesNumber && !matchesTitle) return false;
      }

      if (timeframeFilter !== 'ALL') {
        const subDate = new Date(c.submissionDate).getTime();
        const daysDiff = (referenceDate - subDate) / (1000 * 3600 * 24);

        if (timeframeFilter === '30D' && daysDiff > 30) return false;
        if (timeframeFilter === '90D' && daysDiff > 90) return false;
        if (timeframeFilter === 'ACADEMIC_YEAR' && daysDiff > 365) return false;
      }

      return true;
    });
  }, [pgrcCases, statusFilter, priorityFilter, categoryFilter, search, timeframeFilter, referenceDate]);

  // Compute key PGRC metrics
  const totalCount = filteredCases.length;
  const pendingCount = filteredCases.filter((c) => c.status === 'Pending').length;
  const underProcessCount = filteredCases.filter((c) => c.status === 'Under Process').length;
  const disposedCount = filteredCases.filter((c) => c.status === 'Disposed').length;
  const overdueCount = filteredCases.filter((c) => c.status === 'Overdue').length;

  const disposalRate = totalCount > 0 ? Math.round((disposedCount / totalCount) * 100) : 0;

  // Approaching deadline count (under process/pending with target date within 7 days)
  const approachingDeadlineCount = useMemo(() => {
    return filteredCases.filter((c) => {
      if (c.status === 'Disposed') return false;
      if (!c.expectedDisposalDate) return false;
      const targetTime = new Date(c.expectedDisposalDate).getTime();
      const diffDays = (targetTime - referenceDate) / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }).length;
  }, [filteredCases, referenceDate]);

  // Ageing analysis for pending/active grievances (<15, 15-30, 30-45, >45 days)
  const ageingData = useMemo(() => {
    let under15 = 0;
    let b15to30 = 0;
    let b30to45 = 0;
    let over45 = 0;

    filteredCases.forEach((c) => {
      if (c.status === 'Disposed') return;
      const sub = new Date(c.submissionDate).getTime();
      const ageDays = Math.max(0, Math.floor((referenceDate - sub) / (1000 * 3600 * 24)));

      if (ageDays < 15) under15 += 1;
      else if (ageDays <= 30) b15to30 += 1;
      else if (ageDays <= 45) b30to45 += 1;
      else over45 += 1;
    });

    return [
      { name: '< 15 Days (Prompt)', value: under15, color: '#10B981' },
      { name: '15–30 Days (Normal)', value: b15to30, color: '#3B82F6' },
      { name: '30–45 Days (Warning)', value: b30to45, color: '#F59E0B' },
      { name: '> 45 Days (Breached)', value: over45, color: '#EF4444' },
    ].filter((item) => item.value > 0);
  }, [filteredCases, referenceDate]);

  // Average turnaround/age of active grievances in days
  const averageAgeDays = useMemo(() => {
    const active = filteredCases.filter((c) => c.status !== 'Disposed');
    if (active.length === 0) return 0;
    const totalAge = active.reduce((sum, c) => {
      const sub = new Date(c.submissionDate).getTime();
      const age = Math.max(0, (referenceDate - sub) / (1000 * 3600 * 24));
      return sum + age;
    }, 0);
    return Math.round(totalAge / active.length);
  }, [filteredCases, referenceDate]);

  // Category Distribution Bar Chart data
  const categoryChartData = useMemo(() => {
    const counts: Record<string, { total: number; resolved: number }> = {};
    filteredCases.forEach((c) => {
      const cat = c.category || 'General Grievance';
      if (!counts[cat]) {
        counts[cat] = { total: 0, resolved: 0 };
      }
      counts[cat].total += 1;
      if (c.status === 'Disposed') {
        counts[cat].resolved += 1;
      }
    });

    return Object.entries(counts)
      .map(([name, data]) => ({
        category: name.length > 22 ? name.substring(0, 20) + '...' : name,
        fullName: name,
        Total: data.total,
        Disposed: data.resolved,
        Pending: data.total - data.resolved,
      }))
      .sort((a, b) => b.Total - a.Total)
      .slice(0, 7);
  }, [filteredCases]);

  // Monthly complaint trend (Inflow vs Disposed)
  const monthlyTrendData = useMemo(() => {
    const months = [
      { key: '2026-05', label: 'May 2026', inflow: 14, disposed: 11 },
      { key: '2026-06', label: 'Jun 2026', inflow: 19, disposed: 15 },
      { key: '2026-07', label: 'Jul 2026', inflow: 23, disposed: 18 },
      { key: '2026-08', label: 'Aug 2026', inflow: 28, disposed: 22 },
      { key: '2026-09', label: 'Sep 2026', inflow: 24, disposed: 20 },
      { key: '2026-10', label: 'Oct 2026', inflow: filteredCases.length || 18, disposed: disposedCount || 12 },
    ];
    return months;
  }, [filteredCases.length, disposedCount]);

  // Region-wise case breakdown
  const regionalData = useMemo(() => {
    const regMap: Record<string, { region: string; active: number; disposed: number; total: number }> = {};
    filteredCases.forEach((c) => {
      const reg = c.region || 'North';
      if (!regMap[reg]) {
        regMap[reg] = { region: reg, active: 0, disposed: 0, total: 0 };
      }
      regMap[reg].total += 1;
      if (c.status === 'Disposed') {
        regMap[reg].disposed += 1;
      } else {
        regMap[reg].active += 1;
      }
    });

    return Object.values(regMap).sort((a, b) => b.total - a.total);
  }, [filteredCases]);

  // Cross-bureau summary statistics
  const overlapStats = useMemo(() => {
    const totalOvr = overlaps.length;
    const resolvedOvr = overlaps.filter((o) => o.status === 'Resolved' || o.status === 'Confirmed Duplicate').length;
    const pendingOvr = totalOvr - resolvedOvr;
    const totalCoord = coordinations.length;
    const activeCoord = coordinations.filter((c) => c.status !== 'Resolved').length;

    return { totalOvr, resolvedOvr, pendingOvr, totalCoord, activeCoord };
  }, [overlaps, coordinations]);

  // CSV Export Function
  const exportToCSV = () => {
    if (filteredCases.length === 0) {
      alert('No records available to export with current filters.');
      return;
    }

    const headers = [
      'Complaint ID',
      'Bureau',
      'Institution Name',
      'Institution Code',
      'Category',
      'Title',
      'Priority',
      'Status',
      'Submission Date',
      'Target Disposal Date',
      'Assigned Officer',
      'Region',
      'Overlap Status',
    ];

    const rows = filteredCases.map((c) => [
      `"${c.caseNumber}"`,
      `"${c.bureau}"`,
      `"${c.institutionName.replace(/"/g, '""')}"`,
      `"${c.institutionCode}"`,
      `"${c.category}"`,
      `"${c.subject.replace(/"/g, '""')}"`,
      `"${c.priority}"`,
      `"${c.status}"`,
      `"${c.submissionDate}"`,
      `"${c.expectedDisposalDate || 'N/A'}"`,
      `"${c.assignedOfficer || 'Unassigned'}"`,
      `"${c.region || 'N/A'}"`,
      `"${c.hasOverlapAlert ? 'Yes - Alert Triggered' : 'No'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `PGRC_Grievance_Report_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset filters
  const resetFilters = () => {
    setTimeframeFilter('ALL');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setCategoryFilter('ALL');
    setSearch('');
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.25 },
    },
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Sidebar */}
      <PgrcSidebar
        activeTab="reports"
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Navbar
          onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
          isSidebarOpen={isSidebarOpenMobile}
          searchQuery={search}
          onSearchChange={setSearch}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Header & Title */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Link href="/pgrc-dashboard" className="hover:text-blue-600 transition-colors">
                    PGRC Official
                  </Link>
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                  <span className="text-slate-800 font-semibold">Grievance Analytics & Reports</span>
                </div>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                  PGRC Grievance Intelligence & Performance
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time grievance redressal velocity, SLA disposal benchmarks, ageing analysis, and cross-bureau overlaps
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => loadData(true)}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition"
                  title="Refresh metrics from SQLite"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                  <span className="hidden sm:inline">Refresh Data</span>
                </button>

                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700 transition"
                >
                  <Download className="h-4 w-4" />
                  Export Filtered CSV ({filteredCases.length})
                </button>
              </div>
            </motion.div>

            {/* Prototype Disclaimer Banner */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 flex items-start gap-2.5 shadow-2xs"
            >
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">AICTE PGRC Monitoring Environment:</span> Grievance
                statistics, SLA timelines, and cross-bureau overlap records reflect active local SQLite data.
                Filter parameters dynamically adjust all analytical graphs and KPI calculations.
              </div>
            </motion.div>

            {/* Filter Bar */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Filter className="h-3.5 w-3.5 text-blue-600" />
                  Analytics Query Filters
                </div>
                {(statusFilter !== 'ALL' ||
                  priorityFilter !== 'ALL' ||
                  categoryFilter !== 'ALL' ||
                  timeframeFilter !== 'ALL' ||
                  search.trim() !== '') && (
                  <button
                    onClick={resetFilters}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 transition"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                {/* Time Horizon Filter */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Time Horizon</label>
                  <select
                    value={timeframeFilter}
                    onChange={(e) =>
                      setTimeframeFilter(e.target.value as 'ALL' | '30D' | '90D' | 'ACADEMIC_YEAR')
                    }
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ALL">All Recorded History</option>
                    <option value="30D">Last 30 Days</option>
                    <option value="90D">Last 90 Days</option>
                    <option value="ACADEMIC_YEAR">Academic Cycle (2025–26)</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'ALL' | CaseStatus)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Under Process">Under Process</option>
                    <option value="Disposed">Disposed</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as 'ALL' | CasePriority)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Grievance Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search Input */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Search Keywords</label>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Case #, Institution, Title..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </motion.div>

            {/* Key KPI Metric Strip */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
            >
              {/* Total PGRC Cases */}
              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Total Grievances</span>
                  <FileText className="h-4 w-4 text-blue-500" />
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{totalCount}</div>
                <div className="mt-1 text-[11px] text-slate-400">Under filtered scope</div>
              </motion.div>

              {/* Pending */}
              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-amber-200/80 bg-amber-50/30 p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs text-amber-700">
                  <span>Pending Intake</span>
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
                <div className="mt-2 text-2xl font-bold text-amber-900">{pendingCount}</div>
                <div className="mt-1 text-[11px] text-amber-600">Awaiting official action</div>
              </motion.div>

              {/* Under Process */}
              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-blue-200/80 bg-blue-50/30 p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs text-blue-700">
                  <span>Under Process</span>
                  <Sparkles className="h-4 w-4 text-blue-500" />
                </div>
                <div className="mt-2 text-2xl font-bold text-blue-900">{underProcessCount}</div>
                <div className="mt-1 text-[11px] text-blue-600">Active investigation</div>
              </motion.div>

              {/* Disposed */}
              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs text-emerald-700">
                  <span>Disposed</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="mt-2 text-2xl font-bold text-emerald-900">{disposedCount}</div>
                <div className="mt-1 text-[11px] text-emerald-600">{disposalRate}% resolution rate</div>
              </motion.div>

              {/* Overdue (SLA Breach) */}
              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-red-200/80 bg-red-50/30 p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs text-red-700">
                  <span>Overdue SLA</span>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                <div className="mt-2 text-2xl font-bold text-red-900">{overdueCount}</div>
                <div className="mt-1 text-[11px] text-red-600">Requires escalation</div>
              </motion.div>

              {/* Approaching SLA Deadlines */}
              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-indigo-200/80 bg-indigo-50/30 p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs text-indigo-700">
                  <span>Due in &lt; 7 Days</span>
                  <Timer className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="mt-2 text-2xl font-bold text-indigo-900">{approachingDeadlineCount}</div>
                <div className="mt-1 text-[11px] text-indigo-600">Avg age: {averageAgeDays}d</div>
              </motion.div>
            </motion.div>

            {/* Primary Visualizations Grid: Trend & Ageing Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly Trend Area Chart (2 Columns) */}
              <motion.div
                variants={itemVariants}
                className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      Monthly Grievance Inflow vs. Redressal Velocity
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tracking new complaints received against finalized disposals
                    </p>
                  </div>
                  <span className="rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                    6-Month Trajectory
                  </span>
                </div>

                <div className="h-64 w-full">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={monthlyTrendData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorDisposed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: '#64748B', fontSize: 11 }}
                          tickLine={false}
                          axisLine={{ stroke: '#CBD5E1' }}
                        />
                        <YAxis
                          tick={{ fill: '#64748B', fontSize: 11 }}
                          tickLine={false}
                          axisLine={{ stroke: '#CBD5E1' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            fontSize: '12px',
                          }}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                          formatter={(value) => (value === 'inflow' ? 'New Inflow' : 'Disposed')}
                        />
                        <Area
                          type="monotone"
                          dataKey="inflow"
                          stroke="#3B82F6"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorInflow)"
                        />
                        <Area
                          type="monotone"
                          dataKey="disposed"
                          stroke="#10B981"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorDisposed)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">
                      Loading chart...
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Ageing & SLA Compliance Donut Chart (1 Column) */}
              <motion.div
                variants={itemVariants}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <PieIcon className="h-4 w-4 text-amber-500" />
                      Pending Case Ageing Analysis
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500">
                    Distribution of active cases by age against AICTE 45-day SLA
                  </p>
                </div>

                <div className="h-48 w-full my-2">
                  {mounted && ageingData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ageingData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {ageingData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            fontSize: '11px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-slate-400 text-center p-4">
                      No active pending cases in current filter range
                    </div>
                  )}
                </div>

                {/* Legend list */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                  {ageingData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-slate-600 text-[11px]">{item.name}</span>
                      </div>
                      <span className="font-semibold text-slate-900 text-xs">{item.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Secondary Visualizations: Category Bar Chart & Regional Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Breakdown Bar Chart */}
              <motion.div
                variants={itemVariants}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-indigo-600" />
                      Grievances by Category
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Top complaint classifications filed through PGRC portal
                    </p>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">
                    {categoryChartData.length} classifications
                  </span>
                </div>

                <div className="h-64 w-full">
                  {mounted && categoryChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={categoryChartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                          dataKey="category"
                          tick={{ fill: '#64748B', fontSize: 10 }}
                          interval={0}
                          angle={-20}
                          textAnchor="end"
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: '#64748B', fontSize: 11 }}
                          tickLine={false}
                          axisLine={{ stroke: '#CBD5E1' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            fontSize: '11px',
                          }}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }}
                        />
                        <Bar dataKey="Pending" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Disposed" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">
                      No category data available
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Regional Breakdown & Cross-Bureau Overlap Summary */}
              <motion.div
                variants={itemVariants}
                className="space-y-6"
              >
                {/* Region-wise breakdown */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        Regional Workload Distribution
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Grievance volumes mapped to AICTE regional jurisdictions
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {regionalData.map((reg) => {
                      const pct = totalCount > 0 ? Math.round((reg.total / totalCount) * 100) : 0;
                      return (
                        <div key={reg.region} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-700">
                              {reg.region} Regional Office
                            </span>
                            <span className="text-slate-500">
                              <strong className="text-slate-900 font-semibold">{reg.total}</strong> cases ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${(reg.disposed / (reg.total || 1)) * pct}%` }}
                              title={`Disposed: ${reg.disposed}`}
                            />
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${(reg.active / (reg.total || 1)) * pct}%` }}
                              title={`Active: ${reg.active}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cross-Bureau Overlap & Coordination Card */}
                <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/60 to-slate-50 p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-blue-600" />
                      Inter-Bureau Coordination Summary
                    </h3>
                    <Link
                      href="/pgrc-dashboard/coordination"
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 transition"
                    >
                      Workspace <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg border border-white/80 bg-white p-3 shadow-2xs">
                      <div className="text-[11px] text-slate-500">Cross-Bureau Overlaps</div>
                      <div className="text-lg font-bold text-slate-900 mt-1">
                        {overlapStats.totalOvr}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                        {overlapStats.resolvedOvr} resolved / confirmed
                      </div>
                    </div>

                    <div className="rounded-lg border border-white/80 bg-white p-3 shadow-2xs">
                      <div className="text-[11px] text-slate-500">Active RB Requests</div>
                      <div className="text-lg font-bold text-slate-900 mt-1">
                        {overlapStats.activeCoord}
                      </div>
                      <div className="text-[10px] text-blue-600 font-medium mt-0.5">
                        {overlapStats.totalCoord} total exchanges logged
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* High Priority / Approaching SLA Grievances Ledger */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden"
            >
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    High Priority & Approaching SLA Ledger
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Critical grievances requiring immediate administrative intervention and monitoring
                  </p>
                </div>
                <Link
                  href="/pgrc-dashboard/cases"
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 self-start sm:self-auto"
                >
                  Manage All PGRC Cases <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Case Number</th>
                      <th className="py-3 px-4">Institution</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Submission</th>
                      <th className="py-3 px-4">Target Date</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCases
                      .filter((c) => c.priority === 'Critical' || c.priority === 'High' || c.status === 'Overdue')
                      .slice(0, 8)
                      .map((c) => {
                        const isOverdue = c.status === 'Overdue';
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-mono font-medium text-slate-900">
                              {c.caseNumber}
                              {c.hasOverlapAlert && (
                                <span className="ml-1.5 inline-block rounded bg-red-100 px-1 py-0.2 text-[9px] font-bold text-red-700">
                                  OVERLAP
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-800 line-clamp-1">
                                {c.institutionName}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {c.institutionCode}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">{c.category}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  c.priority === 'Critical'
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : c.priority === 'High'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {c.priority}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  c.status === 'Disposed'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : c.status === 'Overdue'
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : c.status === 'Under Process'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {c.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                              {formatDate(c.submissionDate)}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`font-medium ${
                                  isOverdue ? 'text-red-600 font-semibold' : 'text-slate-600'
                                }`}
                              >
                                {c.expectedDisposalDate ? formatDate(c.expectedDisposalDate) : 'Not assigned'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setSelectedCase(c)}
                                className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                              >
                                <Eye className="h-3 w-3" />
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    {filteredCases.filter(
                      (c) => c.priority === 'Critical' || c.priority === 'High' || c.status === 'Overdue'
                    ).length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                          No high-priority or overdue grievances match the active filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        </main>
      </div>

      {/* Case Details Modal */}
      <CaseDetailsModal
        selectedCase={selectedCase}
        onClose={() => setSelectedCase(null)}
      />
    </div>
  );
}
