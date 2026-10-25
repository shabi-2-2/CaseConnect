'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Scale,
  Calendar,
  Search,
  Eye,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { SAMPLE_CASES } from '@/data/mockData';
import { CaseDetailsModal } from '@/components/dashboard/CaseDetailsModal';
import { CaseItem } from '@/types/dashboard';
import { useMounted, formatDate } from '@/lib/utils';

export default function RegulationBureauDashboard() {
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CaseItem['status']>('ALL');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const mounted = useMounted();

  const formattedDate = mounted
    ? new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Saturday, 24 October 2026';

  const rbCases = SAMPLE_CASES.filter((c) => c.bureau === 'Regulation Bureau');

  const filteredCases = rbCases.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        c.institutionName.toLowerCase().includes(q) ||
        c.caseNumber.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const overdueCount = rbCases.filter((c) => c.status === 'Overdue').length;
  const underProcessCount = rbCases.filter((c) => c.status === 'Under Process').length;
  const disposedCount = rbCases.filter((c) => c.status === 'Disposed').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-slate-200/80 bg-[#002b5c] text-white transition-all duration-300 ease-in-out w-64 ${
          isSidebarOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white shadow-md">
              <Scale className="h-5 w-5 text-amber-300" />
            </div>
            <div className="flex flex-col truncate">
              <span className="font-bold text-white text-sm tracking-tight">CaseConnect</span>
              <span className="text-[10px] text-white/70 truncate uppercase tracking-wider font-semibold">
                Regulation Bureau
              </span>
            </div>
          </div>
        </div>

        <div className="mx-3 mt-3.5 mb-1 rounded-lg bg-white/5 p-2.5 border border-white/10">
          <div className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Role</div>
          <div className="mt-1 text-xs font-semibold text-white">Regulation Bureau</div>
          <div className="mt-0.5 text-[10px] text-white/60">AICTE Central HQ</div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          <div className="px-2 pb-1.5 text-[10px] font-semibold tracking-wider text-white/40 uppercase">Navigation</div>
          <button className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium bg-white/15 text-white shadow-xs">
            <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-amber-400" />
            <FileText className="h-4 w-4 shrink-0 text-amber-300" />
            <span className="truncate flex-1 text-left">Enforcement Docket</span>
          </button>
          <Link href="/" className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white">
            <ShieldCheck className="h-4 w-4 shrink-0 text-white/70 group-hover:text-white" />
            <span className="truncate flex-1 text-left">Switch Role / Home</span>
          </Link>
        </nav>
      </aside>

      {isSidebarOpenMobile && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden" onClick={() => setIsSidebarOpenMobile(false)} />
      )}

      <div className="flex-1 flex flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md transition-all sm:px-6">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              onClick={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              aria-label="Toggle navigation menu"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-900">CaseConnect</span>
              <span className="text-slate-400">/</span>
              <span>Regulation Bureau Console</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Switch Role
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200/80 pb-5">
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
                Institutional Regulations & Inspection Enforcement
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
                Oversee regulatory infractions and coordinate inspections across technical campuses.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:self-start md:self-auto">
              <button
                onClick={() => alert('Issue Standing Show-Cause Notice (Regulatory Workflow)')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#002b5c] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#001f3f] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <span>+ Issue Regulatory Notice</span>
              </button>
            </div>
          </div>

          <section aria-label="Regulation Bureau KPIs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border bg-amber-50 border-amber-100">
                    <FileText className="h-4 w-4 text-amber-600" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xs font-medium text-slate-500">Regulatory Cases</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">{rbCases.length}</div>
                  <div className="mt-1 text-[11px] text-slate-400">Active compliance dockets</div>
                </div>
              </div>
              <div className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border bg-rose-50 border-rose-100">
                    <FileText className="h-4 w-4 text-rose-600" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xs font-medium text-slate-500">Overdue</div>
                  <div className="mt-1 text-2xl font-bold text-rose-700">{overdueCount}</div>
                  <div className="mt-1 text-[11px] text-slate-400">Require action</div>
                </div>
              </div>
              <div className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border bg-blue-50 border-blue-100">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xs font-medium text-slate-500">Under Process</div>
                  <div className="mt-1 text-2xl font-bold text-blue-700">{underProcessCount}</div>
                  <div className="mt-1 text-[11px] text-slate-400">Inspections/enquiries</div>
                </div>
              </div>
              <div className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border bg-emerald-50 border-emerald-100">
                    <FileText className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xs font-medium text-slate-500">Disposed</div>
                  <div className="mt-1 text-2xl font-bold text-emerald-700">{disposedCount}</div>
                  <div className="mt-1 text-[11px] text-slate-400">Verified compliance</div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="border-b border-slate-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Regulation Bureau Enforcement Docket</h3>
                <p className="text-xs text-slate-500 mt-0.5">Statutory deficiency cases and enforcement actions</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'ALL' | CaseItem['status'])} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs">
                  <option value="ALL">All Statuses</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Under Process">Under Process</option>
                  <option value="Pending">Pending</option>
                  <option value="Disposed">Disposed</option>
                </select>
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search regulation cases..." className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs focus:border-blue-500 focus:outline-none" />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/70 font-semibold text-slate-600">
                  <tr>
                    <th className="px-5 py-2.5">Case ID</th>
                    <th className="px-5 py-2.5">Institution</th>
                    <th className="px-5 py-2.5">Violation Category</th>
                    <th className="px-5 py-2.5">Investigating Officer</th>
                    <th className="px-5 py-2.5">Expected Disposal</th>
                    <th className="px-5 py-2.5">Status</th>
                    <th className="px-5 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3 font-mono font-medium text-slate-900">{c.caseNumber}</td>
                      <td className="px-5 py-3">
                        <div className="font-semibold text-slate-900">{c.institutionName}</div>
                        <div className="text-[11px] text-slate-400">{c.location}</div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-md bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[11px] font-medium">{c.category}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{c.assignedOfficer}</td>
                      <td className="px-5 py-3 text-slate-600">{formatDate(c.expectedDisposalDate)}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${c.status === 'Overdue' ? 'bg-rose-50 text-rose-700 border-rose-200' : c.status === 'Under Process' ? 'bg-blue-50 text-blue-700 border-blue-200' : c.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{c.status}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => setSelectedCase(c)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs">
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCases.length === 0 && <div className="p-4 text-center text-xs text-slate-500">No cases match the selected filters.</div>}
            </div>
          </section>
        </main>
      </div>

      <CaseDetailsModal selectedCase={selectedCase} onClose={() => setSelectedCase(null)} />
    </div>
  );
}
