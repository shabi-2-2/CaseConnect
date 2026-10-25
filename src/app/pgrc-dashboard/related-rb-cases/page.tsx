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
} from 'lucide-react';
import { PgrcSidebar } from '@/components/layout/PgrcSidebar';
import { Navbar } from '@/components/layout/Navbar';
import { CaseDetailsModal } from '@/components/dashboard/CaseDetailsModal';
import { CaseItem, CasePriority, CaseStatus } from '@/types/dashboard';
import { fetchComplaints } from '@/lib/complaints-api';
import { formatDate } from '@/lib/utils';

export default function RelatedRbCasesPage() {
  const shouldReduceMotion = useReducedMotion();
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [allCases, setAllCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CaseStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [hasPgrcCounterpartOnly, setHasPgrcCounterpartOnly] = useState(false);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<'submissionDate' | 'lastUpdated' | 'caseNumber'>('submissionDate');
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
      setLoading(false);
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

  // Set of institutions that have active PGRC complaints
  const pgrcInstitutionCodes = useMemo(() => {
    return new Set(pgrcCases.map((c) => c.institutionCode));
  }, [pgrcCases]);

  // RB cases enriched with related PGRC case info
  const enrichedRbCases = useMemo(() => {
    return rbCases.map((rb) => {
      const matchingPgrc = pgrcCases.filter(
        (p) => p.institutionCode === rb.institutionCode || p.institutionName.toLowerCase() === rb.institutionName.toLowerCase()
      );
      const isDirectOverlap = !!rb.hasOverlapAlert;
      return {
        ...rb,
        relatedPgrcCases: matchingPgrc,
        isSharedInstitution: matchingPgrc.length > 0,
        isDirectOverlap,
      };
    });
  }, [rbCases, pgrcCases]);

  // Categories of RB cases
  const categories = useMemo(() => {
    const set = new Set(rbCases.map((c) => c.category));
    return Array.from(set).sort();
  }, [rbCases]);

  // Filter & Sort
  const filteredCases = useMemo(() => {
    return enrichedRbCases
      .filter((c) => {
        if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
        if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;
        if (hasPgrcCounterpartOnly && !c.isSharedInstitution) return false;

        if (search.trim()) {
          const q = search.toLowerCase();
          const matchNum = c.caseNumber.toLowerCase().includes(q);
          const matchInst = c.institutionName.toLowerCase().includes(q) || c.institutionCode.toLowerCase().includes(q);
          const matchSub = c.subject.toLowerCase().includes(q);
          const matchCat = c.category.toLowerCase().includes(q);
          if (!matchNum && !matchInst && !matchSub && !matchCat) return false;
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
  }, [enrichedRbCases, statusFilter, categoryFilter, hasPgrcCounterpartOnly, search, sortBy, sortOrder]);

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

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setHasPgrcCounterpartOnly(false);
    setCurrentPage(1);
  };

  const sharedCount = enrichedRbCases.filter((c) => c.isSharedInstitution).length;
  const overlapCount = enrichedRbCases.filter((c) => c.isDirectOverlap).length;

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
        activeTab="related-rb"
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <Navbar
          onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
          isSidebarOpen={isSidebarOpenMobile}
          searchQuery={search}
          onSearchChange={setSearch}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Link href="/pgrc-dashboard" className="hover:text-blue-700 transition-colors">
                  PGRC Dashboard
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-800 font-semibold">Related RB Cases</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <Scale className="h-6 w-6 text-amber-700" />
                Regulation Bureau Case Visibility
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 max-w-2xl">
                Visibility into concurrent regulatory proceedings concerning technical institutions under PGRC grievance scrutiny.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/pgrc-dashboard/coordination"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#002b5c] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#001f3f]"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Open Coordination Workspace</span>
              </Link>
              <button
                onClick={() => loadData(true)}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Role Boundary & Security Banner */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Inter-Bureau Read-Only Transparency Standing:</span> Regulation Bureau matters displayed on this page are provided for inter-departmental visibility and mutual coordination. PGRC officials can inspect records and link coordination requests, while official status decisions remain restricted to authorized Regulation Bureau officers.
            </div>
          </div>

          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* Summary Strips */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="text-slate-500 text-xs">Total RB Portfolio</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{rbCases.length}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Active Regulation Bureau matters</div>
              </div>

              <div
                onClick={() => setHasPgrcCounterpartOnly(!hasPgrcCounterpartOnly)}
                className={`cursor-pointer rounded-xl border p-4 shadow-2xs transition-all ${
                  hasPgrcCounterpartOnly ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-blue-800 text-xs font-semibold">Shared Institution Matches</div>
                <div className="text-2xl font-bold text-blue-900 mt-1">{sharedCount}</div>
                <div className="text-[11px] text-blue-600 mt-0.5">Institutions with simultaneous PGRC cases</div>
              </div>

              <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 shadow-2xs">
                <div className="text-purple-800 text-xs font-semibold">Direct Overlap Correlations</div>
                <div className="text-2xl font-bold text-purple-900 mt-1">{overlapCount}</div>
                <div className="text-[11px] text-purple-600 mt-0.5">Flagged by overlap engine</div>
              </div>
            </motion.div>

            {/* Search & Filter Bar */}
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
                    placeholder="Search RB case ID, institution, subject, category..."
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
                    Showing <strong>{filteredCases.length}</strong> of {rbCases.length} RB cases
                  </span>
                  {(search || statusFilter !== 'ALL' || categoryFilter !== 'ALL' || hasPgrcCounterpartOnly) && (
                    <button onClick={clearFilters} className="text-blue-700 font-semibold hover:underline ml-2">
                      Reset filters
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">RB Case Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">All RB Statuses</option>
                    <option value="Pending">Pending Scrutiny</option>
                    <option value="Under Process">Under Process (Inspection)</option>
                    <option value="Disposed">Disposed (Compliance Verified)</option>
                    <option value="Overdue">Overdue / Show Cause</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Regulation Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2 text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={hasPgrcCounterpartOnly}
                      onChange={(e) => {
                        setHasPgrcCounterpartOnly(e.target.checked);
                        setCurrentPage(1);
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Shared Institution Counterpart Only</span>
                  </label>
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
                          <span>RB Case ID</span>
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="px-4 py-3.5">Institution & ID</th>
                      <th className="px-4 py-3.5">Category & Regulatory Subject</th>
                      <th className="px-4 py-3.5 text-center">RB Status</th>
                      <th className="px-4 py-3.5">Assigned Officer / Cell</th>
                      <th onClick={() => handleSort('lastUpdated')} className="px-4 py-3.5 cursor-pointer hover:bg-slate-100">
                        <div className="flex items-center gap-1">
                          <span>Last RB Action</span>
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="px-4 py-3.5">Linked PGRC Cases</th>
                      <th className="px-4 py-3.5 text-center">Coordination Status</th>
                      <th className="px-4 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedCases.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-500">
                          <Scale className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                          <p className="font-semibold text-slate-700 text-sm">No Regulation Bureau records match filters</p>
                          <p className="text-xs text-slate-400 mt-0.5">Try toggling filters or checking institution names.</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedCases.map((c) => (
                        <tr key={c.id} className="hover:bg-amber-50/20 transition-colors">
                          <td className="px-4 py-3.5 font-mono font-semibold text-amber-900 whitespace-nowrap">
                            {c.caseNumber}
                          </td>
                          <td className="px-4 py-3.5 max-w-[200px]">
                            <div className="font-medium text-slate-900 truncate" title={c.institutionName}>
                              {c.institutionName}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              ID: {c.institutionCode}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 max-w-[220px]">
                            <div className="font-semibold text-amber-900 text-[11px]">
                              {c.category}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate" title={c.subject}>
                              {c.subject}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                                c.status === 'Overdue'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : c.status === 'Under Process'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-slate-700 font-medium">
                            {c.assignedOfficer || 'Regulation Desk'}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                            {formatDate(c.lastUpdated)}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {c.relatedPgrcCases.length > 0 ? (
                              <div className="space-y-0.5">
                                {c.relatedPgrcCases.slice(0, 2).map((p) => (
                                  <div key={p.id} className="font-mono text-blue-800 font-semibold text-[11px]">
                                    {p.caseNumber}
                                  </div>
                                ))}
                                {c.relatedPgrcCases.length > 2 && (
                                  <div className="text-[10px] text-slate-400">
                                    +{c.relatedPgrcCases.length - 2} more
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">No active PGRC case</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            {c.isDirectOverlap ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                                <Sparkles className="h-3 w-3 text-purple-600" />
                                Overlap Flagged
                              </span>
                            ) : c.isSharedInstitution ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
                                Common Campus
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => setSelectedCase(c)}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                            >
                              <Eye className="h-3.5 w-3.5 text-slate-400" />
                              <span>View (Read-Only)</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 text-xs text-slate-500 gap-3">
                <span>
                  Page {currentPage} of {totalPages} ({filteredCases.length} RB records)
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

      {/* Case Details Modal (Read-Only for RB cases) */}
      <CaseDetailsModal
        selectedCase={selectedCase}
        onClose={() => setSelectedCase(null)}
        allowStatusEdit={false}
      />
    </div>
  );
}
