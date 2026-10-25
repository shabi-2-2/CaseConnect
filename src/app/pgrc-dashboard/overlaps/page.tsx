'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion, Variants, AnimatePresence } from 'framer-motion';
import {
  CopyCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
  X,
  Sparkles,
  RefreshCw,
  Scale,
  FileText,
  Eye,
} from 'lucide-react';
import { PgrcSidebar } from '@/components/layout/PgrcSidebar';
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

export default function PgrcOverlapReviewQueuePage() {
  const shouldReduceMotion = useReducedMotion();
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [overlaps, setOverlaps] = useState<OverlapAlertItem[]>([]);
  const [allCases, setAllCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
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
      setAllCases(casesData);
    } catch (e) {
      console.error('Failed to load overlaps', e);
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

  // Filter overlaps
  const filteredOverlaps = useMemo(() => {
    return overlaps.filter((ovr) => {
      if (statusFilter !== 'ALL' && ovr.reviewStatus !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && ovr.priority !== priorityFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchAlert = ovr.alertNumber.toLowerCase().includes(q);
        const matchInst = ovr.institutionName.toLowerCase().includes(q);
        const matchCase1 = ovr.case1.caseNumber.toLowerCase().includes(q) || ovr.case1.subject.toLowerCase().includes(q);
        const matchCase2 = ovr.case2.caseNumber.toLowerCase().includes(q) || ovr.case2.subject.toLowerCase().includes(q);
        if (!matchAlert && !matchInst && !matchCase1 && !matchCase2) return false;
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
          reviewedBy: 'PGRC Official Desk',
          reviewNotes: reviewNote.trim() || `Reviewed and marked as ${pendingAction.status} by PGRC official.`,
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
        activeTab="overlaps"
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        badgeCounts={{
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

          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Link href="/pgrc-dashboard" className="hover:text-blue-700 transition-colors">
                  PGRC Dashboard
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-800 font-semibold">Overlap Review Queue</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <CopyCheck className="h-6 w-6 text-purple-700" />
                Inter-Bureau Overlap Review Queue
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 max-w-2xl">
                Compare potential cross-bureau correlations side-by-side. Review decisions persist into the shared SQLite database and update Senior Management views without merging separate records.
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
            {/* Metric Strips */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div
                onClick={() => setStatusFilter('ALL')}
                className={`cursor-pointer rounded-xl border p-3.5 shadow-2xs transition-all ${
                  statusFilter === 'ALL' ? 'border-purple-500 bg-purple-50/50 ring-1 ring-purple-500' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-[11px] font-medium text-slate-500">Total Alerts</div>
                <div className="mt-1 text-xl font-bold text-slate-900">{totalCount}</div>
                <div className="text-[10px] text-slate-400">All correlations</div>
              </div>

              <div
                onClick={() => setStatusFilter('Awaiting Review')}
                className={`cursor-pointer rounded-xl border p-3.5 shadow-2xs transition-all ${
                  statusFilter === 'Awaiting Review' ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-[11px] font-medium text-amber-700">Awaiting Review</div>
                <div className="mt-1 text-xl font-bold text-amber-800">{awaitingCount}</div>
                <div className="text-[10px] text-amber-600 font-medium">Action pending</div>
              </div>

              <div
                onClick={() => setStatusFilter('Confirmed Related')}
                className={`cursor-pointer rounded-xl border p-3.5 shadow-2xs transition-all ${
                  statusFilter === 'Confirmed Related' ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-[11px] font-medium text-blue-700">Confirmed Related</div>
                <div className="mt-1 text-xl font-bold text-blue-800">{confirmedRelatedCount}</div>
                <div className="text-[10px] text-blue-600">Joint tracking</div>
              </div>

              <div
                onClick={() => setStatusFilter('Confirmed Duplicate')}
                className={`cursor-pointer rounded-xl border p-3.5 shadow-2xs transition-all ${
                  statusFilter === 'Confirmed Duplicate' ? 'border-rose-500 bg-rose-50/50 ring-1 ring-rose-500' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-[11px] font-medium text-rose-700">Confirmed Duplicate</div>
                <div className="mt-1 text-xl font-bold text-rose-800">{confirmedDuplicateCount}</div>
                <div className="text-[10px] text-rose-600">Duplicate filing</div>
              </div>

              <div
                onClick={() => setStatusFilter('Separate Matters')}
                className={`cursor-pointer rounded-xl border p-3.5 shadow-2xs transition-all ${
                  statusFilter === 'Separate Matters' ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-[11px] font-medium text-emerald-700">Separate Matters</div>
                <div className="mt-1 text-xl font-bold text-emerald-800">{separateCount}</div>
                <div className="text-[10px] text-emerald-600">Distinct causes</div>
              </div>
            </motion.div>

            {/* Overlap Cards List */}
            <div className="space-y-4">
              {filteredOverlaps.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                  <CopyCheck className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700 text-sm">No overlap alerts match the selected criteria</p>
                  <button onClick={() => { setSearch(''); setStatusFilter('ALL'); setPriorityFilter('ALL'); }} className="mt-3 text-xs font-semibold text-blue-700 hover:underline">
                    Reset filters
                  </button>
                </div>
              ) : (
                filteredOverlaps.map((ovr) => (
                  <motion.div
                    key={ovr.id}
                    variants={itemVariants}
                    className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4"
                  >
                    {/* Alert Top Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-purple-900 text-xs bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                          {ovr.alertNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {ovr.institutionName}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          ({ovr.institutionCode})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${getReviewBadge(ovr.reviewStatus)}`}>
                          {ovr.reviewStatus}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Detected {formatDate(ovr.detectedDate)}
                        </span>
                      </div>
                    </div>

                    {/* Side-by-Side Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Case 1 (PGRC) */}
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

                      {/* Case 2 (Regulation Bureau) */}
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
                    <div className="rounded-lg bg-slate-50 p-3 text-xs space-y-1.5">
                      <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                        Correlation Reasoning (Similarity: {ovr.similarityScore}%):
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px] pl-1">
                        {ovr.matchingReasons.map((reason, i) => (
                          <li key={i}>{reason}</li>
                        ))}
                      </ul>
                      {ovr.reviewNotes && (
                        <div className="mt-2 text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200">
                          <span className="font-semibold text-slate-800">Review Note ({ovr.reviewedBy || 'Official'}): </span>
                          {ovr.reviewNotes}
                        </div>
                      )}
                    </div>

                    {/* Review Actions Workflow */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div className="text-[11px] text-slate-400">
                        Official Action: Records human determination into SQLite without auto-merging records.
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() => openConfirmDialog(ovr.id, ovr.alertNumber, ovr.institutionName, 'Confirmed Related')}
                          className="rounded-md border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 hover:bg-blue-100"
                        >
                          Confirm Related
                        </button>
                        <button
                          onClick={() => openConfirmDialog(ovr.id, ovr.alertNumber, ovr.institutionName, 'Confirmed Duplicate')}
                          className="rounded-md border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800 hover:bg-rose-100"
                        >
                          Confirm Duplicate
                        </button>
                        <button
                          onClick={() => openConfirmDialog(ovr.id, ovr.alertNumber, ovr.institutionName, 'Separate Matters')}
                          className="rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                        >
                          Separate Matters
                        </button>
                        <button
                          onClick={() => openConfirmDialog(ovr.id, ovr.alertNumber, ovr.institutionName, 'Requires Further Investigation')}
                          className="rounded-md border border-purple-300 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-800 hover:bg-purple-100"
                        >
                          Need Investigation
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </main>
      </div>

      {/* Confirmation Modal */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-purple-600" />
                Confirm Overlap Classification
              </h3>
              <button onClick={() => setPendingAction(null)} className="rounded p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                You are setting the review standing of <strong className="font-mono text-purple-900">{pendingAction.alertNumber}</strong> to:
              </p>
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 font-bold text-slate-800 text-center">
                {pendingAction.status}
              </div>
              <p className="text-[11px] text-slate-500">
                Institution: <strong>{pendingAction.institutionName}</strong>. This determination will be committed to SQLite and shared across Senior Management and Regulation Bureau dashboards. Original records remain separate.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 mt-3">Review Remarks / Committee Rationale:</label>
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Enter official reasoning for this correlation review..."
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setPendingAction(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCommitReview}
                disabled={isSubmitting}
                className="rounded-lg bg-[#002b5c] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#001f3f] disabled:opacity-50"
              >
                {isSubmitting ? 'Saving to SQLite...' : 'Confirm & Commit'}
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
      />
    </div>
  );
}
