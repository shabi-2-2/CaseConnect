'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  FileText,
  ExternalLink,
  ChevronRight,
  Eye,
  Gavel,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { useManagementData } from '@/lib/managementStore';
import { CaseDetailsModal } from '@/components/dashboard/CaseDetailsModal';
import { CaseItem } from '@/types/dashboard';
import { formatDate } from '@/lib/utils';

interface PageProps {
  params: Promise<{ institutionId: string }>;
}

function InstitutionProfileContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const { institutions, cases } = useManagementData();
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);

  // Match institution by id or code
  const institution = institutions.find(
    (i) => i.id === resolvedParams.institutionId || i.code === resolvedParams.institutionId
  );

  // Associated cases
  const associatedCases = cases.filter(
    (c) =>
      c.institutionCode === institution?.code ||
      c.institutionName.toLowerCase() === institution?.name.toLowerCase()
  );

  if (!institution) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Building2 className="h-12 w-12 text-slate-300 mb-3" />
        <h1 className="text-lg font-bold text-slate-900">Institution Not Found</h1>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          The requested institution record does not exist or has been relocated.
        </p>
        <Link
          href="/management/institutions"
          className="rounded-lg bg-[#003366] px-4 py-2 text-xs font-semibold text-white shadow-xs"
        >
          Return to Institution Directory
        </Link>
      </div>
    );
  }

  const pgrcCount = associatedCases.filter((c) => c.bureau === 'PGRC').length;
  const rbCount = associatedCases.filter((c) => c.bureau === 'Regulation Bureau').length;
  const overdueCount = associatedCases.filter((c) => c.status === 'Overdue').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar
        activeTab="institutions"
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Navbar
          onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
          isSidebarOpen={isSidebarOpenMobile}
          searchQuery=""
          onSearchChange={() => {}}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link href="/management" className="hover:text-blue-700 transition-colors">
              Management
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <Link href="/management/institutions" className="hover:text-blue-700 transition-colors">
              Institutions
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-900 font-semibold truncate max-w-xs">{institution.name}</span>
          </div>

          {/* Institution Header Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#003366] text-white shadow-md">
                  <Building2 className="h-7 w-7 text-amber-300" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                      AICTE ID: {institution.code}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        institution.approvalStatus === 'Show Cause Issued'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : institution.approvalStatus === 'Under Scrutiny'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {institution.approvalStatus}
                    </span>
                    {institution.hasActiveOverlap && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 border border-purple-200 px-2.5 py-0.5 text-[10px] font-bold text-purple-800">
                        <Sparkles className="h-3 w-3 text-purple-600" />
                        Cross-Bureau Overlap Flagged
                      </span>
                    )}
                  </div>

                  <h1 className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {institution.name}
                  </h1>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {institution.address}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">Region: {institution.region}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:self-start">
                <Link
                  href="/management/institutions"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>All Institutions</span>
                </Link>
                <button
                  onClick={() => alert(`Notice drafted for ${institution.name}.`)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#003366] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-900 transition-colors"
                >
                  <Gavel className="h-3.5 w-3.5" />
                  <span>Issue Compliance Notice</span>
                </button>
              </div>
            </div>

            {/* Quick Metadata Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] font-medium">Head of Institution</span>
                <div className="font-bold text-slate-800 mt-0.5">{institution.principalName}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] font-medium">Official Contact</span>
                <div className="font-semibold text-slate-700 mt-0.5">{institution.contactEmail}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] font-medium">Accreditation</span>
                <div className="font-semibold text-slate-700 mt-0.5">{institution.accreditation}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] font-medium">NIRF Standing</span>
                <div className="font-semibold text-slate-700 mt-0.5">{institution.nirfRank || 'Not Ranked'}</div>
              </div>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">Total Complaints</span>
              <div className="mt-1 text-2xl font-bold text-slate-900">{associatedCases.length}</div>
              <span className="text-[11px] text-slate-400">Recorded this cycle</span>
            </div>
            <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-4 shadow-2xs">
              <span className="text-xs text-blue-700 font-medium">PGRC Complaints</span>
              <div className="mt-1 text-2xl font-bold text-blue-900">{pgrcCount}</div>
              <span className="text-[11px] text-blue-700">Student & faculty grievances</span>
            </div>
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 shadow-2xs">
              <span className="text-xs text-amber-800 font-medium">Regulation Bureau</span>
              <div className="mt-1 text-2xl font-bold text-amber-900">{rbCount}</div>
              <span className="text-[11px] text-amber-800">Regulatory audits</span>
            </div>
            <div className="rounded-xl border border-rose-200/80 bg-rose-50/50 p-4 shadow-2xs">
              <span className="text-xs text-rose-700 font-medium">Overdue (SLA Breached)</span>
              <div className="mt-1 text-2xl font-bold text-rose-700">{overdueCount}</div>
              <span className="text-[11px] text-rose-600 font-semibold">&gt; 45 statutory days</span>
            </div>
          </div>

          {/* Active Overlap Alert Card (if applicable) */}
          {institution.hasActiveOverlap && (
            <div className="rounded-xl border border-purple-200 bg-purple-50/80 p-4 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-xs">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-bold text-xs uppercase tracking-wide text-purple-950">
                      Active Cross-Bureau Overlap Flag (Score: 94%)
                    </span>
                    <Link
                      href="/management/overlaps"
                      className="text-xs font-bold text-purple-900 hover:underline flex items-center gap-1"
                    >
                      Review in Overlap Centre <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                  <p className="mt-1 text-xs text-purple-900 leading-relaxed font-medium">
                    Complaints lodged under PGRC and Regulation Bureau cite parallel capitation fee
                    levies for identical academic years. Cross-bureau synchronization is recommended.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Associated Cases Table */}
          <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="border-b border-slate-100 p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Associated Complaints & Regulatory Inquiries
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed docket of active and disposed grievances filed against {institution.name}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                {associatedCases.length} Records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/80 font-semibold text-slate-600 uppercase text-[11px]">
                  <tr>
                    <th className="px-5 py-3">Case ID</th>
                    <th className="px-4 py-3">Bureau</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Expected Disposal</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {associatedCases.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        No active complaints registered against this institution.
                      </td>
                    </tr>
                  ) : (
                    associatedCases.map((c) => (
                      <tr key={c.id} className="hover:bg-blue-50/20 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap font-mono font-bold text-slate-900">
                          {c.caseNumber}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                              c.bureau === 'PGRC'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {c.bureau}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-700 font-medium">
                          {c.category}
                        </td>
                        <td className="px-4 py-3.5 max-w-xs text-slate-800 line-clamp-1 font-semibold">
                          {c.subject}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                              c.status === 'Overdue'
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : c.status === 'Under Process'
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 font-medium">
                          {formatDate(c.expectedDisposalDate)}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedCase(c)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <Eye className="h-3.5 w-3.5 text-blue-600" />
                              <span>Quick View</span>
                            </button>
                            <Link
                              href={`/management/cases/${c.id}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 text-blue-800 px-2.5 py-1 text-xs font-semibold hover:bg-blue-100"
                            >
                              <span>Dossier</span>
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Compliance History & Timeline */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2 mb-4">
              Compliance Audit Trail & Administrative History
            </h3>
            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-700 shrink-0 mt-0.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">
                    Show-Cause Notice Served under AICTE Regulations 2026
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Notice issued regarding failure to furnish verified student fee ledger within the statutory 45-day SLA.
                  </p>
                  <span className="text-[10px] text-slate-400">22 October 2026 • Issued by Dr. R. K. Sharma</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">
                    Cross-Bureau Overlap Correlation Detected
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Automated engine matched student petition with parent development charges complaint (Similarity: 94%).
                  </p>
                  <span className="text-[10px] text-slate-400">20 October 2026 • AICTE Overlap Detection System</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">
                    Annual Technical Approval Extended (Academic Year 2026-27)
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Extension of Approval (EoA) granted subject to compliance with faculty cadre ratios and grievance cell constitution.
                  </p>
                  <span className="text-[10px] text-slate-400">12 June 2026 • AICTE Approval Bureau</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <CaseDetailsModal
        selectedCase={selectedCase}
        onClose={() => setSelectedCase(null)}
      />
    </div>
  );
}

export default function InstitutionProfilePage(props: PageProps) {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-xs text-slate-500">
          Loading institutional profile...
        </div>
      }
    >
      <InstitutionProfileContent {...props} />
    </React.Suspense>
  );
}
