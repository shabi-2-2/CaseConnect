'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText,
  Building2,
  Calendar,
  Clock,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Flag,
  Send,
  MessageSquare,
  ShieldAlert,
  ExternalLink,
  ChevronRight,
  History,
  FileBadge2,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { useManagementData } from '@/lib/managementStore';

interface CaseDetailsPageProps {
  params: Promise<{
    caseId: string;
  }>;
}

function CaseDetailsContent({ params }: CaseDetailsPageProps) {
  const unwrappedParams = use(params);
  const rawCaseId = decodeURIComponent(unwrappedParams.caseId);

  const { cases, institutions, overlaps, toggleCaseFlag, addManagementNote, setCaseFollowUp } =
    useManagementData();

  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [followUpOwner, setFollowUpOwner] = useState('');
  const [followUpDeadline, setFollowUpDeadline] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const [historyItems, setHistoryItems] = useState<any[]>([]);

  // Find target case
  const caseItem = cases.find(
    (c) => c.caseNumber.toLowerCase() === rawCaseId.toLowerCase() || c.id === rawCaseId
  );

  React.useEffect(() => {
    if (!caseItem) return;
    fetch(`/api/case-history?caseId=${encodeURIComponent(caseItem.id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.history)) {
          setHistoryItems(d.history);
        }
      })
      .catch((err) => console.error('Failed to load history', err));
  }, [caseItem]);

  // Find associated institution
  const institution = institutions.find(
    (inst) =>
      inst.id === caseItem?.institutionCode ||
      inst.code === caseItem?.institutionCode ||
      inst.name === caseItem?.institutionName
  );

  // Find related overlap alert
  const overlapAlert = overlaps.find(
    (ovr) =>
      ovr.case1.caseNumber === caseItem?.caseNumber ||
      ovr.case2.caseNumber === caseItem?.caseNumber
  );

  // Related cases from the same institution
  const relatedCases = cases.filter(
    (c) =>
      c.institutionCode === caseItem?.institutionCode &&
      c.caseNumber !== caseItem?.caseNumber
  );

  if (!caseItem) {
    return (
      <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
        <Sidebar
          activeTab="cases"
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
            isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
          }`}
        >
          <Navbar
            onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
            searchQuery=""
            onSearchChange={() => {}}
          />
          <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <ShieldAlert className="h-12 w-12 text-rose-500 mb-3" />
            <h1 className="text-xl font-bold text-slate-800">Case Record Not Found</h1>
            <p className="text-sm text-slate-500 max-w-md mt-1">
              Could not locate a complaint or compliance record with ID{' '}
              <span className="font-mono font-semibold text-slate-700">{rawCaseId}</span>.
            </p>
            <Link
              href="/management/cases"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to All Cases
            </Link>
          </main>
        </div>
      </div>
    );
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addManagementNote(caseItem.id, newNote.trim());
    setNewNote('');
    triggerToast();
  };

  const handleAssignFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpOwner.trim() || !followUpDeadline) return;
    setCaseFollowUp(caseItem.id, {
      owner: followUpOwner.trim(),
      deadline: followUpDeadline,
      instructions: followUpInstructions.trim(),
    });
    setFollowUpInstructions('');
    triggerToast();
  };

  const triggerToast = () => {
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const isOverdue = caseItem.status === 'Overdue';

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      {/* Sidebar */}
      <Sidebar
        activeTab="cases"
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
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
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Top Navigation & Controls */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Link href="/management" className="hover:text-blue-600 transition-colors">
                    Senior Management
                  </Link>
                  <span>/</span>
                  <Link href="/management/cases" className="hover:text-blue-600 transition-colors">
                    All Cases
                  </Link>
                  <span>/</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {caseItem.caseNumber}
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                    {caseItem.caseNumber}
                  </h1>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      isOverdue
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : caseItem.status === 'Disposed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : caseItem.status === 'Under Process'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isOverdue && <AlertTriangle className="mr-1 h-3.5 w-3.5 text-rose-600" />}
                    {caseItem.status}
                  </span>

                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                      caseItem.priority === 'Critical'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : caseItem.priority === 'High'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Priority: {caseItem.priority}
                  </span>

                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                      caseItem.bureau === 'PGRC'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {caseItem.bureau}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleCaseFlag(caseItem.id)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all ${
                    caseItem.managementFlagged
                      ? 'border-amber-400 bg-amber-50 text-amber-800 ring-1 ring-amber-400'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Flag
                    className={`h-4 w-4 ${
                      caseItem.managementFlagged ? 'fill-amber-500 text-amber-500' : 'text-slate-400'
                    }`}
                  />
                  <span>
                    {caseItem.managementFlagged
                      ? 'Marked for Mgmt Attention'
                      : 'Flag for Mgmt Review'}
                  </span>
                </button>

                <Link
                  href="/management/cases"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </div>
            </div>

            {/* Overlap Alert Warning Banner if present */}
            {caseItem.hasOverlapAlert && overlapAlert && (
              <div className="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/40 p-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 border border-purple-200 text-purple-700">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-purple-950 flex items-center gap-2">
                        Cross-Bureau Overlap Alert Detected ({overlapAlert.alertNumber})
                        <span className="rounded bg-purple-200/80 px-2 py-0.5 text-[10px] font-bold text-purple-900">
                          {overlapAlert.similarityScore}% Match
                        </span>
                      </h4>
                      <p className="mt-0.5 text-xs text-purple-800 leading-relaxed">
                        Matched with companion case{' '}
                        <span className="font-mono font-semibold">
                          {overlapAlert.case1.caseNumber === caseItem.caseNumber
                            ? overlapAlert.case2.caseNumber
                            : overlapAlert.case1.caseNumber}
                        </span>{' '}
                        in{' '}
                        <span className="font-semibold">
                          {overlapAlert.case1.caseNumber === caseItem.caseNumber
                            ? overlapAlert.case2.bureau
                            : overlapAlert.case1.bureau}
                        </span>
                        . Reasons: {overlapAlert.matchingReasons.join(', ')}.
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/management/overlaps"
                    className="inline-flex items-center gap-1.5 self-start sm:self-center shrink-0 rounded-lg bg-purple-700 px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-purple-800 transition"
                  >
                    Open Overlap Centre
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* Main 2-Column Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left 2 Columns: Dossier Details, Institution, Timeline */}
              <div className="lg:col-span-2 space-y-6">
                {/* Section 1: Complaint Summary */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                  <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <FileBadge2 className="h-4 w-4 text-blue-600" />
                    Complaint & Regulatory Case Dossier
                  </h3>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Subject / Matter Title
                      </label>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">
                        {caseItem.subject}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Complaint Category
                        </label>
                        <p className="mt-0.5 text-xs font-medium text-slate-800">
                          {caseItem.category}
                        </p>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Assigned Investigating Officer
                        </label>
                        <p className="mt-0.5 text-xs font-medium text-slate-800 flex items-center gap-1.5">
                          <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                          {caseItem.assignedOfficer}
                        </p>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Filing / Receipt Date
                        </label>
                        <p className="mt-0.5 text-xs font-medium text-slate-800 flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {caseItem.submissionDate}
                        </p>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Target SLA Disposal Date
                        </label>
                        <p
                          className={`mt-0.5 text-xs font-semibold flex items-center gap-1.5 ${
                            isOverdue ? 'text-rose-600' : 'text-slate-800'
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          {caseItem.expectedDisposalDate}
                          {isOverdue && (
                            <span className="rounded bg-rose-100 px-1.5 py-0.2 text-[10px] font-bold text-rose-700">
                              Overdue
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Case Description & Allegations
                      </label>
                      <div className="mt-1.5 rounded-lg border border-slate-100 bg-slate-50/70 p-3.5 text-xs text-slate-700 leading-relaxed font-sans">
                        {caseItem.summary ||
                          `Complainant has lodged formal representation regarding ${caseItem.category.toLowerCase()} at ${caseItem.institutionName}. The matter has been assigned to ${caseItem.assignedOfficer} for formal verification under AICTE Regulations.`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Associated Institution Card */}
                {institution ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <h3 className="text-sm font-semibold text-slate-900">
                          Associated AICTE Institution
                        </h3>
                      </div>
                      <Link
                        href={`/management/institutions/${institution.id || institution.code}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Open Full Profile <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-slate-500">Institution Name</div>
                        <div className="text-xs font-semibold text-slate-800 mt-0.5">
                          {institution.name}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400">{institution.code || institution.id}</div>
                      </div>

                      <div>
                        <div className="text-xs text-slate-500">Jurisdiction & Type</div>
                        <div className="text-xs font-semibold text-slate-800 mt-0.5">
                          {institution.district}, {institution.state}
                        </div>
                        <div className="text-[10px] text-slate-500">{institution.type}</div>
                      </div>

                      <div>
                        <div className="text-xs text-slate-500">Total Institutional Cases</div>
                        <div className="text-xs font-semibold text-slate-800 mt-0.5">
                          {institution.totalCases} Total ({institution.pendingCases} Pending)
                        </div>
                        {institution.overdueCases > 0 && (
                          <div className="text-[10px] text-rose-600 font-semibold">
                            ⚠️ {institution.overdueCases} Overdue Cases
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Section 3: Case Activity History & Milestones */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                  <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <History className="h-4 w-4 text-blue-600" />
                    Case Activity Trail & SLA Milestones
                  </h3>

                  <div className="mt-4 space-y-4">
                    <div className="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-200">
                      {historyItems.length > 0 ? (
                        historyItems.map((h, idx) => (
                          <div key={h.id || idx} className="relative mb-6">
                            <div
                              className={`absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white shadow-xs ${
                                h.newStatus === 'Disposed'
                                  ? 'bg-emerald-600'
                                  : h.newStatus === 'Overdue'
                                  ? 'bg-rose-500'
                                  : 'bg-blue-600'
                              }`}
                            />
                            <div className="flex items-center justify-between text-xs font-medium">
                              <span className="text-slate-900 font-semibold">{h.action}</span>
                              <span className="text-[11px] text-slate-400">
                                {h.createdAt ? h.createdAt.slice(0, 16) : ''}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {h.actorName && (
                                <span className="font-semibold text-slate-700">
                                  {h.actorName} ({h.actorRole || 'Official'}):{' '}
                                </span>
                              )}
                              {h.remarks}
                            </p>
                          </div>
                        ))
                      ) : (
                        <>
                          {/* Milestone 1 */}
                          <div className="relative mb-6">
                            <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-600 shadow-xs" />
                            <div className="flex items-center justify-between text-xs font-medium">
                              <span className="text-slate-900">Grievance Registered & Cataloged</span>
                              <span className="text-[11px] text-slate-400">{caseItem.submissionDate}</span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              Complaint received through portal, verified preliminary jurisdiction and
                              routed to {caseItem.bureau}.
                            </p>
                          </div>

                          {/* Milestone 2 */}
                          <div className="relative mb-6">
                            <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-indigo-600 shadow-xs" />
                            <div className="flex items-center justify-between text-xs font-medium">
                              <span className="text-slate-900">
                                Investigating Officer Assigned ({caseItem.assignedOfficer})
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {caseItem.submissionDate}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              Assigned for detailed factual assessment and institutional response call.
                            </p>
                          </div>

                          {/* Milestone 3 */}
                          <div className="relative mb-6">
                            <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-amber-500 shadow-xs" />
                            <div className="flex items-center justify-between text-xs font-medium">
                              <span className="text-slate-900">Latest Procedural Action</span>
                              <span className="text-[11px] text-slate-400">{caseItem.lastUpdated}</span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {isOverdue
                                ? 'SLA target exceeded. Escalation alert dispatched to bureau coordinator.'
                                : 'Status verified. Institutional rejoinder pending review.'}
                            </p>
                          </div>
                        </>
                      )}

                      {/* Milestone 4: Target Disposal */}
                      <div className="relative">
                        <div
                          className={`absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white shadow-xs ${
                            caseItem.status === 'Disposed'
                              ? 'bg-emerald-600'
                              : isOverdue
                              ? 'bg-rose-500'
                              : 'bg-slate-300'
                          }`}
                        />
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span
                            className={
                              caseItem.status === 'Disposed'
                                ? 'text-emerald-700 font-semibold'
                                : isOverdue
                                ? 'text-rose-700 font-semibold'
                                : 'text-slate-600'
                            }
                          >
                            {caseItem.status === 'Disposed'
                              ? 'Final Disposal & Resolution Order'
                              : 'Expected Disposal SLA Target'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {caseItem.expectedDisposalDate}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Mandated timeframe as per AICTE Citizen Charter guidelines (45 calendar
                          days).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Other Cases for this Institution */}
                {relatedCases.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                    <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        Other Cases for this Institution ({relatedCases.length})
                      </span>
                      <Link
                        href={`/management/institutions/${institution?.id || caseItem.institutionCode}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View all
                      </Link>
                    </h3>

                    <div className="mt-3 divide-y divide-slate-100">
                      {relatedCases.slice(0, 3).map((rc) => (
                        <div
                          key={rc.id}
                          className="py-2.5 flex items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <Link
                              href={`/management/cases/${rc.caseNumber}`}
                              className="font-mono font-semibold text-blue-600 hover:underline"
                            >
                              {rc.caseNumber}
                            </Link>
                            <p className="text-slate-600 text-[11px] truncate max-w-sm">
                              {rc.subject}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-slate-500">{rc.bureau}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                rc.status === 'Disposed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : rc.status === 'Overdue'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {rc.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Senior Management Action Console */}
              <div className="space-y-6">
                {/* Notification toast */}
                {showSuccessToast && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-lg bg-emerald-600 p-3 text-xs font-semibold text-white shadow-md flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Management action successfully updated!</span>
                  </motion.div>
                )}

                {/* Management Action Panel */}
                <div className="rounded-xl border border-blue-200 bg-gradient-to-b from-blue-50/40 to-white p-5 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-blue-700" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Senior Management Console
                      </h3>
                    </div>
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                      Director Access
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    Record internal management directives, tag priority follow-ups, and instruct
                    bureau officers.
                  </p>

                  {/* Follow-up Status Card */}
                  {caseItem.followUp ? (
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs">
                      <div className="flex items-center justify-between font-semibold text-amber-900">
                        <span>Active Follow-up Mandate</span>
                        <span className="rounded bg-amber-200/80 px-1.5 py-0.5 text-[10px]">
                          {caseItem.followUp.status}
                        </span>
                      </div>
                      <div className="mt-1 text-slate-700">
                        <span className="font-medium">Assigned Officer:</span>{' '}
                        {caseItem.followUp.owner}
                      </div>
                      <div className="text-slate-700">
                        <span className="font-medium">Target Deadline:</span>{' '}
                        {caseItem.followUp.deadline}
                      </div>
                      {caseItem.followUp.instructions && (
                        <p className="mt-1.5 text-[11px] text-amber-800 italic">
                          &ldquo;{caseItem.followUp.instructions}&rdquo;
                        </p>
                      )}
                    </div>
                  ) : null}

                  {/* Form: Assign Follow-up */}
                  <form onSubmit={handleAssignFollowUp} className="mt-4 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-800">
                      {caseItem.followUp ? 'Update Follow-up Directive' : 'Assign Follow-up Directive'}
                    </h4>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Follow-up Owner / Officer
                      </label>
                      <input
                        type="text"
                        value={followUpOwner}
                        onChange={(e) => setFollowUpOwner(e.target.value)}
                        placeholder="e.g. Dr. V. K. Bansal (Advisor-I)"
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Directive Deadline
                      </label>
                      <input
                        type="date"
                        value={followUpDeadline}
                        onChange={(e) => setFollowUpDeadline(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Specific Instructions (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={followUpInstructions}
                        onChange={(e) => setFollowUpInstructions(e.target.value)}
                        placeholder="e.g. Conduct joint inspection before next hearing..."
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700 transition"
                    >
                      Save Follow-up Mandate
                    </button>
                  </form>
                </div>

                {/* Management Directives / Notes Trail */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                  <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    Senior Management Notes ({caseItem.managementNotes?.length || 0})
                  </h3>

                  {/* Add Note Input */}
                  <form onSubmit={handleAddNote} className="mt-3 space-y-2">
                    <textarea
                      rows={2}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add an internal management directive or confidential note..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
                      >
                        <Send className="h-3 w-3" />
                        Post Note
                      </button>
                    </div>
                  </form>

                  {/* Notes List */}
                  <div className="mt-4 space-y-3">
                    {!caseItem.managementNotes || caseItem.managementNotes.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-3">
                        No management notes recorded yet.
                      </p>
                    ) : (
                      caseItem.managementNotes.map((note) => (
                        <div
                          key={note.id}
                          className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs"
                        >
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                            <span className="font-semibold text-slate-800">{note.author}</span>
                            <span>{note.timestamp}</span>
                          </div>
                          <div className="text-[10px] text-blue-600 mb-1">{note.authorRole}</div>
                          <p className="text-slate-700 text-xs leading-relaxed">{note.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Prototype Disclaimer Card */}
                <div className="rounded-lg border border-slate-200 bg-slate-100/70 p-3 text-[11px] text-slate-500 leading-relaxed">
                  <span className="font-semibold text-slate-700">Prototype Note:</span> Management
                  notes and follow-up directives update local prototype state and persist across
                  sessions using browser storage. Real AICTE deployment connects to the central
                  e-Governance API gateway.
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function CaseDetailsPage(props: CaseDetailsPageProps) {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-xs text-slate-500">
          Loading case dossier...
        </div>
      }
    >
      <CaseDetailsContent {...props} />
    </React.Suspense>
  );
}
