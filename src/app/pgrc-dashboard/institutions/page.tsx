'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import {
  Building2,
  Search,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  MapPin,
  X,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  FileText,
  ShieldCheck,
  Scale,
} from 'lucide-react';
import { PgrcSidebar } from '@/components/layout/PgrcSidebar';
import { Navbar } from '@/components/layout/Navbar';
import { CaseDetailsModal } from '@/components/dashboard/CaseDetailsModal';
import { InstitutionItem, CaseItem } from '@/types/dashboard';
import { fetchComplaints } from '@/lib/complaints-api';
import { formatDate } from '@/lib/utils';

export default function PgrcInstitutionSearchPage() {
  const shouldReduceMotion = useReducedMotion();
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [institutions, setInstitutions] = useState<InstitutionItem[]>([]);
  const [allCases, setAllCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Profile modal state
  const [selectedInst, setSelectedInst] = useState<InstitutionItem | null>(null);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<'name' | 'totalCases' | 'pendingCases' | 'overdueCases'>('totalCases');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const [instRes, casesData] = await Promise.all([
        fetch('/api/institutions', { cache: 'no-store' }).then((r) => r.json()),
        fetchComplaints(),
      ]);
      if (Array.isArray(instRes.institutions)) {
        setInstitutions(instRes.institutions);
      }
      setAllCases(casesData);
    } catch (e) {
      console.error('Failed to load institutions and cases', e);
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

  const states = useMemo(() => {
    const set = new Set(institutions.map((i) => i.state));
    return Array.from(set).sort();
  }, [institutions]);

  const types = useMemo(() => {
    const set = new Set(institutions.map((i) => i.type));
    return Array.from(set).sort();
  }, [institutions]);

  const filteredInstitutions = useMemo(() => {
    return institutions
      .filter((inst) => {
        if (stateFilter !== 'ALL' && inst.state !== stateFilter) return false;
        if (typeFilter !== 'ALL' && inst.type !== typeFilter) return false;
        if (statusFilter === 'HAS_OVERDUE' && inst.overdueCases === 0) return false;
        if (statusFilter === 'HAS_PENDING' && inst.pendingCases === 0) return false;
        if (statusFilter === 'HAS_RB' && inst.regulationCasesCount === 0) return false;
        if (statusFilter === 'CLEAN' && inst.totalCases > inst.disposedCases) return false;

        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = inst.name.toLowerCase().includes(q);
          const matchCode = inst.code.toLowerCase().includes(q);
          const matchState = inst.state.toLowerCase().includes(q);
          const matchDistrict = inst.district.toLowerCase().includes(q);
          return matchName || matchCode || matchState || matchDistrict;
        }
        return true;
      })
      .sort((a, b) => {
        const valA = a[sortBy];
        const valB = b[sortBy];
        if (typeof valA === 'string') {
          return sortOrder === 'asc'
            ? valA.localeCompare(valB as string)
            : (valB as string).localeCompare(valA);
        }
        return sortOrder === 'asc'
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      });
  }, [institutions, stateFilter, typeFilter, statusFilter, search, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredInstitutions.length / itemsPerPage) || 1;
  const paginatedInstitutions = filteredInstitutions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStateFilter('ALL');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  // Cases associated with the currently opened modal institution
  const modalCases = useMemo(() => {
    if (!selectedInst) return [];
    return allCases.filter(
      (c) =>
        c.institutionCode === selectedInst.code ||
        c.institutionName.toLowerCase() === selectedInst.name.toLowerCase()
    );
  }, [selectedInst, allCases]);

  const modalPgrcCases = modalCases.filter((c) => c.bureau === 'PGRC');
  const modalRbCases = modalCases.filter((c) => c.bureau === 'Regulation Bureau');

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
        activeTab="institutions"
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
                <span className="text-slate-800 font-semibold">Institution Search</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <Building2 className="h-6 w-6 text-[#002b5c]" />
                Institution Directory & Grievance Standing
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 max-w-2xl">
                Comprehensive institution directory with real-time complaint counts, concurrent Regulation Bureau actions, and overlap indicators derived from SQLite records.
              </p>
            </div>

            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>
          </div>

          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
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
                    placeholder="Search by institution name, code (1-...), state, or district..."
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
                    Showing <strong>{filteredInstitutions.length}</strong> of {institutions.length} institutions
                  </span>
                  {(search || stateFilter !== 'ALL' || typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
                    <button onClick={clearFilters} className="text-blue-700 font-semibold hover:underline ml-2">
                      Reset filters
                    </button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">State / UT</label>
                  <select
                    value={stateFilter}
                    onChange={(e) => {
                      setStateFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">All States ({states.length})</option>
                    {states.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Institution Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">All Types</option>
                    {types.map((tp) => (
                      <option key={tp} value={tp}>{tp}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Complaint Standing</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">All Standings</option>
                    <option value="HAS_OVERDUE">Has Overdue Cases (SLA Breach)</option>
                    <option value="HAS_PENDING">Has Active Pending Cases</option>
                    <option value="HAS_RB">Has Parallel Regulation Bureau Cases</option>
                    <option value="CLEAN">Clean / Fully Resolved</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Institutions Table */}
            <motion.div variants={itemVariants} className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200/80 bg-slate-50/80 font-semibold text-slate-600 uppercase text-[11px]">
                    <tr>
                      <th onClick={() => toggleSort('name')} className="px-5 py-3.5 cursor-pointer hover:bg-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span>Institution & AICTE ID</span>
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="px-4 py-3.5">Type & Location</th>
                      <th onClick={() => toggleSort('totalCases')} className="px-4 py-3.5 text-center cursor-pointer hover:bg-slate-100">
                        <div className="flex items-center justify-center gap-1">
                          <span>Total Complaints</span>
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </th>
                      <th onClick={() => toggleSort('pendingCases')} className="px-4 py-3.5 text-center cursor-pointer hover:bg-slate-100">
                        <div className="flex items-center justify-center gap-1">
                          <span>Pending</span>
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </th>
                      <th onClick={() => toggleSort('overdueCases')} className="px-4 py-3.5 text-center cursor-pointer hover:bg-slate-100">
                        <div className="flex items-center justify-center gap-1">
                          <span>Overdue</span>
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="px-4 py-3.5 text-center">Related RB Cases</th>
                      <th className="px-4 py-3.5">Last Activity</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedInstitutions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          <Building2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                          <p className="font-semibold text-slate-700 text-sm">No institutions found</p>
                          <p className="text-xs text-slate-400 mt-0.5">Try clearing filters or checking your search query.</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedInstitutions.map((inst) => (
                        <tr key={inst.id} className="hover:bg-blue-50/20 transition-colors">
                          <td className="px-5 py-4 max-w-sm">
                            <div className="font-bold text-slate-900 line-clamp-1">{inst.name}</div>
                            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                              <span className="font-mono text-slate-600 font-medium">ID: {inst.code}</span>
                              {inst.hasActiveOverlap && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-50 px-1.5 py-0.2 text-[10px] font-bold text-purple-700 border border-purple-200">
                                  <Sparkles className="h-2.5 w-2.5" /> Overlap
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-medium text-slate-800 text-xs">{inst.type}</div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              {inst.district}, {inst.state}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center font-bold text-slate-900 text-sm">
                            {inst.totalCases}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {inst.pendingCases > 0 ? (
                              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
                                {inst.pendingCases}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {inst.overdueCases > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                                {inst.overdueCases}
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-semibold text-xs flex items-center justify-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> 0
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {inst.regulationCasesCount > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-200">
                                <Scale className="h-3 w-3" />
                                {inst.regulationCasesCount} RB Case{inst.regulationCasesCount > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4 max-w-[200px]">
                            <p className="text-[11px] text-slate-600 truncate">
                              {inst.recentActivity || 'Grievance verification in progress.'}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => setSelectedInst(inst)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:border-blue-400 hover:bg-blue-50 hover:text-blue-800 transition-all"
                            >
                              <Eye className="h-3.5 w-3.5 text-blue-600" />
                              <span>View Profile</span>
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
                  Page {currentPage} of {totalPages} ({filteredInstitutions.length} institutions)
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

      {/* Institution Profile Modal */}
      {selectedInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl my-8 rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-5"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 border border-blue-200">
                  <Building2 className="h-3.5 w-3.5 text-blue-600" />
                  Institutional Dossier
                </span>
                <h2 className="mt-1.5 font-bold text-lg text-slate-900">{selectedInst.name}</h2>
                <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="font-mono text-slate-700 font-medium">Permanent ID: {selectedInst.code}</span>
                  <span>•</span>
                  <span>{selectedInst.type}</span>
                  <span>•</span>
                  <span>{selectedInst.district}, {selectedInst.state}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedInst(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                <div className="text-slate-500">Total Cases</div>
                <div className="text-xl font-bold text-slate-900 mt-0.5">{selectedInst.totalCases}</div>
                <div className="text-[10px] text-slate-400">All registered</div>
              </div>
              <div className="rounded-lg border border-blue-200 p-3 bg-blue-50/50">
                <div className="text-blue-800 font-medium">PGRC Cases</div>
                <div className="text-xl font-bold text-blue-900 mt-0.5">{selectedInst.pgrcCasesCount}</div>
                <div className="text-[10px] text-blue-600">PGRC jurisdiction</div>
              </div>
              <div className="rounded-lg border border-indigo-200 p-3 bg-indigo-50/50">
                <div className="text-indigo-800 font-medium">RB Cases</div>
                <div className="text-xl font-bold text-indigo-900 mt-0.5">{selectedInst.regulationCasesCount}</div>
                <div className="text-[10px] text-indigo-600">Regulation Bureau</div>
              </div>
              <div className="rounded-lg border border-rose-200 p-3 bg-rose-50/50">
                <div className="text-rose-800 font-medium">Overdue Complaints</div>
                <div className="text-xl font-bold text-rose-900 mt-0.5">{selectedInst.overdueCases}</div>
                <div className="text-[10px] text-rose-600">SLA breached</div>
              </div>
            </div>

            {/* PGRC Cases List */}
            <div>
              <h3 className="font-bold text-slate-900 text-xs mb-2 flex items-center justify-between">
                <span>PGRC Grievances ({modalPgrcCases.length})</span>
                <span className="text-[10px] font-normal text-slate-500">Full Official Access</span>
              </h3>
              <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 max-h-48 overflow-y-auto text-xs">
                {modalPgrcCases.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-xs">No PGRC complaints for this institution.</div>
                ) : (
                  modalPgrcCases.map((c) => (
                    <div key={c.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="font-mono font-semibold text-blue-900">{c.caseNumber}</div>
                        <div className="text-slate-600 text-[11px] truncate max-w-md">{c.subject}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">{c.status}</span>
                        <button
                          onClick={() => setSelectedCase(c)}
                          className="rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Relevant RB Cases List */}
            <div>
              <h3 className="font-bold text-slate-900 text-xs mb-2 flex items-center justify-between">
                <span>Related Regulation Bureau Cases ({modalRbCases.length})</span>
                <span className="text-[10px] font-normal text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Visibility / Coordination Only (Read-Only)
                </span>
              </h3>
              <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 max-h-48 overflow-y-auto text-xs">
                {modalRbCases.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-xs">No active Regulation Bureau cases for this institution.</div>
                ) : (
                  modalRbCases.map((c) => (
                    <div key={c.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="font-mono font-semibold text-amber-900">{c.caseNumber}</div>
                        <div className="text-slate-600 text-[11px] truncate max-w-md">{c.subject}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">{c.status}</span>
                        <button
                          onClick={() => setSelectedCase(c)}
                          className="rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          View (Read-Only)
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedInst(null)}
                className="rounded-lg bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Close Dossier
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Case Details Modal */}
      <CaseDetailsModal
        selectedCase={selectedCase}
        onClose={() => setSelectedCase(null)}
        allowStatusEdit={selectedCase?.bureau === 'PGRC'}
        onStatusUpdated={(updated) => {
          setAllCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          setSelectedCase(updated);
        }}
      />
    </div>
  );
}
