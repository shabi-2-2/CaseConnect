'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Scale,
  ArrowLeft,
  Search,
  Eye,
} from 'lucide-react';
import { SAMPLE_CASES } from '@/data/mockData';
import { CaseDetailsModal } from '@/components/dashboard/CaseDetailsModal';
import { CaseItem } from '@/types/dashboard';
import { useMounted, formatDate } from '@/lib/utils';

export default function RegulationBureauDashboard() {
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CaseItem['status']>('ALL');
  const mounted = useMounted();

  const formattedDate = mounted
    ? new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Saturday, 24 October 2026';

  // Filter cases handled by Regulation Bureau
  const rbCases = SAMPLE_CASES.filter((c) => c.bureau === 'Regulation Bureau');

  const filteredCases = rbCases.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.institutionName.toLowerCase().includes(q) ||
        c.caseNumber.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Banner & Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 px-4 sm:px-8 py-3.5 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Switch Role</span>
          </Link>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600 text-white shadow-xs">
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-slate-900">
                Regulation Bureau Enforcement Console
              </h1>
              <p className="text-[10px] text-slate-500">
                Statutory Compliance & Institutional Regulations • AICTE Central HQ
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Regulation Director Desk Active
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-700 text-white font-bold text-xs">
            RB
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Welcome Banner */}
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 p-6 text-white shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-0.5 text-xs font-medium text-amber-300 backdrop-blur-xs">
                  Regulation Bureau (RB) Console
                </span>
                <span className="text-xs text-amber-200">•</span>
                <span className="text-xs text-amber-200/90">{formattedDate}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Institutional Regulations & Inspection Enforcement
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Oversee regulatory infractions regarding land, sanctioned intake capacity, faculty cadre
                ratios, affiliation norms, and unapproved programs across technical campuses.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => alert('Issue Standing Show-Cause Notice (Regulatory Workflow)')}
                className="rounded-xl bg-amber-500 px-4 py-2 font-semibold text-xs text-slate-950 shadow-sm hover:bg-amber-400 transition-colors"
              >
                + Issue Regulatory Notice
              </button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Regulatory Cases</span>
            <div className="mt-1 text-2xl font-bold text-slate-900">889</div>
            <span className="text-[11px] text-amber-700 font-medium">Active compliance dockets</span>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Notices Dispatched</span>
            <div className="mt-1 text-2xl font-bold text-amber-600">142</div>
            <span className="text-[11px] text-slate-400">15-day statutory response window</span>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Inspections Completed</span>
            <div className="mt-1 text-2xl font-bold text-emerald-600">294</div>
            <span className="text-[11px] text-emerald-600 font-medium">Verified by regional teams</span>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">PGRC Linked Overlaps</span>
            <div className="mt-1 text-2xl font-bold text-purple-600">18</div>
            <span className="text-[11px] text-purple-700 font-medium">Joint scrutiny required</span>
          </div>
        </div>

        {/* Case List Table */}
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="border-b border-slate-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Regulation Bureau Enforcement Docket
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Statutory deficiency cases, approval disputes, and infrastructure audits
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | CaseItem['status'])}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs focus:border-amber-500 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Overdue">Overdue</option>
                <option value="Under Process">Under Process</option>
                <option value="Disposed">Disposed</option>
              </select>

              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search regulation cases..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/70 font-semibold text-slate-600 uppercase text-[11px]">
                <tr>
                  <th className="px-5 py-3">Case ID</th>
                  <th className="px-5 py-3">Institution</th>
                  <th className="px-5 py-3">Violation Category</th>
                  <th className="px-5 py-3">Investigating Officer</th>
                  <th className="px-5 py-3">Expected Disposal</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-medium text-slate-900">
                      {c.caseNumber}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{c.institutionName}</div>
                      <div className="text-[11px] text-slate-400">{c.location}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-md bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[11px] font-medium">
                        {c.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">
                      {c.assignedOfficer}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {formatDate(c.expectedDisposalDate)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          c.status === 'Overdue'
                            ? 'bg-rose-100 text-rose-700'
                            : c.status === 'Under Process'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedCase(c)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition-colors shadow-2xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <CaseDetailsModal
        selectedCase={selectedCase}
        onClose={() => setSelectedCase(null)}
      />
    </div>
  );
}
