'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import {
  Link2,
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
  Scale,
  Users,
  Building2,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import { RbSidebar } from '@/components/layout/RbSidebar';
import { Navbar } from '@/components/layout/Navbar';
import { CaseDetailsModal } from '@/components/dashboard/CaseDetailsModal';
import { CaseItem, CasePriority, CaseStatus } from '@/types/dashboard';
import { fetchComplaints } from '@/lib/complaints-api';
import { formatDate } from '@/lib/utils';

export default function RelatedPgrcCasesPage() {
  const shouldReduceMotion = useReducedMotion();
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [allCases, setAllCases] = useState<CaseItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CaseStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sharedOnly, setSharedOnly] = useState(true);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<'submissionDate' | 'caseNumber' | 'lastUpdated'>('submissionDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const data = await fetchComplaints();
      setAllCases(data);
    } catch (e) {
      console.error('Failed to load complaints', e);
    } finally {
      if (showRefresh) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(false);
    const interval = setInterval(() => loadData(false), 8000);
    return () => clearInterval(interval);
  }, []);

  // Split into PGRC and RB sets
  const pgrcCases = useMemo(() => allCases.filter((c) => c.bureau === 'PGRC'), [allCases]);
  const rbCases = useMemo(() => allCases.filter((c) => c.bureau === 'Regulation Bureau'), [allCases]);

  // Set of institutions with RB cases
  const rbInstitutionCodes = useMemo(() => {
    return new Set(rbCases.map((c) => c.institutionCode));
  }, [rbCases]);

  // PGRC cases enriched with matching RB cases
  const enrichedPgrcCases = useMemo(() => {
    return pgrcCases.map((pgrc) => {
      const matchingRb = rbCases.filter(
        (rb) =>
          rb.institutionCode === pgrc.institutionCode ||
          rb.institutionName.toLowerCase() === pgrc.institutionName.toLowerCase()
      );
      const isSharedInstitution = matchingRb.length > 0;
      const isDirectOverlap = Boolean(pgrc.hasOverlapAlert);

      return {
        ...pgrc,
        relatedRbCases: matchingRb,
        isSharedInstitution,
        isDirectOverlap,
      };
    });
  }, [pgrcCases, rbCases]);

  const categories = useMemo(() => {
    const set = new Set(pgrcCases.map((c) => c.category));
    return Array.from(set).sort();
  }, [pgrcCases]);

  // Filtered cases
  const filteredCases = useMemo(() => {
    return enrichedPgrcCases
      .filter((c) => {
        if (sharedOnly && !c.isSharedInstitution) return false;
        if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
        if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;

        if (search.trim()) {
          const q = search.toLowerCase();
          const matchNumber = c.caseNumber.toLowerCase().includes(q);
          const matchInst = c.institutionName.toLowerCase().includes(q) || c.institutionCode.toLowerCase().includes(q);
          const matchSub = c.subject.toLowerCase().includes(q);
          const matchCat = c.category.toLowerCase().includes(q);
          if (!matchNumber && !matchInst && !matchSub && !matchCat) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';

        if (sortBy === 'submissionDate') {
          valA = new Date(a.submissionDate).getTime();
          valB = new Date(b.submissionDate).getTime();
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
  }, [enrichedPgrcCases, sharedOnly, statusFilter, categoryFilter, search, sortBy, sortOrder]);

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
        activeTab="related-pgrc"
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
                  <span className="text-slate-800 font-semibold">Related PGRC Grievances</span>
                </div>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
                  <Link2 className="h-6 w-6 text-amber-600" />
                  Related PGRC Student &amp; Faculty Grievances
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cross-bureau visibility into student and faculty grievances filed against institutions currently under Regulation Bureau inquiry
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadData(true)}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
                  <span className="hidden sm:inline">Refresh Data</span>
                </button>

                <Link
                  href="/regulation-dashboard/coordination"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#002b5c] px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 transition"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Coordination Workspace</span>
                </Link>
              </div>
            </motion.div>

            {/* Read-Only Guardrail Notice Banner */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950 flex items-start gap-3 shadow-2xs"
            >
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Inter-Bureau Jurisdictional Transparency Guardrail:</span> All
                PGRC grievance records displayed here are owned and adjudicated by the AICTE Public Grievance
                Redressal Cell. Regulation Bureau officials have read-only visibility to detect correlated infractions
                (such as capitation fees coinciding with unapproved intakes) and initiate joint coordination requests.
              </div>
            </motion.div>

            {/* Quick Metrics */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs"
            >
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <span className="text-slate-500 font-medium">All PGRC Cases</span>
                <div className="mt-1 text-xl font-bold text-slate-900">{pgrcCases.length}</div>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 shadow-2xs">
                <span className="text-amber-800 font-medium">Overlapping Campuses</span>
                <div className="mt-1 text-xl font-bold text-amber-900">
                  {enrichedPgrcCases.filter((c) => c.isSharedInstitution).length}
                </div>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3.5 shadow-2xs">
                <span className="text-rose-800 font-medium">Active Overlap Alerts</span>
                <div className="mt-1 text-xl font-bold text-rose-700">
                  {enrichedPgrcCases.filter((c) => c.isDirectOverlap).length}
                </div>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 shadow-2xs">
                <span className="text-blue-800 font-medium">Pending PGRC Inquiries</span>
                <div className="mt-1 text-xl font-bold text-blue-900">
                  {enrichedPgrcCases.filter((c) => c.status === 'Pending' || c.status === 'Under Process').length}
                </div>
              </div>
            </motion.div>

            {/* Filter Bar */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Filter className="h-3.5 w-3.5 text-amber-600" />
                  <span>Cross-Bureau Search &amp; Filters</span>
                </div>
                {(search || statusFilter !== 'ALL' || categoryFilter !== 'ALL' || !sharedOnly) && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('ALL');
                      setCategoryFilter('ALL');
                      setSharedOnly(true);
                      setCurrentPage(1);
                    }}
                    className="text-xs font-medium text-amber-700 hover:text-amber-900 flex items-center gap-1 transition"
                  >
                    <X className="h-3 w-3" /> Reset
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Search */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Search PGRC Grievances</label>
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

                {/* Status */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">PGRC Status</label>
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

                {/* Category */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Grievance Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="ALL">All Grievance Categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Shared Institutions Toggle */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Institutional Scope</label>
                  <button
                    onClick={() => {
                      setSharedOnly(!sharedOnly);
                      setCurrentPage(1);
                    }}
                    className={`w-full rounded-lg border px-3 py-1.5 text-xs font-semibold text-left transition flex items-center justify-between ${
                      sharedOnly
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>{sharedOnly ? 'Institutions with RB Dockets Only' : 'All Technical Institutions'}</span>
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Related Cases Table */}
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
                        className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition select-none"
                      >
                        <div className="flex items-center gap-1">
                          <span>PGRC Case ID</span>
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="py-3.5 px-4">Institution &amp; Code</th>
                      <th className="py-3.5 px-4">Grievance Category</th>
                      <th className="py-3.5 px-4">PGRC Status</th>
                      <th
                        onClick={() => handleSort('submissionDate')}
                        className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition select-none"
                      >
                        <div className="flex items-center gap-1">
                          <span>Received</span>
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="py-3.5 px-4">Matching RB Dockets</th>
                      <th className="py-3.5 px-4">Coordination Status</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedCases.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <Link2 className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                          <p className="font-semibold text-slate-700">No related PGRC grievances found</p>
                          <p className="text-xs text-slate-400 mt-0.5">Toggle institutional scope to view all technical campuses.</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedCases.map((c) => {
                        const matchingRbNumbers = c.relatedRbCases.map((r) => r.caseNumber);
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                              <span className="text-blue-900 font-semibold">{c.caseNumber}</span>
                              {c.isDirectOverlap && (
                                <span className="ml-1.5 inline-block rounded bg-rose-100 px-1 py-0.2 text-[9px] font-bold text-rose-700">
                                  OVERLAP ALERT
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 max-w-[200px]">
                              <div className="font-semibold text-slate-900 line-clamp-1">{c.institutionName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{c.institutionCode}</div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-700">
                              <div className="font-medium">{c.category}</div>
                              <div className="text-[10px] text-slate-400 line-clamp-1">{c.subject}</div>
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
                            <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                              {formatDate(c.submissionDate)}
                            </td>
                            <td className="py-3.5 px-4">
                              {matchingRbNumbers.length > 0 ? (
                                <div className="space-y-1">
                                  {matchingRbNumbers.slice(0, 2).map((num) => (
                                    <span
                                      key={num}
                                      className="inline-block rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-mono text-amber-900 mr-1"
                                    >
                                      {num}
                                    </span>
                                  ))}
                                  {matchingRbNumbers.length > 2 && (
                                    <span className="text-[10px] text-slate-400">
                                      +{matchingRbNumbers.length - 2} more
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">No direct RB case</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {c.isDirectOverlap ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                  <AlertTriangle className="h-3 w-3" /> Joint Review Needed
                                </span>
                              ) : c.isSharedInstitution ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                  Shared Campus
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">Independent Matter</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedCase(c)}
                                  className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-200 transition"
                                  title="View Grievance Details (Read-Only)"
                                >
                                  <Eye className="h-3 w-3" /> View
                                </button>
                                <Link
                                  href={`/regulation-dashboard/coordination?caseId=${c.id}&inst=${encodeURIComponent(c.institutionName)}`}
                                  className="inline-flex items-center gap-1 rounded bg-[#002b5c] px-2 py-1 text-[11px] font-semibold text-white hover:bg-slate-800 transition"
                                  title="Open Coordination Workspace"
                                >
                                  <Users className="h-3 w-3" /> Coordinate
                                </Link>
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
                    <strong>{filteredCases.length}</strong> grievances
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

      {/* Case Details Modal (Read-Only Guardrail for RB Officials on PGRC cases) */}
      <CaseDetailsModal
        selectedCase={selectedCase}
        onClose={() => setSelectedCase(null)}
        allowStatusEdit={false}
      />
    </div>
  );
}
