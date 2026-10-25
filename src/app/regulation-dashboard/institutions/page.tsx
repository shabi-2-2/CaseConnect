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
  Plus,
  Clock,
  Filter,
} from 'lucide-react';
import { RbSidebar } from '@/components/layout/RbSidebar';
import { Navbar } from '@/components/layout/Navbar';
import { CaseDetailsModal } from '@/components/dashboard/CaseDetailsModal';
import { IssueRegulatoryNoticeModal } from '@/components/dashboard/IssueRegulatoryNoticeModal';
import { InstitutionItem, CaseItem } from '@/types/dashboard';
import { fetchComplaints } from '@/lib/complaints-api';

interface RegulatoryNoticeItem {
  id: string;
  noticeNumber: string;
  caseId: string;
  caseNumber: string;
  institutionCode: string;
  noticeType: string;
  reason: string;
  noticeDate: string;
  responseDeadline: string;
  status: string;
}

export default function RbInstitutionSearchPage() {
  const shouldReduceMotion = useReducedMotion();
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [institutions, setInstitutions] = useState<InstitutionItem[]>([]);
  const [allCases, setAllCases] = useState<CaseItem[]>([]);
  const [notices, setNotices] = useState<RegulatoryNoticeItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Profile modal state
  const [selectedInst, setSelectedInst] = useState<InstitutionItem | null>(null);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);

  // Issue Notice modal
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [noticePreselectedCaseId, setNoticePreselectedCaseId] = useState<string | undefined>(undefined);

  // Filters
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<'name' | 'totalCases' | 'regulationCasesCount' | 'overdueCases'>('regulationCasesCount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const [instRes, casesData, noticesRes] = await Promise.all([
        fetch('/api/institutions', { cache: 'no-store' }).then((r) => r.json()),
        fetchComplaints(),
        fetch('/api/notices', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ notices: [] })),
      ]);

      if (Array.isArray(instRes.institutions)) {
        setInstitutions(instRes.institutions);
      }
      setAllCases(casesData || []);
      if (Array.isArray(noticesRes.notices)) {
        setNotices(noticesRes.notices);
      }
    } catch (e) {
      console.error('Failed to load institutions and cases', e);
    } finally {
      if (showRefresh) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(false);
    const interval = setInterval(() => loadData(false), 8000);
    return () => clearInterval(interval);
  }, []);

  const rbCases = useMemo(() => {
    return allCases.filter((c) => c.bureau === 'Regulation Bureau');
  }, [allCases]);

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
          const matchDist = inst.district.toLowerCase().includes(q);
          const matchState = inst.state.toLowerCase().includes(q);
          if (!matchName && !matchCode && !matchDist && !matchState) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';

        if (sortBy === 'name') {
          valA = a.name;
          valB = b.name;
        } else if (sortBy === 'totalCases') {
          valA = a.totalCases;
          valB = b.totalCases;
        } else if (sortBy === 'regulationCasesCount') {
          valA = a.regulationCasesCount;
          valB = b.regulationCasesCount;
        } else if (sortBy === 'overdueCases') {
          valA = a.overdueCases;
          valB = b.overdueCases;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [institutions, stateFilter, typeFilter, statusFilter, search, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredInstitutions.length / itemsPerPage) || 1;
  const paginatedInstitutions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInstitutions.slice(start, start + itemsPerPage);
  }, [filteredInstitutions, currentPage]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Cases for the selected modal institution
  const modalRbCases = useMemo(() => {
    if (!selectedInst) return [];
    return allCases.filter(
      (c) =>
        c.bureau === 'Regulation Bureau' &&
        (c.institutionCode === selectedInst.code ||
          c.institutionName.toLowerCase() === selectedInst.name.toLowerCase())
    );
  }, [selectedInst, allCases]);

  const modalPgrcCases = useMemo(() => {
    if (!selectedInst) return [];
    return allCases.filter(
      (c) =>
        c.bureau === 'PGRC' &&
        (c.institutionCode === selectedInst.code ||
          c.institutionName.toLowerCase() === selectedInst.name.toLowerCase())
    );
  }, [selectedInst, allCases]);

  const modalNotices = useMemo(() => {
    if (!selectedInst) return [];
    return notices.filter((n) => n.institutionCode === selectedInst.code);
  }, [selectedInst, notices]);

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
        activeTab="institutions"
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
                  <span className="text-slate-800 font-semibold">Institutional Repository</span>
                </div>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
                  <Building2 className="h-6 w-6 text-amber-600" />
                  Regulation Bureau Institution Directory
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Search approved technical campuses, audit statutory compliance histories, view cross-bureau matters, and track issued notices
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadData(true)}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition"
                  title="Refresh institutions from SQLite"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
                  <span className="hidden sm:inline">Refresh Data</span>
                </button>
              </div>
            </motion.div>

            {/* Quick Summary Cards */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs"
            >
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <span className="text-slate-500 font-medium">Tracked Institutions</span>
                <div className="mt-1 text-xl font-bold text-slate-900">{institutions.length}</div>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 shadow-2xs">
                <span className="text-amber-800 font-medium">With Regulatory Matters</span>
                <div className="mt-1 text-xl font-bold text-amber-900">
                  {institutions.filter((i) => i.regulationCasesCount > 0).length}
                </div>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3.5 shadow-2xs">
                <span className="text-rose-800 font-medium">With Overdue SLA</span>
                <div className="mt-1 text-xl font-bold text-rose-700">
                  {institutions.filter((i) => i.overdueCases > 0).length}
                </div>
              </div>
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3.5 shadow-2xs">
                <span className="text-indigo-800 font-medium">Regulatory Notices Issued</span>
                <div className="mt-1 text-xl font-bold text-indigo-900">{notices.length}</div>
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
                  <span>Filter Institutions</span>
                </div>
                {(search || stateFilter !== 'ALL' || typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setStateFilter('ALL');
                      setTypeFilter('ALL');
                      setStatusFilter('ALL');
                      setCurrentPage(1);
                    }}
                    className="text-xs font-medium text-amber-700 hover:text-amber-900 flex items-center gap-1 transition"
                  >
                    <X className="h-3 w-3" /> Reset Filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Search */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Search Directory</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Name, AICTE ID, district..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* State */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">State / UT</label>
                  <select
                    value={stateFilter}
                    onChange={(e) => {
                      setStateFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="ALL">All States ({states.length})</option>
                    {states.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Institution Type */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Institution Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="ALL">All Institution Types</option>
                    {types.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Regulatory Status */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Enforcement Standing</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="ALL">All Institutions</option>
                    <option value="HAS_RB">Has Active Regulatory Case</option>
                    <option value="HAS_OVERDUE">Has Overdue SLA Breach</option>
                    <option value="HAS_PENDING">Has Pending Inquiry</option>
                    <option value="CLEAN">Compliant / All Disposed</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Institution Cards Grid */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {paginatedInstitutions.length === 0 ? (
                <div className="col-span-full py-12 text-center rounded-xl border border-slate-200 bg-white p-8">
                  <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700 text-sm">No institutions match active filters</p>
                  <p className="text-xs text-slate-400 mt-1">Try resetting the state, type, or search query.</p>
                </div>
              ) : (
                paginatedInstitutions.map((inst) => (
                  <motion.div
                    key={inst.id}
                    whileHover={shouldReduceMotion ? {} : { y: -3 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {inst.code}
                        </span>
                        {inst.overdueCases > 0 ? (
                          <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                            {inst.overdueCases} Overdue
                          </span>
                        ) : inst.regulationCasesCount > 0 ? (
                          <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            {inst.regulationCasesCount} RB Case{inst.regulationCasesCount > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            Compliant
                          </span>
                        )}
                      </div>

                      <h3 className="mt-2.5 font-bold text-sm text-slate-900 line-clamp-2 leading-snug">
                        {inst.name}
                      </h3>

                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{inst.district}, {inst.state}</span>
                      </div>

                      <div className="mt-1 text-[11px] text-slate-400 line-clamp-1">{inst.type}</div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="grid grid-cols-3 gap-1 text-center text-xs mb-3">
                        <div className="rounded bg-slate-50 p-1.5">
                          <div className="text-[10px] text-slate-400">Total</div>
                          <div className="font-bold text-slate-900">{inst.totalCases}</div>
                        </div>
                        <div className="rounded bg-amber-50/70 p-1.5">
                          <div className="text-[10px] text-amber-700">RB Dockets</div>
                          <div className="font-bold text-amber-900">{inst.regulationCasesCount}</div>
                        </div>
                        <div className="rounded bg-blue-50/70 p-1.5">
                          <div className="text-[10px] text-blue-700">PGRC</div>
                          <div className="font-bold text-blue-900">{inst.pgrcCasesCount}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedInst(inst)}
                        className="w-full inline-flex items-center justify-center gap-1 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-800 px-3 py-1.5 text-xs font-semibold text-slate-700 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Inspect Institution Dossier</span>
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div
                variants={itemVariants}
                className="flex items-center justify-between border-t border-slate-200/80 pt-4 text-xs text-slate-500"
              >
                <div>
                  Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
                  <strong>{Math.min(currentPage * itemsPerPage, filteredInstitutions.length)}</strong> of{' '}
                  <strong>{filteredInstitutions.length}</strong> institutions
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded border border-slate-200 px-2.5 py-1 hover:bg-white disabled:opacity-40 transition"
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
                          : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded border border-slate-200 px-2.5 py-1 hover:bg-white disabled:opacity-40 transition"
                  >
                    Next
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </main>
      </div>

      {/* Institution Dossier Modal */}
      {selectedInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl my-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
                  <Scale className="h-3.5 w-3.5 text-amber-600" />
                  Regulation Bureau Institutional Profile
                </span>
                <h2 className="mt-1.5 font-bold text-lg text-slate-900">{selectedInst.name}</h2>
                <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="font-mono text-slate-700 font-medium">Permanent AICTE ID: {selectedInst.code}</span>
                  <span>•</span>
                  <span>{selectedInst.type}</span>
                  <span>•</span>
                  <span>{selectedInst.district}, {selectedInst.state}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedInst(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                <div className="text-slate-500">Total Cases</div>
                <div className="text-xl font-bold text-slate-900 mt-0.5">{selectedInst.totalCases}</div>
                <div className="text-[10px] text-slate-400">All registered</div>
              </div>
              <div className="rounded-lg border border-amber-200 p-3 bg-amber-50/50">
                <div className="text-amber-800 font-medium">RB Regulatory Cases</div>
                <div className="text-xl font-bold text-amber-900 mt-0.5">{selectedInst.regulationCasesCount}</div>
                <div className="text-[10px] text-amber-700">Direct RB purview</div>
              </div>
              <div className="rounded-lg border border-blue-200 p-3 bg-blue-50/50">
                <div className="text-blue-800 font-medium">PGRC Grievances</div>
                <div className="text-xl font-bold text-blue-900 mt-0.5">{selectedInst.pgrcCasesCount}</div>
                <div className="text-[10px] text-blue-600">Cross-bureau visibility</div>
              </div>
              <div className="rounded-lg border border-rose-200 p-3 bg-rose-50/50">
                <div className="text-rose-800 font-medium">Overdue Dockets</div>
                <div className="text-xl font-bold text-rose-900 mt-0.5">{selectedInst.overdueCases}</div>
                <div className="text-[10px] text-rose-600">SLA breached</div>
              </div>
            </div>

            {/* RB Regulatory Dockets List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <Scale className="h-4 w-4 text-amber-600" />
                  <span>Regulation Bureau Enforcement Matters ({modalRbCases.length})</span>
                </h3>
                {modalRbCases.length > 0 && (
                  <button
                    onClick={() => {
                      setNoticePreselectedCaseId(modalRbCases[0].id);
                      setIsNoticeModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded bg-[#002b5c] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-800 transition"
                  >
                    <Plus className="h-3 w-3" /> Issue Regulatory Notice
                  </button>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 max-h-48 overflow-y-auto text-xs">
                {modalRbCases.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-xs">
                    No regulatory enforcement cases registered for this institution.
                  </div>
                ) : (
                  modalRbCases.map((c) => (
                    <div key={c.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition">
                      <div>
                        <div className="font-mono font-semibold text-amber-900 flex items-center gap-1.5">
                          {c.caseNumber}
                          {c.hasOverlapAlert && (
                            <span className="rounded bg-rose-100 px-1 py-0.2 text-[9px] font-bold text-rose-700">
                              OVERLAP
                            </span>
                          )}
                        </div>
                        <div className="text-slate-600 text-[11px] truncate max-w-md">{c.subject}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900">
                          {c.status}
                        </span>
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

            {/* Issued Regulatory Notices */}
            <div>
              <h3 className="font-bold text-slate-900 text-xs mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Statutory Notices Issued to Campus ({modalNotices.length})</span>
              </h3>
              <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 max-h-40 overflow-y-auto text-xs">
                {modalNotices.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-xs">
                    No statutory notices issued to this institution yet.
                  </div>
                ) : (
                  modalNotices.map((n) => (
                    <div key={n.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span className="font-mono text-blue-800">{n.noticeNumber}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-700">{n.noticeType}</span>
                        </div>
                        <div className="text-slate-500 text-[11px] truncate max-w-md">{n.reason}</div>
                      </div>
                      <div className="text-right text-[11px]">
                        <div className="text-rose-600 font-semibold">Due: {n.responseDeadline}</div>
                        <div className="text-slate-400 font-mono">{n.status}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cross-Bureau PGRC Grievances List (Transparent Read-Only) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <span>Public Grievance Redressal (PGRC) Cases ({modalPgrcCases.length})</span>
                </h3>
                <span className="text-[10px] text-slate-500">Read-Only Jurisdictional View</span>
              </div>
              <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 max-h-40 overflow-y-auto text-xs bg-slate-50/50">
                {modalPgrcCases.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-xs">
                    No PGRC complaints recorded for this institution.
                  </div>
                ) : (
                  modalPgrcCases.map((c) => (
                    <div key={c.id} className="p-3 flex items-center justify-between hover:bg-white transition">
                      <div>
                        <div className="font-mono font-semibold text-blue-900">{c.caseNumber}</div>
                        <div className="text-slate-600 text-[11px] truncate max-w-md">{c.subject}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                          {c.status}
                        </span>
                        <button
                          onClick={() => setSelectedCase(c)}
                          className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedInst(null)}
                className="rounded-lg bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition"
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
        allowStatusEdit={selectedCase?.bureau === 'Regulation Bureau'}
      />

      {/* Issue Regulatory Notice Modal */}
      <IssueRegulatoryNoticeModal
        isOpen={isNoticeModalOpen}
        onClose={() => {
          setIsNoticeModalOpen(false);
          setNoticePreselectedCaseId(undefined);
        }}
        rbCases={rbCases}
        preselectedCaseId={noticePreselectedCaseId}
        onNoticeIssued={() => loadData(true)}
      />
    </div>
  );
}
