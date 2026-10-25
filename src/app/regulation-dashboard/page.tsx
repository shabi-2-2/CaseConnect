'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import {
  Scale,
  Calendar,
  Search,
  Eye,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
  Plus,
  Building2,
  Filter,
  X,
  Timer,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { RbSidebar } from '@/components/layout/RbSidebar';
import { Navbar } from '@/components/layout/Navbar';
import { CaseDetailsModal } from '@/components/dashboard/CaseDetailsModal';
import { IssueRegulatoryNoticeModal } from '@/components/dashboard/IssueRegulatoryNoticeModal';
import { CaseItem, CasePriority, CaseStatus } from '@/types/dashboard';
import { useMounted, formatDate } from '@/lib/utils';
import { fetchComplaints } from '@/lib/complaints-api';

const priorityWeight: Record<CasePriority, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export default function RegulationBureauDashboard() {
  const shouldReduceMotion = useReducedMotion();
  const mounted = useMounted();

  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [allCases, setAllCases] = useState<CaseItem[]>([]);
  const [overlapsCount, setOverlapsCount] = useState(0);
  const [coordCount, setCoordCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CaseStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | CasePriority>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');

  // Sorting & Pagination
  const [sortField, setSortField] = useState<'submissionDate' | 'expectedDisposalDate' | 'priority' | 'caseNumber'>('submissionDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const [casesData, ovrRes, coordRes] = await Promise.all([
        fetchComplaints(),
        fetch('/api/overlaps', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ overlaps: [] })),
        fetch('/api/coordination', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ requests: [] })),
      ]);

      setAllCases(casesData || []);
      if (Array.isArray(ovrRes.overlaps)) {
        setOverlapsCount(ovrRes.overlaps.filter((o: any) => o.reviewStatus === 'Awaiting Review').length);
      }
      if (Array.isArray(coordRes.requests)) {
        setCoordCount(coordRes.requests.filter((c: any) => c.status !== 'Resolved').length);
      }
    } catch (e) {
      console.error('Failed to load RB dashboard data', e);
    } finally {
      setLoading(false);
      if (showRefresh) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(false);
    pollingRef.current = setInterval(() => loadData(false), 8000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Filter only Regulation Bureau cases
  const rbCases = useMemo(() => {
    return allCases.filter((c) => c.bureau === 'Regulation Bureau');
  }, [allCases]);

  // Dynamic filter lists
  const categories = useMemo(() => {
    const set = new Set(rbCases.map((c) => c.category).filter(Boolean));
    return Array.from(set).sort();
  }, [rbCases]);

  const regions = useMemo(() => {
    const set = new Set(rbCases.map((c) => c.region).filter(Boolean));
    return Array.from(set).sort();
  }, [rbCases]);

  // Baseline reference date for SLA calculation (October 2026)
  const referenceDate = useMemo(() => new Date('2026-10-25').getTime(), []);

  // Computed KPI metrics from real SQLite data
  const totalCount = rbCases.length;
  const pendingCount = rbCases.filter((c) => c.status === 'Pending').length;
  const underProcessCount = rbCases.filter((c) => c.status === 'Under Process').length;
  const disposedCount = rbCases.filter((c) => c.status === 'Disposed').length;
  const overdueCount = rbCases.filter((c) => c.status === 'Overdue').length;

  // Approaching deadline count (<7 days)
  const approachingDeadlineCount = useMemo(() => {
    return rbCases.filter((c) => {
      if (c.status === 'Disposed') return false;
      if (!c.expectedDisposalDate) return false;
      const targetTime = new Date(c.expectedDisposalDate).getTime();
      const diffDays = (targetTime - referenceDate) / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }).length;
  }, [rbCases, referenceDate]);

  // Filtered docket cases
  const filteredCases = useMemo(() => {
    return rbCases.filter((c) => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && c.priority !== priorityFilter) return false;
      if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;
      if (regionFilter !== 'ALL' && c.region !== regionFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesCase = c.caseNumber.toLowerCase().includes(q);
        const matchesInst = c.institutionName.toLowerCase().includes(q);
        const matchesCode = c.institutionCode.toLowerCase().includes(q);
        const matchesSub = c.subject.toLowerCase().includes(q);
        const matchesCat = c.category.toLowerCase().includes(q);
        const matchesOfficer = c.assignedOfficer.toLowerCase().includes(q);
        if (!matchesCase && !matchesInst && !matchesCode && !matchesSub && !matchesCat && !matchesOfficer) {
          return false;
        }
      }

      return true;
    });
  }, [rbCases, statusFilter, priorityFilter, categoryFilter, regionFilter, search]);

  // Sorting
  const sortedCases = useMemo(() => {
    return [...filteredCases].sort((a, b) => {
      let comp = 0;
      if (sortField === 'priority') {
        comp = priorityWeight[a.priority] - priorityWeight[b.priority];
      } else if (sortField === 'caseNumber') {
        comp = a.caseNumber.localeCompare(b.caseNumber);
      } else if (sortField === 'expectedDisposalDate') {
        comp = new Date(a.expectedDisposalDate || '').getTime() - new Date(b.expectedDisposalDate || '').getTime();
      } else {
        comp = new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime();
      }
      return sortDirection === 'asc' ? comp : -comp;
    });
  }, [filteredCases, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedCases.length / pageSize) || 1;
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCases.slice(start, start + pageSize);
  }, [sortedCases, currentPage, pageSize]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formattedDate = mounted
    ? new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Saturday, 24 October 2026';

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Regulation Bureau Sidebar */}
      <RbSidebar
        activeTab="overview"
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        badgeCounts={{
          cases: totalCount,
          overlaps: overlapsCount,
          coordination: coordCount,
        }}
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
            {/* Header / Title Banner */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200/80 pb-5"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
                    <Scale className="h-3.5 w-3.5 text-amber-600" />
                    Regulation Bureau
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{formattedDate}</span>
                  </div>
                </div>
                <h1 className="mt-2 font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">
                  Enforcement Docket &amp; Statutory Compliance
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
                  Oversee institutional deficiencies, unapproved programs, cadre violations, and statutory notices across technical campuses.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 sm:self-start md:self-auto">
                <button
                  onClick={() => loadData(true)}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition"
                  title="Synchronize live SQLite records"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                <button
                  onClick={() => setIsNoticeModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#002b5c] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#001f3f] transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <Plus className="h-4 w-4 text-amber-300" />
                  <span>Issue Regulatory Notice</span>
                </button>
              </div>
            </motion.div>

            {/* Live KPI Metric Cards (Calculated from SQLite) */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
            >
              {/* Total Cases */}
              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Regulatory Cases</span>
                  <FileText className="h-4 w-4 text-amber-600" />
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{totalCount}</div>
                <div className="mt-1 text-[11px] text-slate-400">Active dockets</div>
              </motion.div>

              {/* Pending */}
              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
                className="group relative flex flex-col justify-between rounded-xl border border-amber-200/80 bg-amber-50/30 p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs text-amber-700">
                  <span>Pending Intake</span>
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
                <div className="mt-2 text-2xl font-bold text-amber-900">{pendingCount}</div>
                <div className="mt-1 text-[11px] text-amber-600">Awaiting scrutiny</div>
              </motion.div>

              {/* Under Process */}
              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
                className="group relative flex flex-col justify-between rounded-xl border border-blue-200/80 bg-blue-50/30 p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs text-blue-700">
                  <span>Under Process</span>
                  <Sparkles className="h-4 w-4 text-blue-500" />
                </div>
                <div className="mt-2 text-2xl font-bold text-blue-900">{underProcessCount}</div>
                <div className="mt-1 text-[11px] text-blue-600">Active inspection</div>
              </motion.div>

              {/* Overdue */}
              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
                className="group relative flex flex-col justify-between rounded-xl border border-rose-200/80 bg-rose-50/30 p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs text-rose-700">
                  <span>Overdue SLA</span>
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                </div>
                <div className="mt-2 text-2xl font-bold text-rose-700">{overdueCount}</div>
                <div className="mt-1 text-[11px] text-rose-600">Require action</div>
              </motion.div>

              {/* Disposed */}
              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
                className="group relative flex flex-col justify-between rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs text-emerald-700">
                  <span>Disposed</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="mt-2 text-2xl font-bold text-emerald-700">{disposedCount}</div>
                <div className="mt-1 text-[11px] text-emerald-600">Verified compliance</div>
              </motion.div>

              {/* Approaching SLA Deadlines */}
              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
                className="group relative flex flex-col justify-between rounded-xl border border-indigo-200/80 bg-indigo-50/30 p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs text-indigo-700">
                  <span>Due in &lt; 7 Days</span>
                  <Timer className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="mt-2 text-2xl font-bold text-indigo-900">{approachingDeadlineCount}</div>
                <div className="mt-1 text-[11px] text-indigo-600">Urgent hearings</div>
              </motion.div>
            </motion.div>

            {/* Filter Bar */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Filter className="h-3.5 w-3.5 text-amber-600" />
                  <span>Enforcement Docket Query Filters</span>
                </div>

                {(statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL' || regionFilter !== 'ALL' || search) && (
                  <button
                    onClick={() => {
                      setStatusFilter('ALL');
                      setPriorityFilter('ALL');
                      setCategoryFilter('ALL');
                      setRegionFilter('ALL');
                      setSearch('');
                      setCurrentPage(1);
                    }}
                    className="text-xs font-medium text-amber-700 hover:text-amber-900 flex items-center gap-1 transition"
                  >
                    <X className="h-3 w-3" /> Reset Filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                {/* Search */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Search Docket</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Case #, institution, category..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as 'ALL' | CaseStatus);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Under Process">Under Process</option>
                    <option value="Pending">Pending</option>
                    <option value="Disposed">Disposed</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => {
                      setPriorityFilter(e.target.value as 'ALL' | CasePriority);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-amber-500 focus:outline-none"
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
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Violation Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Region Filter */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">AICTE Region</label>
                  <select
                    value={regionFilter}
                    onChange={(e) => {
                      setRegionFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="ALL">All Regions</option>
                    {regions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Enforcement Docket Table */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden"
            >
              <div className="border-b border-slate-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-600" />
                    Enforcement Docket Ledger
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Statutory deficiency matters, physical inspection orders, and hearing schedules ({sortedCases.length} total)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/regulation-dashboard/cases"
                    className="text-xs font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1 transition"
                  >
                    Detailed Case Manager <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th
                        onClick={() => toggleSort('caseNumber')}
                        className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition select-none"
                      >
                        <div className="flex items-center gap-1">
                          <span>Case ID</span>
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="py-3.5 px-4">Institution &amp; Code</th>
                      <th className="py-3.5 px-4">Violation Category</th>
                      <th className="py-3.5 px-4">Investigating Officer</th>
                      <th
                        onClick={() => toggleSort('submissionDate')}
                        className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition select-none"
                      >
                        <div className="flex items-center gap-1">
                          <span>Received</span>
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </th>
                      <th
                        onClick={() => toggleSort('expectedDisposalDate')}
                        className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition select-none"
                      >
                        <div className="flex items-center gap-1">
                          <span>Expected Disposal</span>
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="py-3.5 px-4">Status</th>
                      <th
                        onClick={() => toggleSort('priority')}
                        className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition select-none"
                      >
                        <div className="flex items-center gap-1">
                          <span>Priority</span>
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedCases.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          <Building2 className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                          <p className="font-semibold text-slate-700">No regulatory cases match criteria</p>
                          <p className="text-xs text-slate-400 mt-0.5">Try resetting search keywords or status filters.</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedCases.map((c) => {
                        const isOverdue = c.status === 'Overdue';
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                              {c.caseNumber}
                              {c.hasOverlapAlert && (
                                <span className="ml-1.5 inline-block rounded bg-rose-100 px-1 py-0.2 text-[9px] font-bold text-rose-700">
                                  OVERLAP
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 max-w-[220px]">
                              <div className="font-semibold text-slate-900 line-clamp-1">{c.institutionName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{c.institutionCode}</div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-700 font-medium">
                              <div>{c.category}</div>
                              <div className="text-[10px] text-slate-400 line-clamp-1">{c.subject}</div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                              {c.assignedOfficer || 'Unassigned'}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                              {formatDate(c.submissionDate)}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`font-medium ${
                                  isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-600'
                                }`}
                              >
                                {c.expectedDisposalDate ? formatDate(c.expectedDisposalDate) : 'Not set'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  c.status === 'Disposed'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : c.status === 'Overdue'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : c.status === 'Under Process'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {c.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  c.priority === 'Critical'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : c.priority === 'High'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {c.priority}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <button
                                onClick={() => setSelectedCase(c)}
                                className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition"
                              >
                                <Eye className="h-3 w-3" /> View
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
                  <div>
                    Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                    <strong>{Math.min(currentPage * pageSize, sortedCases.length)}</strong> of{' '}
                    <strong>{sortedCases.length}</strong> dockets
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded border border-slate-200 px-2.5 py-1 hover:bg-slate-50 disabled:opacity-40 transition"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`rounded px-2.5 py-1 text-xs font-semibold ${
                          currentPage === page
                            ? 'bg-[#002b5c] text-white'
                            : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded border border-slate-200 px-2.5 py-1 hover:bg-slate-50 disabled:opacity-40 transition"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </main>
      </div>

      {/* Case Details Modal */}
      <CaseDetailsModal
        selectedCase={selectedCase}
        onClose={() => setSelectedCase(null)}
        onStatusUpdated={(updated) => {
          setAllCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          setSelectedCase(updated);
        }}
        allowStatusEdit={true}
      />

      {/* Issue Regulatory Notice Modal */}
      <IssueRegulatoryNoticeModal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
        rbCases={rbCases}
        onNoticeIssued={() => loadData(true)}
      />
    </div>
  );
}
