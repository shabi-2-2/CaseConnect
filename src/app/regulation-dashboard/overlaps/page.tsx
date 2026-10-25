'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import {
  CopyCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ChevronRight,
  ShieldCheck,
  X,
  Sparkles,
  RefreshCw,
  Scale,
  FileText,
  Eye,
  Filter,
} from 'lucide-react';
import { RbSidebar } from '@/components/layout/RbSidebar';
import { Navbar } from '@/components/layout/Navbar';
import { CaseDetailsModal } from '@/components/dashboard/CaseDetailsModal';
import { OverlapAlertItem, OverlapReviewStatus, CasePriority, CaseItem } from '@/types/dashboard';
import { fetchComplaints } from '@/lib/complaints-api';
import { formatDate } from '@/lib/utils';

interface PendingReviewState {
  alertId: string;
  alertNumber: string;
  institutionName: string;
  status: OverlapReviewStatus;
}

export default function RbOverlapReviewQueuePage() {
  const shouldReduceMotion = useReducedMotion();
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [overlaps, setOverlaps] = useState<OverlapAlertItem[]>([]);
  const [allCases, setAllCases] = useState<CaseItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Selected case for Quick View
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);

  // Review Confirmation Modal
  const [pendingAction, setPendingAction] = useState<PendingReviewState | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OverlapReviewStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | CasePriority>('ALL');

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const [ovrRes, casesData] = await Promise.all([
        fetch('/api/overlaps', { cache: 'no-store' }).then((r) => r.json()),
        fetchComplaints(),
      ]);
      if (Array.isArray(ovrRes.overlaps)) {
        setOverlaps(ovrRes.overlaps);
      }
      setAllCases(casesData || []);
    } catch (e) {
      console.error('Failed to load overlaps', e);
    } finally {
      if (showRefresh) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(false);
    const interval = setInterval(() => loadData(false), 8000);
    return () => clearInterval(interval);
  }, []);

  const rbCases = useMemo(() => allCases.filter((c) => c.bureau === 'Regulation Bureau'), [allCases]);

  // Filter overlaps
  const filteredOverlaps = useMemo(() => {
    return overlaps.filter((ovr) => {
      if (statusFilter !== 'ALL' && ovr.reviewStatus !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && ovr.priority !== priorityFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const mNum = ovr.alertNumber.toLowerCase().includes(q);
        const mInst = ovr.institutionName.toLowerCase().includes(q) || ovr.institutionCode.toLowerCase().includes(q);
        const mC1 = ovr.case1.caseNumber.toLowerCase().includes(q) || ovr.case1.subject.toLowerCase().includes(q);
        const mC2 = ovr.case2.caseNumber.toLowerCase().includes(q) || ovr.case2.subject.toLowerCase().includes(q);
        if (!mNum && !mInst && !mC1 && !mC2) return false;
      }

      return true;
    });
  }, [overlaps, statusFilter, priorityFilter, search]);

  // Counts
  const totalCount = overlaps.length;
  const awaitingCount = overlaps.filter((o) => o.reviewStatus === 'Awaiting Review').length;
  const confirmedRelatedCount = overlaps.filter((o) => o.reviewStatus === 'Confirmed Related').length;
  const confirmedDuplicateCount = overlaps.filter((o) => o.reviewStatus === 'Confirmed Duplicate').length;
  const separateCount = overlaps.filter((o) => o.reviewStatus === 'Separate Matters').length;

  const openConfirmDialog = (
    alertId: string,
    alertNumber: string,
    institutionName: string,
    status: OverlapReviewStatus
  ) => {
    setPendingAction({ alertId, alertNumber, institutionName, status });
    setReviewNote('');
  };

  const handleCommitReview = async () => {
    if (!pendingAction) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/overlaps', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pendingAction.alertId,
          reviewStatus: pendingAction.status,
          reviewedBy: 'Regulation Bureau Official Desk',
          reviewNotes: reviewNote.trim() || `Reviewed and marked as ${pendingAction.status} by Regulation Bureau official.`,
        }),
      });

      if (!res.ok) throw new Error('Failed to persist review decision');

      setToastMessage(`${pendingAction.alertNumber} marked as "${pendingAction.status}" in SQLite!`);
      setTimeout(() => setToastMessage(null), 4000);
      setPendingAction(null);
      await loadData(false);
    } catch (e: any) {
      alert(`Error updating overlap review: ${e?.message || 'Failed'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCase = (caseNum: string) => {
    const found = allCases.find((c) => c.caseNumber === caseNum);
    if (found) setSelectedCase(found);
  };

  const getReviewBadge = (status: OverlapReviewStatus) => {
    switch (status) {
      case 'Awaiting Review':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Confirmed Related':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Confirmed Duplicate':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Separate Matters':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Requires Further Investigation':
        return 'bg-purple-100 text-purple-800 border-purple-300';
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      <RbSidebar
        activeTab="overlaps"
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        badgeCounts={{
          cases: rbCases.length,
          overlaps: awaitingCount,
        }}
      />

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <Navbar
          onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
          isSidebarOpen={isSidebarOpenMobile}
          searchQuery={search}
          onSearchChange={setSearch}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Toast */}
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{toastMessage}</span>
            </motion.div>
          )}

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Header */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5"
            >
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <Link href="/regulation-dashboard" className="hover:text-amber-700 transition-colors">
                    Regulation Bureau
                  </Link>
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                  <span className="text-slate-800 font-semibold">Overlap Detection &amp; Review Queue</span>
                </div>
                <h1 className="mt-1 font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight flex items-center gap-2.5">
                  <CopyCheck className="h-6 w-6 text-amber-600" />
                  Cross-Bureau Overlap Adjudication
                </h1>
                <p className="mt-0.5 text-xs text-slate-500">
                  Side-by-side analysis of potential cross-bureau conflicts between Regulation Bureau inspections and PGRC grievances
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadData(true)}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
                  <span className="hidden sm:inline">Refresh Queue</span>
                </button>
              </div>
            </motion.div>

            {/* Metrics Strip */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs"
            >
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <span className="text-slate-500 font-medium">Total Flagged</span>
                <div className="mt-1 text-xl font-bold text-slate-900">{totalCount}</div>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 shadow-2xs">
                <span className="text-amber-800 font-medium">Awaiting Review</span>
                <div className="mt-1 text-xl font-bold text-amber-900">{awaitingCount}</div>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 shadow-2xs">
                <span className="text-blue-800 font-medium">Confirmed Related</span>
                <div className="mt-1 text-xl font-bold text-blue-900">{confirmedRelatedCount}</div>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 shadow-2xs">
                <span className="text-rose-800 font-medium">Confirmed Duplicate</span>
                <div className="mt-1 text-xl font-bold text-rose-900">{confirmedDuplicateCount}</div>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-2xs">
                <span className="text-emerald-800 font-medium">Separate Matters</span>
                <div className="mt-1 text-xl font-bold text-emerald-900">{separateCount}</div>
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
                  <span>Filter Queue</span>
                </div>
                {(statusFilter !== 'ALL' || priorityFilter !== 'ALL' || search) && (
                  <button
                    onClick={() => {
                      setStatusFilter('ALL');
                      setPriorityFilter('ALL');
                      setSearch('');
                    }}
                    className="text-xs font-medium text-amber-700 hover:text-amber-900 flex items-center gap-1 transition"
                  >
                    <X className="h-3 w-3" /> Reset
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Search Alerts</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Alert #, institution, case ID, subject..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Review Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'ALL' | OverlapReviewStatus)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="ALL">All Review Statuses</option>
                    <option value="Awaiting Review">Awaiting Review</option>
                    <option value="Confirmed Related">Confirmed Related</option>
                    <option value="Confirmed Duplicate">Confirmed Duplicate</option>
                    <option value="Separate Matters">Separate Matters</option>
                    <option value="Requires Further Investigation">Requires Further Investigation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Severity / Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as 'ALL' | CasePriority)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="ALL">All Severities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Overlap Cards List */}
            <motion.div variants={itemVariants} className="space-y-4">
              {filteredOverlaps.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-400">
                  <CopyCheck className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-700 text-sm">No overlap alerts match criteria</p>
                  <p className="text-xs text-slate-400 mt-1">Try resetting the review status filter or search keywords.</p>
                </div>
              ) : (
                filteredOverlaps.map((ovr) => (
                  <motion.div
                    key={ovr.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4 hover:border-amber-300 transition-colors"
                  >
                    {/* Top Row: Alert header & metadata */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                          {ovr.alertNumber}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getReviewBadge(
                            ovr.reviewStatus
                          )}`}
                        >
                          {ovr.reviewStatus}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            ovr.priority === 'Critical'
                              ? 'bg-rose-100 text-rose-800'
                              : ovr.priority === 'High'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {ovr.priority} Priority
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 font-medium">
                          Similarity: <strong className="text-slate-900">{ovr.similarityScore}%</strong>
                        </span>
                      </div>

                      <div className="text-xs text-slate-400">
                        Detected: {formatDate(ovr.detectedDate)}
                      </div>
                    </div>

                    {/* Institution Banner */}
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                      <Building2 className="h-4 w-4 text-amber-600" />
                      <span>{ovr.institutionName}</span>
                      <span className="font-mono text-slate-400 font-normal">({ovr.institutionCode})</span>
                      <span className="text-slate-400 font-normal">• {ovr.region} Region</span>
                    </div>

                    {/* Side-by-Side Comparison Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Case 1 */}
                      <div className="rounded-lg border border-blue-200 bg-blue-50/20 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-blue-800 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-blue-600" />
                            Case 1: {ovr.case1.bureau}
                          </span>
                          <span className="font-mono font-bold text-xs text-blue-900">{ovr.case1.caseNumber}</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-900">{ovr.case1.subject}</div>
                        <div className="text-[11px] text-slate-500">
                          Category: <strong>{ovr.case1.category}</strong> • Status: <strong>{ovr.case1.status}</strong>
                        </div>
                        <p className="text-[11px] text-slate-600 italic border-l-2 border-blue-300 pl-2">
                          &ldquo;{ovr.case1.summary}&rdquo;
                        </p>
                        <button
                          onClick={() => handleOpenCase(ovr.case1.caseNumber)}
                          className="mt-1 text-xs text-blue-700 font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" /> Inspect Case 1
                        </button>
                      </div>

                      {/* Case 2 */}
                      <div className="rounded-lg border border-amber-200 bg-amber-50/20 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-amber-800 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-amber-600" />
                            Case 2: {ovr.case2.bureau}
                          </span>
                          <span className="font-mono font-bold text-xs text-amber-900">{ovr.case2.caseNumber}</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-900">{ovr.case2.subject}</div>
                        <div className="text-[11px] text-slate-500">
                          Category: <strong>{ovr.case2.category}</strong> • Status: <strong>{ovr.case2.status}</strong>
                        </div>
                        <p className="text-[11px] text-slate-600 italic border-l-2 border-amber-300 pl-2">
                          &ldquo;{ovr.case2.summary}&rdquo;
                        </p>
                        <button
                          onClick={() => handleOpenCase(ovr.case2.caseNumber)}
                          className="mt-1 text-xs text-amber-800 font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" /> Inspect Case 2
                        </button>
                      </div>
                    </div>

                    {/* Matching Reasons & Explainability */}
                    <div className="rounded-lg bg-slate-50 p-3 space-y-1.5 text-xs border border-slate-100">
                      <div className="font-semibold text-slate-700 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                        <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                        AI Rule Correlation Evidence
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {ovr.matchingReasons.map((reason, idx) => (
                          <span
                            key={idx}
                            className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] text-slate-700"
                          >
                            ✓ {reason}
                          </span>
                        ))}
                      </div>

                      {ovr.reviewedBy && (
                        <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                          <span>
                            Reviewed by <strong>{ovr.reviewedBy}</strong> on {formatDate(ovr.reviewedAt || '')}
                          </span>
                          {ovr.reviewNotes && <span className="italic truncate max-w-sm">&ldquo;{ovr.reviewNotes}&rdquo;</span>}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons for Official Review */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() =>
                          openConfirmDialog(ovr.id, ovr.alertNumber, ovr.institutionName, 'Confirmed Related')
                        }
                        className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100 transition"
                      >
                        Confirm Related Matter
                      </button>

                      <button
                        onClick={() =>
                          openConfirmDialog(ovr.id, ovr.alertNumber, ovr.institutionName, 'Confirmed Duplicate')
                        }
                        className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition"
                      >
                        Confirm Duplicate Case
                      </button>

                      <button
                        onClick={() =>
                          openConfirmDialog(ovr.id, ovr.alertNumber, ovr.institutionName, 'Separate Matters')
                        }
                        className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                      >
                        Mark as Separate
                      </button>

                      <button
                        onClick={() =>
                          openConfirmDialog(
                            ovr.id,
                            ovr.alertNumber,
                            ovr.institutionName,
                            'Requires Further Investigation'
                          )
                        }
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                      >
                        Need Investigation
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          </motion.div>
        </main>
      </div>

      {/* Review Confirmation Modal */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Scale className="h-4 w-4 text-amber-600" />
                Commit Overlap Review Decision
              </h3>
              <button onClick={() => setPendingAction(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                You are setting the review status of{' '}
                <strong className="text-slate-900">{pendingAction.alertNumber}</strong> ({pendingAction.institutionName}) to:
              </p>
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 font-bold text-amber-900 text-center">
                {pendingAction.status}
              </div>
              <p className="text-[11px] text-slate-500">
                This decision will synchronize with the shared SQLite database and will be reflected immediately on the PGRC and Senior Management dashboards. Original complaints will not be deleted or merged.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Review Notes &amp; Rationale
              </label>
              <textarea
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Enter justification for cross-bureau adjudication..."
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCommitReview}
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-[#002b5c] text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition"
              >
                {isSubmitting ? 'Persisting...' : 'Confirm Decision'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Case Details Modal */}
      <CaseDetailsModal
        selectedCase={selectedCase}
        onClose={() => setSelectedCase(null)}
      />
    </div>
  );
}
