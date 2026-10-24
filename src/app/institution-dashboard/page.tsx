'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  ArrowLeft,
  Upload,
  Eye,
} from 'lucide-react';
import { SAMPLE_CASES } from '@/data/mockData';
import { CaseDetailsModal } from '@/components/dashboard/CaseDetailsModal';
import { CaseItem } from '@/types/dashboard';
import { useMounted, formatDate } from '@/lib/utils';

export default function InstitutionDashboard() {
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'resolved'>('all');
  const mounted = useMounted();

  const formattedDate = mounted
    ? new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Saturday, 24 October 2026';

  // Filter cases for the logged in institution (Apex Institute & related sample records)
  const institutionCases = SAMPLE_CASES.filter((c) =>
    c.institutionName.includes('Apex') || c.institutionName.includes('Global') || c.institutionName.includes('Heritage')
  );

  const displayedCases = institutionCases.filter((c) => {
    if (activeTab === 'pending') return c.status === 'Pending' || c.status === 'Overdue' || c.status === 'Under Process';
    if (activeTab === 'resolved') return c.status === 'Disposed';
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-xs">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-slate-900">
                Institution Compliance Portal
              </h1>
              <p className="text-[10px] text-slate-500">
                Apex Institute of Technology & Engineering • AICTE ID: 1-3329182741
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            AICTE Approved Campus
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800 text-white font-bold text-xs">
            AP
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Welcome Banner */}
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-6 text-white shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-0.5 text-xs font-medium text-emerald-300 backdrop-blur-xs">
                  Institution Redressal Desk
                </span>
                <span className="text-xs text-emerald-200">•</span>
                <span className="text-xs text-emerald-200/90">{formattedDate}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Apex Institute Grievance & Compliance Ledger
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Review grievances referred by AICTE PGRC and Regulation Bureau. Submit clarification
                dossiers, institutional inquiry reports, and student fee reconciliation statements.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => alert('Document Submission Portal: Submit institutional rebuttal / compliance report')}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-xs text-slate-950 shadow-sm hover:bg-emerald-400 transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload Compliance Reply
              </button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Total Inward Grievances</span>
            <div className="mt-1 text-2xl font-bold text-slate-900">{institutionCases.length}</div>
            <span className="text-[11px] text-slate-400">Current academic year</span>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Pending Response</span>
            <div className="mt-1 text-2xl font-bold text-amber-600">2</div>
            <span className="text-[11px] text-rose-600 font-semibold">1 requires immediate action</span>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Disposed / Resolved</span>
            <div className="mt-1 text-2xl font-bold text-emerald-600">1</div>
            <span className="text-[11px] text-emerald-600 font-medium">Compliance verified by AICTE</span>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">AICTE Notice Status</span>
            <div className="mt-1 text-2xl font-bold text-rose-600">Active</div>
            <span className="text-[11px] text-rose-600 font-medium">Show-cause pending</span>
          </div>
        </div>

        {/* Inward Cases Table */}
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="border-b border-slate-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Institutional Grievance Notices
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official complaints registered against Apex Institute across AICTE bureaus
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`rounded-md px-3 py-1 font-semibold transition-all ${
                  activeTab === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All ({institutionCases.length})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`rounded-md px-3 py-1 font-semibold transition-all ${
                  activeTab === 'pending'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Action Required
              </button>
              <button
                onClick={() => setActiveTab('resolved')}
                className={`rounded-md px-3 py-1 font-semibold transition-all ${
                  activeTab === 'resolved'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Resolved
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/70 font-semibold text-slate-600 uppercase text-[11px]">
                <tr>
                  <th className="px-5 py-3">Case ID</th>
                  <th className="px-5 py-3">Referring Bureau</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Submission Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-medium text-slate-900">
                      {c.caseNumber}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          c.bureau === 'PGRC'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {c.bureau}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 max-w-sm">
                      <div className="font-semibold text-slate-900 line-clamp-1">{c.subject}</div>
                      <div className="text-[11px] text-slate-400">{c.category}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">
                      {formatDate(c.submissionDate)}
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
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedCase(c)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors shadow-2xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View Notice
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
