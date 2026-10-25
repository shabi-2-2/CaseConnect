'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  ArrowUpDown,
  ChevronRight,
  Filter,
  X,
  RefreshCw,
  Download,
  Scale,
  Edit3,
  Calendar,
  Building2,
  Plus,
} from 'lucide-react';
import { RbSidebar } from '@/components/layout/RbSidebar';
import { Navbar } from '@/components/layout/Navbar';
import { CaseDetailsModal } from '@/components/dashboard/CaseDetailsModal';
import { IssueRegulatoryNoticeModal } from '@/components/dashboard/IssueRegulatoryNoticeModal';
import { CaseItem, CasePriority, CaseStatus } from '@/types/dashboard';
import { fetchComplaints, updateComplaint } from '@/lib/complaints-api';
import { formatDate } from '@/lib/utils';

const priorityWeight: Record<CasePriority, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export default function RbCasesPage() {
  const shouldReduceMotion = useReducedMotion();
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [allCases, setAllCases] = useState<CaseItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);

  // Edit Action Modal for RB Official
  const [editingCase, setEditingCase] = useState<CaseItem | null>(null);
  const [editStatus, setEditStatus] = useState<CaseStatus>('Pending');
  const [editOfficer, setEditOfficer] = useState('');
  const [editDisposalDate, setEditDisposalDate] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Issue Notice Modal
  const [noticeTargetCaseId, setNoticeTargetCaseId] = useState<string | undefined>(undefined);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CaseStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | CasePriority>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<'caseNumber' | 'priority' | 'submissionDate' | 'expectedDisposalDate' | 'lastUpdated'>('submissionDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const data = await fetchComplaints();
      setAllCases(data);
    } catch (e) {
      console.error('Failed to load RB cases', e);
    } finally {
      if (showRefresh) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(false);
    const interval = setInterval(() => loadData(false), 8000);
    return () => clearInterval(interval);
  }, []);

  // Filter only Regulation Bureau-owned cases
  const rbCases = useMemo(() => {
    return allCases.filter((c) => c.bureau === 'Regulation Bureau');
  }, [allCases]);

  // Extract categories dynamically
  const categories = useMemo(() => {
    const set = new Set(rbCases.map((c) => c.category));
    return Array.from(set).sort();
  }, [rbCases]);

  // Filtered & Sorted Cases
  const filteredCases = useMemo(() => {
    return rbCases
      .filter((c) => {
        if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
        if (priorityFilter !== 'ALL' && c.priority !== priorityFilter) return false;
        if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;

        if (dateFrom && c.submissionDate < dateFrom) return false;
        if (dateTo && c.submissionDate > dateTo) return false;

        if (search.trim()) {
          const q = search.toLowerCase();
          const matchNumber = c.caseNumber.toLowerCase().includes(q);
          const matchInst = c.institutionName.toLowerCase().includes(q) || c.institutionCode.toLowerCase().includes(q);
          const matchSub = c.subject.toLowerCase().includes(q);
          const matchOff = c.assignedOfficer.toLowerCase().includes(q);
          if (!matchNumber && !matchInst && !matchSub && !matchOff) return false;
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
        } else if (sortBy === 'expectedDisposalDate') {
          valA = new Date(a.expectedDisposalDate || '2099-01-01').getTime();
          valB = new Date(b.expectedDisposalDate || '2099-01-01').getTime();
        } else if (sortBy === 'lastUpdated') {
          valA = new Date(a.lastUpdated || a.submissionDate).getTime();
          valB = new Date(b.lastUpdated || b.submissionDate).getTime();
        } else {
          valA = a.caseNumber;
          valB = b.caseNumber;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [rbCases, statusFilter, priorityFilter, categoryFilter, dateFrom, dateTo, search, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredCases.length / itemsPerPage) || 1;
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCases.slice(start, start + itemsPerPage);
  }, [filteredCases, currentPage]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleOpenEdit = (c: CaseItem) => {
    setEditingCase(c);
    setEditStatus(c.status);
    setEditOfficer(c.assignedOfficer || '');
    setEditDisposalDate(c.expectedDisposalDate || '');
    setEditRemarks('');
  };

  const handleSaveEdit = async () => {
    if (!editingCase) return;
    setIsSubmittingEdit(true);
    try {
      await updateComplaint(editingCase.id, {
        status: editStatus,
        assignedOfficer: editOfficer,
        expectedDisposalDate: editDisposalDate,
        remarks: editRemarks || `Regulation Bureau Official updated status to ${editStatus}`,
        actorName: 'Regulation Bureau Official',
        actorRole: 'Regulation Bureau',
      });

      setToastMessage(`Regulatory Case ${editingCase.caseNumber} updated successfully!`);
      setTimeout(() => setToastMessage(null), 4000);
      setEditingCase(null);
      await loadData(false);
    } catch (e: any) {
      alert(`Error updating case: ${e?.message || 'Failed'}`);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setCategoryFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const headers = [
      'Case ID',
      'Institution Name',
      'AICTE ID',
      'Category',
      'Date Received',
      'Status',
      'Priority',
      'Investigating Officer',
      'Last Action Date',
      'Expected Disposal',
      'Overlap Flag',
      'Subject',
    ];

    const rows = filteredCases.map((c) => [
      `"${c.caseNumber}"`,
      `"${c.institutionName.replace(/"/g, '""')}"`,
      `"${c.institutionCode}"`,
      `"${c.category}"`,
      `"${c.submissionDate}"`,
      `"${c.status}"`,
      `"${c.priority}"`,
      `"${c.assignedOfficer || 'Unassigned'}"`,
      `"${c.lastUpdated}"`,
      `"${c.expectedDisposalDate || ''}"`,
      `"${c.hasOverlapAlert ? 'Yes' : 'No'}"`,
      `"${c.subject.replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AICTE_RB_Cases_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      <RbSidebar
        activeTab="cases"
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        badgeCounts={{
          cases: rbCases.length,
        }}
      />

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
          {/* Toast Notification */}
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900 shadow-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold">{toastMessage}</span>
              </div>
              <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-950 font-bold">
                ✕
              </button>
            </motion.div>
          )}

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Header */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Link href="/regulation-dashboard" className="hover:text-amber-700 transition-colors">
                    Regulation Bureau
                  </Link>
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                  <span className="text-slate-800 font-semibold">RB Regulatory Case Management</span>
                </div>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
                  <Scale className="h-6 w-6 text-amber-600" />
                  Regulation Bureau Case Docket
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage inspection findings, assign investigating officers, update case statuses, and issue statutory directives
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadData(true)}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition"
                  title="Refresh cases from SQLite"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                <button
                  onClick={() => {
                    setNoticeTargetCaseId(undefined);
                    setIsNoticeModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-amber-700 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Issue Notice</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#002b5c] px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export CSV ({filteredCases.length})</span>
                </button>
              </div>
            </motion.div>

            {/* Quick Metrics */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs"
            >
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <span className="text-slate-500 font-medium">Total RB Dockets</span>
                <div className="mt-1 text-xl font-bold text-slate-900">{rbCases.length}</div>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 shadow-2xs">
                <span className="text-amber-800 font-medium">Pending Scrutiny</span>
                <div className="mt-1 text-xl font-bold text-amber-900">
                  {rbCases.filter((c) => c.status === 'Pending').length}
                </div>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 shadow-2xs">
                <span className="text-blue-800 font-medium">Under Investigation</span>
                <div className="mt-1 text-xl font-bold text-blue-900">
                  {rbCases.filter((c) => c.status === 'Under Process').length}
                </div>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3.5 shadow-2xs">
                <span className="text-rose-800 font-medium">Overdue Breaches</span>
                <div className="mt-1 text-xl font-bold text-rose-700">
                  {rbCases.filter((c) => c.status === 'Overdue').length}
                </div>
              </div>
            </motion.div>

            {/* Filters Bar */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Filter className="h-3.5 w-3.5 text-amber-600" />
                  <span>Filter Regulatory Dockets</span>
                </div>
                {(statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL' || dateFrom || dateTo || search) && (
                  <button
                    onClick={clearFilters}
                    className="text-xs font-medium text-amber-700 hover:text-amber-900 flex items-center gap-1 transition"
                  >
                    <X className="h-3 w-3" /> Reset
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
                {/* Search */}
                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Search Dockets</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Case #, institution, officer, subject..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Status */}
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
                    <option value="Pending">Pending</option>
                    <option value="Under Process">Under Process</option>
                    <option value="Disposed">Disposed</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>

                {/* Priority */}
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

                {/* Category */}
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

                {/* Date range */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Received From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2 py-1.5 text-xs text-slate-700 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </motion.div>

            {/* Cases Table */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th
                        onClick={() => handleSort('caseNumber')}
                        className="py-3 px-4 cursor-pointer hover:text-slate-900 transition select-none"
                      >
                        <div className="flex items-center gap-1">
                          <span>Case Number</span>
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="py-3 px-4">Institution &amp; Code</th>
                      <th className="py-3 px-4">Violation Category</th>
                      <th
                        onClick={() => handleSort('priority')}
                        className="py-3 px-4 cursor-pointer hover:text-slate-900 transition select-none"
                      >
                        <div className="flex items-center gap-1">
                          <span>Priority</span>
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="py-3 px-4">Status</th>
                      <th
                        onClick={() => handleSort('submissionDate')}
                        className="py-3 px-4 cursor-pointer hover:text-slate-900 transition select-none"
                      >
                        <div className="flex items-center gap-1">
                          <span>Received Date</span>
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('expectedDisposalDate')}
                        className="py-3 px-4 cursor-pointer hover:text-slate-900 transition select-none"
                      >
                        <div className="flex items-center gap-1">
                          <span>Target Disposal</span>
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="py-3 px-4">Investigating Officer</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedCases.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          <Building2 className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                          <p className="font-semibold text-slate-700">No regulatory dockets found</p>
                          <p className="text-xs text-slate-400 mt-0.5">Try resetting active filters or search query.</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedCases.map((c) => {
                        const isOverdue = c.status === 'Overdue';
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                              {c.caseNumber}
                              {c.hasOverlapAlert && (
                                <span className="ml-1.5 inline-block rounded bg-rose-100 px-1 py-0.2 text-[9px] font-bold text-rose-700">
                                  OVERLAP
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 max-w-[200px]">
                              <div className="font-semibold text-slate-900 line-clamp-1">{c.institutionName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{c.institutionCode}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-700">
                              <div className="font-medium">{c.category}</div>
                              <div className="text-[10px] text-slate-400 line-clamp-1">{c.subject}</div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
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
                            <td className="py-3 px-4 whitespace-nowrap">
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
                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                              {formatDate(c.submissionDate)}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`font-medium ${
                                  isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-600'
                                }`}
                              >
                                {c.expectedDisposalDate ? formatDate(c.expectedDisposalDate) : 'Not assigned'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                              {c.assignedOfficer || (
                                <span className="text-slate-400 italic">Unassigned</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedCase(c)}
                                  className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition"
                                  title="Inspect Case Dossier"
                                >
                                  <Eye className="h-3 w-3" /> View
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(c)}
                                  className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-2 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 transition"
                                  title="Update Official Status / Assign Officer"
                                >
                                  <Edit3 className="h-3 w-3" /> Update
                                </button>
                                <button
                                  onClick={() => {
                                    setNoticeTargetCaseId(c.id);
                                    setIsNoticeModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 rounded bg-[#002b5c] px-2 py-1 text-[11px] font-semibold text-white hover:bg-slate-800 transition"
                                  title="Issue Regulatory Notice"
                                >
                                  <Plus className="h-3 w-3" /> Notice
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
                  <div>
                    Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
                    <strong>{Math.min(currentPage * itemsPerPage, filteredCases.length)}</strong> of{' '}
                    <strong>{filteredCases.length}</strong> cases
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

      {/* Official Status Update Modal */}
      {editingCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-amber-50 px-5 py-4">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Regulatory Action &amp; Status Update</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Case: {editingCase.caseNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingCase(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Target Institution</label>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-medium">
                  {editingCase.institutionName} ({editingCase.institutionCode})
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Investigation Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as CaseStatus)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                >
                  <option value="Pending">Pending (Initial Scrutiny)</option>
                  <option value="Under Process">Under Process (Inspection / Enquiry)</option>
                  <option value="Disposed">Disposed (Compliance Verified / Cleared)</option>
                  <option value="Overdue">Overdue (SLA Breached)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Investigating Officer</label>
                <input
                  type="text"
                  value={editOfficer}
                  onChange={(e) => setEditOfficer(e.target.value)}
                  placeholder="e.g. Er. Sandeep Mukherjee, Inspection Officer"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Target Compliance / Disposal Date</label>
                <input
                  type="date"
                  value={editDisposalDate}
                  onChange={(e) => setEditDisposalDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Official Findings / Action Remarks</label>
                <textarea
                  rows={3}
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="Record summary of physical inspection findings, show cause notice issued, or hearing outcome..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCase(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                  disabled={isSubmittingEdit}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSubmittingEdit}
                  className="px-4 py-1.5 rounded-lg bg-[#002b5c] text-white font-semibold hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  {isSubmittingEdit ? 'Saving...' : 'Save & Persist to SQLite'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

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
        onClose={() => {
          setIsNoticeModalOpen(false);
          setNoticeTargetCaseId(undefined);
        }}
        rbCases={rbCases}
        preselectedCaseId={noticeTargetCaseId}
        onNoticeIssued={() => loadData(true)}
      />
    </div>
  );
}
