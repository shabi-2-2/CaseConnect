'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import {
  FileText,
  Search,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Flag,
  UserCheck,
  X,
  ArrowUpDown,
  ChevronRight,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { CaseDetailsModal } from '@/components/dashboard/CaseDetailsModal';
import { useManagementData } from '@/lib/managementStore';
import { CaseItem, BureauType, CasePriority, CaseStatus } from '@/types/dashboard';

// Priority order for sorting
const priorityWeight: Record<CasePriority, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export default function AllCasesPage() {
  const shouldReduceMotion = useReducedMotion();
  const { cases, toggleCaseFlag, refreshData } = useManagementData();
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Quick View Modal
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [bureauFilter, setBureauFilter] = useState<'ALL' | BureauType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CaseStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | CasePriority>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [overlapOnly, setOverlapOnly] = useState<boolean>(false);
  const [flaggedOnly, setFlaggedOnly] = useState<boolean>(false);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<
    'submissionDate' | 'lastUpdated' | 'expectedDisposalDate' | 'priority' | 'caseNumber'
  >('submissionDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Extract categories dynamically
  const categories = useMemo(() => {
    const set = new Set(cases.map((c) => c.category));
    return Array.from(set).sort();
  }, [cases]);

  // Filter & Sort
  const filteredCases = useMemo(() => {
    return cases
      .filter((c) => {
        if (bureauFilter !== 'ALL' && c.bureau !== bureauFilter) return false;
        if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
        if (priorityFilter !== 'ALL' && c.priority !== priorityFilter) return false;
        if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;
        if (overlapOnly && !c.hasOverlapAlert) return false;
        if (flaggedOnly && !c.managementFlagged) return false;

        if (search.trim()) {
          const q = search.toLowerCase();
          const matchNumber = c.caseNumber.toLowerCase().includes(q);
          const matchInst =
            c.institutionName.toLowerCase().includes(q) ||
            c.institutionCode.toLowerCase().includes(q);
          const matchSubject = c.subject.toLowerCase().includes(q);
          const matchOfficer = c.assignedOfficer.toLowerCase().includes(q);
          const matchCategory = c.category.toLowerCase().includes(q);
          if (!matchNumber && !matchInst && !matchSubject && !matchOfficer && !matchCategory) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';

        if (sortBy === 'priority') {
          valA = priorityWeight[a.priority];
          valB = priorityWeight[b.priority];
        } else if (sortBy === 'submissionDate') {
          valA = new Date(a.submissionDate).getTime();
          valB = new Date(b.submissionDate).getTime();
        } else if (sortBy === 'lastUpdated') {
          valA = new Date(a.lastUpdated || a.submissionDate).getTime();
          valB = new Date(b.lastUpdated || b.submissionDate).getTime();
        } else if (sortBy === 'expectedDisposalDate') {
          valA = new Date(a.expectedDisposalDate || '2099-01-01').getTime();
          valB = new Date(b.expectedDisposalDate || '2099-01-01').getTime();
        } else {
          valA = a.caseNumber;
          valB = b.caseNumber;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [
    cases,
    bureauFilter,
    statusFilter,
    priorityFilter,
    categoryFilter,
    overlapOnly,
    flaggedOnly,
    search,
    sortBy,
    sortOrder,
  ]);

  const totalPages = Math.ceil(filteredCases.length / itemsPerPage) || 1;
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCases.slice(start, start + itemsPerPage);
  }, [filteredCases, currentPage]);

  const handleSort = (
    field: 'submissionDate' | 'lastUpdated' | 'expectedDisposalDate' | 'priority' | 'caseNumber'
  ) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setBureauFilter('ALL');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setCategoryFilter('ALL');
    setOverlapOnly(false);
    setFlaggedOnly(false);
    setCurrentPage(1);
  };

  // Quick stats
  const totalCasesCount = cases.length;
  const overdueCount = cases.filter((c) => c.status === 'Overdue').length;
  const overlapsCount = cases.filter((c) => c.hasOverlapAlert).length;
  const flaggedCount = cases.filter((c) => c.managementFlagged).length;

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
        activeTab="cases"
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Wrapper with Proper Sidebar Margin & Transition */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Navbar
          onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
          isSidebarOpen={isSidebarOpenMobile}
          searchQuery={search}
          onSearchChange={(q) => {
            setSearch(q);
            setCurrentPage(1);
          }}
          onSelectCase={(caseId) => {
            const found = cases.find((c) => c.id === caseId || c.caseNumber === caseId);
            if (found) setSelectedCase(found);
          }}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Header & Breadcrumb */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Link href="/management" className="hover:text-blue-600 transition-colors">
                    Senior Management
                  </Link>
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                  <span className="text-slate-800 font-semibold">All Cases Monitoring</span>
                </div>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
                  <FileText className="h-6 w-6 text-blue-600" />
                  All Complaints & Regulatory Cases
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cross-bureau grievance monitoring & enforcement tracking for AICTE PGRC and Regulation Bureau
                </p>
              </div>

              {/* Status summary pills */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setFlaggedOnly(!flaggedOnly);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    flaggedOnly
                      ? 'border-amber-400 bg-amber-50 text-amber-800 shadow-xs ring-1 ring-amber-400'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Flag className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span>Flagged by Mgmt</span>
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-900">
                    {flaggedCount}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setOverlapOnly(!overlapOnly);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    overlapOnly
                      ? 'border-purple-400 bg-purple-50 text-purple-800 shadow-xs ring-1 ring-purple-400'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                  <span>Cross-Bureau Overlaps</span>
                  <span className="rounded-full bg-purple-100 px-1.5 py-0.2 text-[10px] font-bold text-purple-900">
                    {overlapsCount}
                  </span>
                </button>
              </div>
            </motion.div>

            {/* Quick Metrics Bar */}
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
                  <span>Total Cases Monitored</span>
                  <FileText className="h-4 w-4 text-slate-400" />
                </div>
                <div className="mt-1 text-2xl font-bold text-slate-900">{totalCasesCount}</div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  {cases.filter((c) => c.bureau === 'PGRC').length} PGRC •{' '}
                  {cases.filter((c) => c.bureau === 'Regulation Bureau').length} Regulation
                </div>
              </motion.div>

              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs text-rose-700">
                  <span>Overdue Cases (SLA Breach)</span>
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                </div>
                <div className="mt-1 text-2xl font-bold text-rose-800">{overdueCount}</div>
                <div className="mt-0.5 text-[11px] text-rose-600">Requires executive escalation</div>
              </motion.div>

              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs text-purple-700">
                  <span>Overlap Alerts</span>
                  <Sparkles className="h-4 w-4 text-purple-600" />
                </div>
                <div className="mt-1 text-2xl font-bold text-purple-800">{overlapsCount}</div>
                <div className="mt-0.5 text-[11px] text-purple-600">
                  <Link href="/management/overlaps" className="underline hover:text-purple-900">
                    Review in Overlap Centre →
                  </Link>
                </div>
              </motion.div>

              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs text-emerald-700">
                  <span>Disposed Cases</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="mt-1 text-2xl font-bold text-emerald-800">
                  {cases.filter((c) => c.status === 'Disposed').length}
                </div>
                <div className="mt-0.5 text-[11px] text-emerald-600">
                  {Math.round(
                    (cases.filter((c) => c.status === 'Disposed').length / totalCasesCount) * 100
                  )}
                  % resolution rate
                </div>
              </motion.div>
            </motion.div>

            {/* Filter and Search Bar */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search by Case ID, institution name, subject keywords, officer..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Reset */}
                {(search ||
                  bureauFilter !== 'ALL' ||
                  statusFilter !== 'ALL' ||
                  priorityFilter !== 'ALL' ||
                  categoryFilter !== 'ALL' ||
                  overlapOnly ||
                  flaggedOnly) && (
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 self-start text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reset all filters
                  </button>
                )}
              </div>

              {/* Multi-Filter Dropdowns */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-5 text-xs">
                {/* Bureau Filter */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Bureau</label>
                  <select
                    value={bureauFilter}
                    onChange={(e) => {
                      setBureauFilter(e.target.value as 'ALL' | BureauType);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="ALL">All Bureaus ({cases.length})</option>
                    <option value="PGRC">PGRC only</option>
                    <option value="Regulation Bureau">Regulation Bureau only</option>
                  </select>
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
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Under Process">Under Process</option>
                    <option value="Overdue">Overdue / SLA Escalated</option>
                    <option value="Disposed">Disposed / Resolved</option>
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
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="ALL">All Categories ({categories.length})</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Option */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(
                        e.target.value as
                          | 'submissionDate'
                          | 'lastUpdated'
                          | 'expectedDisposalDate'
                          | 'priority'
                          | 'caseNumber'
                      );
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="submissionDate">Date Received</option>
                    <option value="lastUpdated">Last Action Date</option>
                    <option value="expectedDisposalDate">Target SLA Disposal</option>
                    <option value="priority">Priority Severity</option>
                    <option value="caseNumber">Case ID</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Cases Table */}
            <motion.div
              variants={itemVariants}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/60">
                <span className="text-xs font-semibold text-slate-700">
                  Showing {filteredCases.length} complaint & compliance records
                </span>
                <span className="text-[11px] text-slate-500">
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[980px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                      <th
                        className="py-3 px-4 cursor-pointer hover:text-blue-600 select-none"
                        onClick={() => handleSort('caseNumber')}
                      >
                        <div className="flex items-center gap-1">
                          <span>Case ID & Flags</span>
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="py-3 px-4">Institution</th>
                      <th className="py-3 px-4">Category & Subject</th>
                      <th className="py-3 px-4">Bureau</th>
                      <th className="py-3 px-4">Status & SLA</th>
                      <th
                        className="py-3 px-4 cursor-pointer hover:text-blue-600 select-none"
                        onClick={() => handleSort('priority')}
                      >
                        <div className="flex items-center gap-1">
                          <span>Priority</span>
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="py-3 px-4">Officer</th>
                      <th
                        className="py-3 px-4 cursor-pointer hover:text-blue-600 select-none"
                        onClick={() => handleSort('submissionDate')}
                      >
                        <div className="flex items-center gap-1">
                          <span>Key Dates</span>
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {paginatedCases.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-500 text-xs">
                          No cases found matching your search and filter criteria.
                        </td>
                      </tr>
                    ) : (
                      paginatedCases.map((c) => {
                        const isOverdue = c.status === 'Overdue';

                        return (
                          <motion.tr
                            key={c.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="hover:bg-slate-50/80 transition-colors group"
                          >
                            {/* Case ID + Management Flag Toggle */}
                            <td className="py-3.5 px-4 font-medium">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleCaseFlag(c.id)}
                                  title={c.managementFlagged ? 'Flagged for attention' : 'Mark for attention'}
                                  className={`rounded p-1 transition-colors ${
                                    c.managementFlagged
                                      ? 'text-amber-500 hover:text-amber-600 bg-amber-50'
                                      : 'text-slate-300 hover:text-amber-500'
                                  }`}
                                >
                                  <Flag
                                    className={`h-3.5 w-3.5 ${
                                      c.managementFlagged ? 'fill-amber-500' : ''
                                    }`}
                                  />
                                </button>
                                <div>
                                  <Link
                                    href={`/management/cases/${c.caseNumber}`}
                                    className="font-mono font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    {c.caseNumber}
                                  </Link>
                                  {c.hasOverlapAlert && (
                                    <div className="mt-0.5">
                                      <Link
                                        href="/management/overlaps"
                                        className="inline-flex items-center gap-1 rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-200 hover:bg-purple-100"
                                      >
                                        <Sparkles className="h-2.5 w-2.5" />
                                        Overlap Alert
                                      </Link>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Institution */}
                            <td className="py-3.5 px-4">
                              <div className="max-w-[200px]">
                                <Link
                                  href={`/management/institutions/${c.institutionCode}`}
                                  className="font-medium text-slate-800 hover:text-blue-600 hover:underline truncate block"
                                  title={c.institutionName}
                                >
                                  {c.institutionName}
                                </Link>
                                <span className="font-mono text-[10px] text-slate-400">
                                  {c.institutionCode}
                                </span>
                              </div>
                            </td>

                            {/* Category & Subject */}
                            <td className="py-3.5 px-4">
                              <div className="max-w-[230px]">
                                <span className="inline-block rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 mb-0.5">
                                  {c.category}
                                </span>
                                <p className="truncate text-slate-600 text-[11px]" title={c.subject}>
                                  {c.subject}
                                </p>
                              </div>
                            </td>

                            {/* Bureau */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  c.bureau === 'PGRC'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {c.bureau}
                              </span>
                            </td>

                            {/* Status & SLA */}
                            <td className="py-3.5 px-4">
                              <div>
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                    isOverdue
                                      ? 'bg-rose-100 text-rose-800 border border-rose-300 font-bold'
                                      : c.status === 'Disposed'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : c.status === 'Under Process'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {isOverdue && <AlertTriangle className="h-3 w-3 text-rose-600" />}
                                  {c.status}
                                </span>
                                <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                                  <Clock className="h-3 w-3" />
                                  <span>Due: {c.expectedDisposalDate}</span>
                                </div>
                              </div>
                            </td>

                            {/* Priority */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold ${
                                  c.priority === 'Critical'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : c.priority === 'High'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : c.priority === 'Medium'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {c.priority}
                              </span>
                            </td>

                            {/* Officer */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 text-slate-700">
                                <UserCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[120px]">{c.assignedOfficer}</span>
                              </div>
                            </td>

                            {/* Dates */}
                            <td className="py-3.5 px-4 text-[11px] text-slate-500">
                              <div>Recv: {c.submissionDate}</div>
                              <div className="text-[10px] text-slate-400">Act: {c.lastUpdated}</div>
                            </td>

                            {/* Action Buttons: Quick View & Dossier */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedCase(c)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                  title="Quick View Modal"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>Quick</span>
                                </button>
                                <Link
                                  href={`/management/cases/${c.caseNumber}`}
                                  className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                                  title="Full Case Dossier"
                                >
                                  <span>Dossier</span>
                                  <ChevronRight className="h-3 w-3" />
                                </Link>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-white">
                  <div className="text-xs text-slate-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, filteredCases.length)} of{' '}
                    {filteredCases.length} cases
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
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

      {/* Case Details Quick View Modal */}
      <CaseDetailsModal
        selectedCase={selectedCase}
        onClose={() => setSelectedCase(null)}
        onViewRelatedCase={(caseNum) => {
          const found = cases.find((c) => c.caseNumber === caseNum);
          if (found) setSelectedCase(found);
        }}
        allowStatusEdit={true}
        onStatusUpdated={(updated) => {
          setSelectedCase(updated);
          refreshData();
        }}
      />
    </div>
  );
}
