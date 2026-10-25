'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ShieldCheck,
  Edit3,
} from 'lucide-react';
import { PgrcSidebar } from '@/components/layout/PgrcSidebar';
import { Navbar } from '@/components/layout/Navbar';
import { CaseDetailsModal } from '@/components/dashboard/CaseDetailsModal';
import { CaseItem, CasePriority, CaseStatus } from '@/types/dashboard';
import { fetchComplaints, updateComplaint } from '@/lib/complaints-api';
import { formatDate } from '@/lib/utils';

const priorityWeight: Record<CasePriority, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export default function PgrcCasesPage() {
  const shouldReduceMotion = useReducedMotion();
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [allCases, setAllCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);

  // Edit Action Modal for PGRC official
  const [editingCase, setEditingCase] = useState<CaseItem | null>(null);
  const [editStatus, setEditStatus] = useState<CaseStatus>('Pending');
  const [editOfficer, setEditOfficer] = useState('');
  const [editDisposalDate, setEditDisposalDate] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CaseStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | CasePriority>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<'submissionDate' | 'expectedDisposalDate' | 'priority' | 'caseNumber' | 'lastUpdated'>('submissionDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const data = await fetchComplaints();
      setAllCases(data);
    } catch (e) {
      console.error('Failed to load cases', e);
    } finally {
      setLoading(false);
      if (showRefresh) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(false);
    const interval = setInterval(() => loadData(false), 8000);
    return () => clearInterval(interval);
  }, []);

  // Filter only PGRC-owned cases for this view
  const pgrcCases = useMemo(() => {
    return allCases.filter((c) => c.bureau === 'PGRC');
  }, [allCases]);

  // Extract categories dynamically
  const categories = useMemo(() => {
    const set = new Set(pgrcCases.map((c) => c.category));
    return Array.from(set).sort();
  }, [pgrcCases]);

  // Filtered & Sorted Cases
  const filteredCases = useMemo(() => {
    return pgrcCases
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
  }, [pgrcCases, statusFilter, priorityFilter, categoryFilter, dateFrom, dateTo, search, sortBy, sortOrder]);

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
        remarks: editRemarks || `PGRC Officer updated status to ${editStatus}`,
        actorName: 'PGRC Official',
        actorRole: 'PGRC Official',
      });

      setToastMessage(`Case ${editingCase.caseNumber} updated successfully!`);
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
      'Assigned Officer',
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
      `"${c.assignedOfficer}"`,
      `"${c.lastUpdated}"`,
      `"${c.expectedDisposalDate}"`,
      c.hasOverlapAlert ? '"Yes"' : '"No"',
      `"${c.subject.replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pgrc-cases-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: shouldReduceMotion ? 0 : 0.05, delayChildren: 0.05 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      <PgrcSidebar
        activeTab="cases"
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        badgeCounts={{
          cases: pgrcCases.length,
          overlaps: pgrcCases.filter((c) => c.hasOverlapAlert).length,
        }}
      />

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
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
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{toastMessage}</span>
            </motion.div>
          )}

          {/* Breadcrumb & Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Link href="/pgrc-dashboard" className="hover:text-blue-700 transition-colors">
                  PGRC Dashboard
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-800 font-semibold">PGRC Cases</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <FileText className="h-6 w-6 text-[#002b5c]" />
                Public Grievance Redressal Cases
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 max-w-2xl">
                Active grievance portfolio under PGRC jurisdiction. Authorized officials may update case progression, assign officers, and set disposal targets.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => loadData(true)}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#002b5c] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#001f3f]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV ({filteredCases.length})</span>
              </button>
            </div>
          </div>

          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* Filter & Search Bar */}
            <motion.div variants={itemVariants} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search by case ID, institution, subject, or officer..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/60 py-1.5 pl-8 pr-8 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>
                    Showing <strong>{filteredCases.length}</strong> of {pgrcCases.length} cases
                  </span>
                  {(search || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL' || dateFrom || dateTo) && (
                    <button onClick={clearFilters} className="text-blue-700 font-semibold hover:underline ml-2">
                      Reset filters
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Under Process">Under Process</option>
                    <option value="Disposed">Disposed</option>
                    <option value="Overdue">Overdue (SLA Breach)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => {
                      setPriorityFilter(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Date Received From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Date Received To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
                  />
                </div>
              </div>
            </motion.div>

            {/* Table */}
            <motion.div variants={itemVariants} className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200/80 bg-slate-50/80 font-semibold text-slate-600 uppercase text-[11px]">
                    <tr>
                      <th onClick={() => handleSort('caseNumber')} className="px-4 py-3.5 cursor-pointer hover:bg-slate-100">
                        <div className="flex items-center gap-1">
                          <span>Case ID</span>
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="px-4 py-3.5">Institution & ID</th>
                      <th className="px-4 py-3.5">Category & Subject</th>
                      <th onClick={() => handleSort('submissionDate')} className="px-4 py-3.5 cursor-pointer hover:bg-slate-100">
                        <div className="flex items-center gap-1">
                          <span>Date Received</span>
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="px-4 py-3.5 text-center">Status</th>
                      <th onClick={() => handleSort('priority')} className="px-4 py-3.5 text-center cursor-pointer hover:bg-slate-100">
                        <div className="flex items-center justify-center gap-1">
                          <span>Priority</span>
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="px-4 py-3.5">Assigned Officer</th>
                      <th onClick={() => handleSort('expectedDisposalDate')} className="px-4 py-3.5 cursor-pointer hover:bg-slate-100">
                        <div className="flex items-center gap-1">
                          <span>SLA Target</span>
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="px-4 py-3.5 text-center">Overlap</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedCases.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-500">
                          <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                          <p className="font-semibold text-slate-700 text-sm">No PGRC complaints found</p>
                          <p className="text-xs text-slate-400 mt-0.5">Try relaxing your search terms or clearing status filters.</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedCases.map((c) => {
                        const isOverdue = c.status === 'Overdue';
                        return (
                          <tr key={c.id} className="hover:bg-blue-50/20 transition-colors">
                            <td className="px-4 py-3.5 font-mono font-semibold text-blue-900 whitespace-nowrap">
                              {c.caseNumber}
                            </td>
                            <td className="px-4 py-3.5 max-w-[200px]">
                              <div className="font-medium text-slate-900 truncate" title={c.institutionName}>
                                {c.institutionName}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {c.institutionCode}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 max-w-[220px]">
                              <div className="font-medium text-slate-800 text-[11px]">
                                {c.category}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate" title={c.subject}>
                                {c.subject}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                              {formatDate(c.submissionDate)}
                            </td>
                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                                  c.status === 'Overdue'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : c.status === 'Under Process'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : c.status === 'Pending'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {isOverdue && <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />}
                                {c.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                  c.priority === 'Critical'
                                    ? 'bg-rose-100 text-rose-800'
                                    : c.priority === 'High'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {c.priority}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-slate-700 font-medium">
                              {c.assignedOfficer || 'Unassigned'}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className={isOverdue ? 'text-rose-700 font-bold' : 'text-slate-600'}>
                                {formatDate(c.expectedDisposalDate)}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {isOverdue ? 'SLA breached' : 'Statutory 45d target'}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              {c.hasOverlapAlert ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                                  <Sparkles className="h-3 w-3 text-purple-600" />
                                  Overlap
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => setSelectedCase(c)}
                                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-700 shadow-2xs"
                                >
                                  <Eye className="h-3.5 w-3.5 text-slate-400" />
                                  <span>Details</span>
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(c)}
                                  className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 shadow-2xs"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                  <span>Update</span>
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

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 text-xs text-slate-500 gap-3">
                <span>
                  Page {currentPage} of {totalPages} ({filteredCases.length} total cases)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-semibold text-xs text-slate-700 shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Previous
                  </button>
                  <span className="font-semibold text-slate-700 px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-semibold text-xs text-slate-700 shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </main>
      </div>

      {/* Case Details Modal */}
      <CaseDetailsModal
        selectedCase={selectedCase}
        onClose={() => setSelectedCase(null)}
        allowStatusEdit={true}
        onStatusUpdated={(updated) => {
          setAllCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          setSelectedCase(updated);
        }}
      />

      {/* PGRC Official Action Update Modal */}
      {editingCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-blue-600" />
                  Official Case Progression Update
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{editingCase.caseNumber}</p>
              </div>
              <button
                onClick={() => setEditingCase(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status Transition</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as CaseStatus)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                >
                  <option value="Pending">Pending (Initial Scrutiny)</option>
                  <option value="Under Process">Under Process (Active Inquiry / Hearing)</option>
                  <option value="Overdue">Overdue (SLA Target Breached)</option>
                  <option value="Disposed">Disposed (Resolution / Final Order)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Investigating Officer</label>
                <input
                  type="text"
                  value={editOfficer}
                  onChange={(e) => setEditOfficer(e.target.value)}
                  placeholder="Officer name / designation"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expected Disposal Date (SLA Target)</label>
                <input
                  type="date"
                  value={editDisposalDate}
                  onChange={(e) => setEditDisposalDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Action Remarks & Next Steps</label>
                <textarea
                  rows={3}
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="Record procedural actions, committee findings, or communication sent to the institution..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => setEditingCase(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSubmittingEdit}
                className="rounded-lg bg-[#002b5c] px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#001f3f] disabled:opacity-50"
              >
                {isSubmittingEdit ? 'Saving to SQLite...' : 'Save & Commit Action'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
