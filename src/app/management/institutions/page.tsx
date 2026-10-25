'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  ChevronRight,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  MapPin,
  X,
  ArrowLeft,
  ArrowUpDown,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { useManagementData } from '@/lib/managementStore';

export default function InstitutionDirectoryPage() {
  const { institutions } = useManagementData();
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'totalCases' | 'overdueCases'>('totalCases');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Extract unique states & types
  const states = useMemo(() => {
    const set = new Set(institutions.map((i) => i.state));
    return Array.from(set).sort();
  }, [institutions]);

  const types = useMemo(() => {
    const set = new Set(institutions.map((i) => i.type));
    return Array.from(set).sort();
  }, [institutions]);

  // Filter & Sort
  const filteredInstitutions = useMemo(() => {
    return institutions
      .filter((inst) => {
        if (stateFilter !== 'ALL' && inst.state !== stateFilter) return false;
        if (typeFilter !== 'ALL' && inst.type !== typeFilter) return false;
        if (statusFilter === 'HAS_OVERDUE' && inst.overdueCases === 0) return false;
        if (statusFilter === 'HAS_PENDING' && inst.pendingCases === 0) return false;
        if (statusFilter === 'CLEAN' && inst.totalCases > inst.disposedCases) return false;
        if (statusFilter === 'HAS_OVERLAP' && !inst.hasActiveOverlap) return false;

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

  const toggleSort = (column: 'name' | 'totalCases' | 'overdueCases') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setStateFilter('ALL');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  const totalOverdueCount = institutions.reduce((acc, i) => acc + i.overdueCases, 0);
  const totalScrutinyCount = institutions.filter(
    (i) => i.approvalStatus === 'Under Scrutiny' || i.approvalStatus === 'Show Cause Issued'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar */}
      <Sidebar
        activeTab="institutions"
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Wrapper */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
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
          {/* Breadcrumb & Navigation */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link href="/management" className="hover:text-blue-700 transition-colors">
              Management
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-900 font-semibold">Institution Directory</span>
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200/80 pb-5 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 border border-blue-200">
                  <Building2 className="h-3.5 w-3.5 text-blue-600" />
                  National Campus Registry
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">
                  {institutions.length} AICTE Approved Institutions Monitored
                </span>
              </div>
              <h1 className="mt-2 font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">
                Institution Directory & Grievance Standing
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
                Centralized registry cross-referencing AICTE technical campuses with live complaint counts,
                statutory SLA breaches, regulatory scrutiny notices, and cross-bureau overlap flags.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/management"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Overview</span>
              </Link>
            </div>
          </div>

          {/* Summary Metric Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">Institutions Listed</span>
              <div className="mt-1 text-2xl font-bold text-slate-900">{institutions.length}</div>
              <span className="text-[11px] text-slate-400">Technical universities & colleges</span>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">Overdue Complaints</span>
              <div className="mt-1 text-2xl font-bold text-rose-600">{totalOverdueCount}</div>
              <span className="text-[11px] text-rose-600 font-medium">Statutory SLA breached</span>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">Scrutiny / Show-Cause</span>
              <div className="mt-1 text-2xl font-bold text-amber-600">{totalScrutinyCount}</div>
              <span className="text-[11px] text-amber-700 font-medium">Regulatory actions pending</span>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">Active Overlap Alerts</span>
              <div className="mt-1 text-2xl font-bold text-purple-600">2</div>
              <span className="text-[11px] text-purple-700 font-medium">Cross-bureau correlation</span>
            </div>
          </div>

          {/* Filters & Search Control Bar */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search */}
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
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Quick filter count & Reset */}
              <div className="flex items-center gap-2 self-end md:self-auto text-xs">
                <span className="text-slate-500">
                  Showing <strong>{filteredInstitutions.length}</strong> of {institutions.length}
                </span>
                {(search || stateFilter !== 'ALL' || typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
                  <button
                    onClick={clearFilters}
                    className="text-blue-700 font-semibold hover:underline text-xs ml-2"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">State</label>
                <select
                  value={stateFilter}
                  onChange={(e) => {
                    setStateFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
                >
                  <option value="ALL">All States ({states.length})</option>
                  {states.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
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
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
                >
                  <option value="ALL">All Disciplines</option>
                  {types.map((tp) => (
                    <option key={tp} value={tp}>
                      {tp}
                    </option>
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
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
                >
                  <option value="ALL">All Complaint Standings</option>
                  <option value="HAS_OVERDUE">Has Overdue Cases (SLA Breached)</option>
                  <option value="HAS_PENDING">Has Active Pending Cases</option>
                  <option value="HAS_OVERLAP">Has Cross-Bureau Overlap Flags</option>
                  <option value="CLEAN">Clean / Fully Disposed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Institution Table */}
          <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200/80 bg-slate-50/80 font-semibold text-slate-600 uppercase text-[11px]">
                  <tr>
                    <th
                      onClick={() => toggleSort('name')}
                      className="px-5 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Institution Name & Location</span>
                        <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="px-4 py-3.5">Type & Accreditation</th>
                    <th className="px-4 py-3.5">AICTE Standing</th>
                    <th
                      onClick={() => toggleSort('totalCases')}
                      className="px-4 py-3.5 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Total Cases</span>
                        <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-center">Bureau Split</th>
                    <th
                      onClick={() => toggleSort('overdueCases')}
                      className="px-4 py-3.5 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Overdue</span>
                        <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedInstitutions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <Building2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700 text-sm">No institutions found</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Try adjusting your search terms or clearing state filters.
                        </p>
                        <button
                          onClick={clearFilters}
                          className="mt-3 inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                        >
                          Clear Filters
                        </button>
                      </td>
                    </tr>
                  ) : (
                    paginatedInstitutions.map((inst) => {
                      const hasOverdue = inst.overdueCases > 0;
                      return (
                        <tr
                          key={inst.id}
                          className="group hover:bg-blue-50/20 transition-colors"
                        >
                          {/* Name & Location */}
                          <td className="px-5 py-4 max-w-sm">
                            <div className="font-bold text-slate-900 group-hover:text-blue-800 transition-colors line-clamp-1">
                              {inst.name}
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                              <span className="font-mono text-slate-600 font-medium">
                                ID: {inst.code}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-slate-500">
                                <MapPin className="h-3 w-3 text-slate-400" />
                                {inst.district}, {inst.state}
                              </span>
                            </div>
                          </td>

                          {/* Type & Accreditation */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-medium text-slate-800 text-xs">
                              {inst.type}
                            </div>
                            <div className="mt-0.5 text-[11px] text-slate-400">
                              {inst.accreditation}
                            </div>
                          </td>

                          {/* Standing Badge */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                inst.approvalStatus === 'Show Cause Issued'
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                  : inst.approvalStatus === 'Under Scrutiny'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {inst.approvalStatus === 'Show Cause Issued' && (
                                <AlertTriangle className="h-3 w-3" />
                              )}
                              {inst.approvalStatus}
                            </span>
                            {inst.hasActiveOverlap && (
                              <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-purple-700">
                                <Sparkles className="h-3 w-3 text-purple-600" />
                                <span>Overlap Alert</span>
                              </div>
                            )}
                          </td>

                          {/* Total Cases */}
                          <td className="px-4 py-4 text-center whitespace-nowrap font-bold text-slate-900 text-sm">
                            {inst.totalCases}
                          </td>

                          {/* Bureau Split */}
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 text-[11px]">
                              <span className="rounded-md bg-blue-50 px-1.5 py-0.5 font-bold text-blue-700">
                                {inst.pgrcCasesCount} PGRC
                              </span>
                              <span className="text-slate-300">/</span>
                              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 font-bold text-amber-700">
                                {inst.regulationCasesCount} RB
                              </span>
                            </div>
                          </td>

                          {/* Overdue */}
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            {hasOverdue ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                                {inst.overdueCases} Overdue
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-semibold text-xs flex items-center justify-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> 0
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <Link
                              href={`/management/institutions/${inst.id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:border-blue-400 hover:bg-blue-50 hover:text-blue-800 transition-all"
                            >
                              <Eye className="h-3.5 w-3.5 text-blue-600" />
                              <span>View Profile</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 text-xs text-slate-500 gap-3">
              <span>
                Page {currentPage} of {totalPages} ({filteredInstitutions.length} total institutions)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-semibold text-xs text-slate-700 shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  Previous
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-7 w-7 rounded-md font-semibold text-xs transition-colors ${
                        currentPage === page
                          ? 'bg-[#003366] text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-semibold text-xs text-slate-700 shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
