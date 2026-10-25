'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  Search,
  Filter,
  Calendar,
  Eye,
  ArrowRight,
  ShieldAlert,
  SendHorizontal,
  Lock,
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { InstitutionSidebar } from '@/components/layout/InstitutionSidebar';
import { CaseDetailsModal } from '@/components/dashboard/CaseDetailsModal';
import { CaseItem } from '@/types/dashboard';
import { useInstitution } from '@/lib/institution-context';
import { formatDate } from '@/lib/utils';
import { fetchComplaints } from '@/lib/complaints-api';

export default function InstitutionCasesPage() {
  const { activeCode, activeInstitution } = useInstitution();
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [allCases, setAllCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [bureauFilter, setBureauFilter] = useState<'all' | 'PGRC' | 'Regulation Bureau'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Under Process' | 'Disposed' | 'Overdue'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'Critical' | 'High' | 'Medium' | 'Low'>('all');

  const loadCases = async () => {
    try {
      setLoading(true);
      const data = await fetchComplaints();
      setAllCases(data);
    } catch (e) {
      console.error('Failed to load complaints:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [activeCode]);

  // Strict isolation by institution
  const institutionCases = useMemo(() => {
    return allCases.filter(
      (c) =>
        c.institutionCode === activeCode ||
        c.institutionName.toLowerCase() === activeInstitution.name.toLowerCase()
    );
  }, [allCases, activeCode, activeInstitution.name]);

  // Filtered
  const filteredCases = useMemo(() => {
    return institutionCases.filter((c) => {
      if (bureauFilter !== 'all' && c.bureau !== bureauFilter) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.caseNumber.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.summary.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [institutionCases, bureauFilter, statusFilter, priorityFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <InstitutionSidebar
        activeTab="cases"
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        badgeCounts={{
          cases: institutionCases.length,
        }}
      />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpenMobile(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Link href="/institution-dashboard" className="text-slate-500 hover:text-slate-800">
                Institution Portal
              </Link>
              <span className="text-slate-400">/</span>
              <span className="font-semibold text-slate-900">Case Dossiers</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <Lock className="h-3 w-3 text-emerald-600" />
              <span>Institutional Access Token Active</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 border border-blue-200 flex items-center gap-1">
                  <FolderKanban className="h-3.5 w-3.5 text-blue-600" />
                  Official Case Dossiers
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-slate-500 font-mono">
                  {activeInstitution.name} ({activeInstitution.code})
                </span>
              </div>
              <h1 className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Institutional Grievance Dossiers
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-3xl">
                Browse all statutory inquiries, public grievances, and regulatory compliance files.
                Submit official evidence and track committee deliberations in real time.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-right shadow-xs">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Total Cases
                </div>
                <div className="text-xl font-bold text-slate-900">{institutionCases.length} Files</div>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by case number, subject, keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <span>Bureau:</span>
                <select
                  value={bureauFilter}
                  onChange={(e: any) => setBureauFilter(e.target.value)}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Bureaus</option>
                  <option value="PGRC">PGRC Only</option>
                  <option value="Regulation Bureau">Regulation Bureau</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Under Process">Under Process</option>
                  <option value="Disposed">Disposed</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span>Priority:</span>
                <select
                  value={priorityFilter}
                  onChange={(e: any) => setPriorityFilter(e.target.value)}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dossier Table */}
          <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Case Number</th>
                    <th className="py-3 px-4">Bureau</th>
                    <th className="py-3 px-4">Subject & Allegation</th>
                    <th className="py-3 px-4">Complainant</th>
                    <th className="py-3 px-4">Response Due</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCases.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <FolderKanban className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-700">No cases found</p>
                        <p className="text-slate-400 text-xs mt-1">
                          No grievance cases match the selected filters for {activeInstitution.name}.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredCases.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {c.caseNumber}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.bureau === 'PGRC'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {c.bureau}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-semibold text-slate-900 truncate" title={c.subject}>
                            {c.subject}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">{c.category}</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                            <Lock className="h-2.5 w-2.5 text-slate-400" />
                            {c.complainantType || 'Student / Citizen'}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                          {formatDate(c.expectedDisposalDate)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
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
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.status === 'Disposed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.status === 'Pending'
                                ? 'bg-amber-100 text-amber-800'
                                : c.status === 'Overdue'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                          <button
                            onClick={() => setSelectedCase(c)}
                            className="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md font-medium text-[11px] inline-flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Quick</span>
                          </button>
                          <Link
                            href={`/institution-dashboard/cases/${c.id}`}
                            className="px-2.5 py-1 bg-[#002b5c] text-white hover:bg-[#001f3f] rounded-md font-medium text-[11px] inline-flex items-center gap-1"
                          >
                            <span>Open Dossier</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {selectedCase && (
        <CaseDetailsModal
          selectedCase={selectedCase}
          onClose={() => setSelectedCase(null)}
          allowStatusEdit={false}
        />
      )}
    </div>
  );
}
