'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion, Variants } from 'framer-motion';
import {
  Sparkles,
  Search,
  CheckCircle2,
  ShieldCheck,
  Building2,
  ExternalLink,
  Check,
  X,
  ChevronRight,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { useManagementData } from '@/lib/managementStore';
import { OverlapReviewStatus, CasePriority } from '@/types/dashboard';

interface PendingActionState {
  alertId: string;
  alertNumber: string;
  institutionName: string;
  status: OverlapReviewStatus;
}

export default function OverlapDetectionCenterPage() {
  const shouldReduceMotion = useReducedMotion();
  const { overlaps, updateOverlapStatus } = useManagementData();
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OverlapReviewStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | CasePriority>('ALL');
  const [showToast, setShowToast] = useState<{ message: string; type: string } | null>(null);

  // Confirmation Dialog State
  const [pendingAction, setPendingAction] = useState<PendingActionState | null>(null);
  const [actionNote, setActionNote] = useState('');

  // Filtered overlaps
  const filteredOverlaps = useMemo(() => {
    return overlaps.filter((ovr) => {
      if (statusFilter !== 'ALL' && ovr.reviewStatus !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && ovr.priority !== priorityFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchAlert = ovr.alertNumber.toLowerCase().includes(q);
        const matchInst = ovr.institutionName.toLowerCase().includes(q);
        const matchCase1 =
          ovr.case1.caseNumber.toLowerCase().includes(q) ||
          ovr.case1.subject.toLowerCase().includes(q);
        const matchCase2 =
          ovr.case2.caseNumber.toLowerCase().includes(q) ||
          ovr.case2.subject.toLowerCase().includes(q);
        const matchReason = ovr.matchingReasons.some((r) => r.toLowerCase().includes(q));
        if (!matchAlert && !matchInst && !matchCase1 && !matchCase2 && !matchReason) {
          return false;
        }
      }
      return true;
    });
  }, [overlaps, statusFilter, priorityFilter, search]);

  // Counts for Metric Strips
  const totalCount = overlaps.length;
  const awaitingCount = overlaps.filter((o) => o.reviewStatus === 'Awaiting Review').length;
  const highPriorityCount = overlaps.filter(
    (o) => o.priority === 'Critical' || o.priority === 'High'
  ).length;
  const confirmedRelatedCount = overlaps.filter(
    (o) => o.reviewStatus === 'Confirmed Related'
  ).length;
  const confirmedDuplicateCount = overlaps.filter(
    (o) => o.reviewStatus === 'Confirmed Duplicate'
  ).length;
  const dismissedCount = overlaps.filter((o) => o.reviewStatus === 'Separate Matters').length;
  const investigationCount = overlaps.filter(
    (o) => o.reviewStatus === 'Requires Further Investigation'
  ).length;

  // Open confirmation modal
  const openConfirmDialog = (
    alertId: string,
    alertNumber: string,
    institutionName: string,
    status: OverlapReviewStatus
  ) => {
    setPendingAction({
      alertId,
      alertNumber,
      institutionName,
      status,
    });
    setActionNote('');
  };

  // Confirm review action
  const confirmReviewAction = () => {
    if (!pendingAction) return;

    updateOverlapStatus(pendingAction.alertId, pendingAction.status, actionNote.trim() || undefined);

    const labels: Record<OverlapReviewStatus, string> = {
      'Confirmed Related': 'Marked as Confirmed Related Cases (Joint Tracking)',
      'Confirmed Duplicate': 'Flagged as Confirmed Duplicate Filing',
      'Separate Matters': 'Dismissed as Separate Matters (Independent Inquiry)',
      'Requires Further Investigation': 'Escalated for Joint Field Verification',
      'Awaiting Review': 'Reset to Awaiting Review',
    };

    setShowToast({
      message: `${pendingAction.alertNumber}: ${labels[pendingAction.status]}`,
      type: pendingAction.status === 'Separate Matters' ? 'info' : 'success',
    });

    setPendingAction(null);
    setActionNote('');

    setTimeout(() => setShowToast(null), 4000);
  };

  const getReviewStatusBadge = (status: OverlapReviewStatus) => {
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

  const getActionExplanation = (status: OverlapReviewStatus) => {
    switch (status) {
      case 'Confirmed Related':
        return 'Both PGRC and Regulation Bureau teams will coordinate findings. Individual statutory records and original filing deadlines remain preserved.';
      case 'Confirmed Duplicate':
        return 'Identifies identical representation from the same complainant or matter across bureaus. Avoids redundant parallel committee proceedings.';
      case 'Separate Matters':
        return 'Verifies that although both cases concern the same institution, the causes of action are distinct and must proceed independently.';
      case 'Requires Further Investigation':
        return 'Escalates this alert to the Regional Office director for physical inspection or document authentication before decision.';
      default:
        return 'Resets this alert to pending executive review status.';
    }
  };

  // Stagger animation definitions
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.25 },
    },
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      {/* Sidebar */}
      <Sidebar
        activeTab="overlaps"
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Content Area with Proper Sidebar Margin & Transition */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
          }`}
      >
        <Navbar
          onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
          isSidebarOpen={isSidebarOpenMobile}
          searchQuery={search}
          onSearchChange={(q) => setSearch(q)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Header & Breadcrumb */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Link href="/management" className="hover:text-blue-600 transition-colors">
                    Senior Management
                  </Link>
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                  <span className="text-slate-800 font-semibold">Cross-Bureau Coordination</span>
                </div>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                  Overlap & Duplicate Detection Centre
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rule-based correlation engine identifying parallel, duplicate, or multi-bureau complaints across PGRC and Regulation Bureau
                </p>
              </div>

              {/* Action Banner */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                  <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
                  Automated Correlation Engine v2.4
                </span>
              </div>
            </motion.div>

            {/* Notification Toast */}
            <AnimatePresence>
              {showToast && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900 shadow-md flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{showToast.message}</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-normal">
                    Persisted across dashboard & case views
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Summary Metrics Cards */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7"
            >
              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
                onClick={() => setStatusFilter('ALL')}
                className={`cursor-pointer rounded-xl border p-3.5 shadow-2xs transition-all ${statusFilter === 'ALL'
                    ? 'border-purple-500 bg-purple-50/50 ring-1 ring-purple-500'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
              >
                <div className="text-[11px] font-medium text-slate-500">Total Alerts</div>
                <div className="mt-1 text-xl font-bold text-slate-900">{totalCount}</div>
                <div className="text-[10px] text-slate-400">All detected cases</div>
              </motion.div>

              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
                onClick={() => setStatusFilter('Awaiting Review')}
                className={`cursor-pointer rounded-xl border p-3.5 shadow-2xs transition-all ${statusFilter === 'Awaiting Review'
                    ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
              >
                <div className="text-[11px] font-medium text-amber-700">Awaiting Review</div>
                <div className="mt-1 text-xl font-bold text-amber-800">{awaitingCount}</div>
                <div className="text-[10px] text-amber-600 font-medium">Pending action</div>
              </motion.div>

              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
                onClick={() =>
                  setPriorityFilter(priorityFilter === 'Critical' ? 'ALL' : 'Critical')
                }
                className={`cursor-pointer rounded-xl border p-3.5 shadow-2xs transition-all ${priorityFilter === 'Critical'
                    ? 'border-rose-500 bg-rose-50/50 ring-1 ring-rose-500'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
              >
                <div className="text-[11px] font-medium text-rose-700">High Priority</div>
                <div className="mt-1 text-xl font-bold text-rose-800">{highPriorityCount}</div>
                <div className="text-[10px] text-rose-600">Critical / High</div>
              </motion.div>

              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
                onClick={() => setStatusFilter('Confirmed Related')}
                className={`cursor-pointer rounded-xl border p-3.5 shadow-2xs transition-all ${statusFilter === 'Confirmed Related'
                    ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
              >
                <div className="text-[11px] font-medium text-blue-700">Confirmed Related</div>
                <div className="mt-1 text-xl font-bold text-blue-800">{confirmedRelatedCount}</div>
                <div className="text-[10px] text-blue-600">Joint coordination</div>
              </motion.div>

              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
                onClick={() => setStatusFilter('Confirmed Duplicate')}
                className={`cursor-pointer rounded-xl border p-3.5 shadow-2xs transition-all ${statusFilter === 'Confirmed Duplicate'
                    ? 'border-rose-500 bg-rose-50/50 ring-1 ring-rose-500'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
              >
                <div className="text-[11px] font-medium text-rose-700">Confirmed Duplicate</div>
                <div className="mt-1 text-xl font-bold text-rose-800">
                  {confirmedDuplicateCount}
                </div>
                <div className="text-[10px] text-rose-600">Duplicate submissions</div>
              </motion.div>

              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
                onClick={() => setStatusFilter('Separate Matters')}
                className={`cursor-pointer rounded-xl border p-3.5 shadow-2xs transition-all ${statusFilter === 'Separate Matters'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
              >
                <div className="text-[11px] font-medium text-emerald-700">
                  Dismissed / Separate
                </div>
                <div className="mt-1 text-xl font-bold text-emerald-800">{dismissedCount}</div>
                <div className="text-[10px] text-emerald-600">Independent cases</div>
              </motion.div>

              <motion.div
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
                onClick={() => setStatusFilter('Requires Further Investigation')}
                className={`cursor-pointer rounded-xl border p-3.5 shadow-2xs transition-all ${statusFilter === 'Requires Further Investigation'
                    ? 'border-purple-500 bg-purple-50/50 ring-1 ring-purple-500'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
              >
                <div className="text-[11px] font-medium text-purple-700">
                  Needs Investigation
                </div>
                <div className="mt-1 text-xl font-bold text-purple-800">{investigationCount}</div>
                <div className="text-[10px] text-purple-600">Field verification</div>
              </motion.div>
            </motion.div>

            {/* Search and Filters */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs"
            >
              <div className="relative flex-1 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by Alert ID, case number, institution, or match reason..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Status Dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[11px]">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as 'ALL' | OverlapReviewStatus)
                    }
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="ALL">All Review Statuses</option>
                    <option value="Awaiting Review">Awaiting Review</option>
                    <option value="Confirmed Related">Confirmed Related</option>
                    <option value="Confirmed Duplicate">Confirmed Duplicate</option>
                    <option value="Separate Matters">Separate Matters</option>
                    <option value="Requires Further Investigation">Further Investigation</option>
                  </select>
                </div>

                {/* Priority Dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[11px]">Priority:</span>
                  <select
                    value={priorityFilter}
                    onChange={(e) =>
                      setPriorityFilter(e.target.value as 'ALL' | CasePriority)
                    }
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                {(search || statusFilter !== 'ALL' || priorityFilter !== 'ALL') && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('ALL');
                      setPriorityFilter('ALL');
                    }}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700"
                  >
                    Reset
                  </button>
                )}
              </div>
            </motion.div>

            {/* Overlap Cards List */}
            <motion.div variants={itemVariants} className="space-y-5">
              {filteredOverlaps.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500 shadow-2xs">
                  No overlap alerts match the selected filters.
                </div>
              ) : (
                filteredOverlaps.map((ovr) => {
                  return (
                    <motion.div
                      key={ovr.id}
                      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-purple-300 transition-all"
                    >
                      {/* Alert Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-3 gap-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-mono text-xs font-bold text-purple-900">
                            {ovr.alertNumber}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${getReviewStatusBadge(
                              ovr.reviewStatus
                            )}`}
                          >
                            {ovr.reviewStatus}
                          </span>

                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${ovr.priority === 'Critical'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                          >
                            {ovr.priority} Priority
                          </span>

                          <span className="text-[11px] text-slate-400">
                            Detected: {ovr.detectedDate}
                          </span>
                        </div>

                        {/* Similarity Score Indicator */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-medium text-slate-500">
                              Correlation Score:
                            </span>
                            <div className="flex items-center gap-1 rounded bg-purple-100 px-2 py-0.5 font-bold text-purple-900 text-xs">
                              <Sparkles className="h-3 w-3 text-purple-700" />
                              {ovr.similarityScore}%
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Institution Banner */}
                      <div className="px-5 py-2.5 bg-purple-50/30 border-b border-purple-100/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-purple-700" />
                          <span className="font-semibold text-slate-800">
                            {ovr.institutionName}
                          </span>
                        </div>

                        <div className="text-[11px] text-purple-700 font-medium hidden sm:block">
                          Rule Triggers: {ovr.matchingReasons.join(' • ')}
                        </div>
                      </div>

                      {/* Side-by-Side Comparison Grid */}
                      <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-2 md:divide-y-0 md:divide-x p-5 gap-4">
                        {/* Case 1: PGRC */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-200">
                                {ovr.case1.bureau}
                              </span>
                              <Link
                                href={`/management/cases/${ovr.case1.caseNumber}`}
                                className="font-mono text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                              >
                                {ovr.case1.caseNumber}
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </div>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ovr.case1.status === 'Overdue'
                                  ? 'bg-rose-100 text-rose-800 font-bold'
                                  : ovr.case1.status === 'Disposed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                            >
                              {ovr.case1.status}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">
                              Category: {ovr.case1.category}
                            </span>
                            <h4 className="text-xs font-semibold text-slate-900 mt-0.5">
                              {ovr.case1.subject}
                            </h4>
                          </div>

                          <p className="rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-600 leading-relaxed border border-slate-100">
                            {ovr.case1.summary}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>Complainant: {ovr.case1.complainantType}</span>
                            <span>Filed: {ovr.case1.submissionDate}</span>
                          </div>
                        </div>

                        {/* Case 2: Regulation Bureau */}
                        <div className="space-y-3 md:pl-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                                {ovr.case2.bureau}
                              </span>
                              <Link
                                href={`/management/cases/${ovr.case2.caseNumber}`}
                                className="font-mono text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                              >
                                {ovr.case2.caseNumber}
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </div>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ovr.case2.status === 'Overdue'
                                  ? 'bg-rose-100 text-rose-800 font-bold'
                                  : ovr.case2.status === 'Disposed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                            >
                              {ovr.case2.status}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">
                              Category: {ovr.case2.category}
                            </span>
                            <h4 className="text-xs font-semibold text-slate-900 mt-0.5">
                              {ovr.case2.subject}
                            </h4>
                          </div>

                          <p className="rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-600 leading-relaxed border border-slate-100">
                            {ovr.case2.summary}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>Complainant: {ovr.case2.complainantType}</span>
                            <span>Filed: {ovr.case2.submissionDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Rule Matching Engine Breakdown */}
                      <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3">
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <span className="font-semibold text-slate-600 text-[11px]">
                            Rule Verification:
                          </span>

                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
                            <Check className="h-3 w-3" /> Same Institution
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium border ${ovr.ruleMatches.categoryMatch
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                          >
                            <Check className="h-3 w-3" /> Related Complaint Subject
                          </span>

                          <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 border border-indigo-200">
                            Keywords: {ovr.ruleMatches.keywordsMatched.join(', ')}
                          </span>

                          <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700 border border-purple-200">
                            Concurrent Active Timeframe
                          </span>
                        </div>

                        {/* Audit Details if already reviewed */}
                        {ovr.reviewedBy && (
                          <div className="mt-2 text-[11px] text-slate-500 flex flex-wrap items-center gap-2 border-t border-slate-200/60 pt-2">
                            <span className="font-semibold text-slate-700">Reviewed by:</span>
                            <span>{ovr.reviewedBy}</span>
                            <span>•</span>
                            <span>{ovr.reviewedAt}</span>
                            {ovr.reviewNotes && (
                              <span className="italic text-slate-600">
                                &ldquo;{ovr.reviewNotes}&rdquo;
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Reviewer Action Buttons */}
                      <div className="border-t border-slate-200 bg-white px-5 py-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <span className="text-xs text-slate-500 font-medium">
                            Administrative Action & Classification:
                          </span>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* Action 1: Confirmed Related */}
                            <button
                              onClick={() =>
                                openConfirmDialog(
                                  ovr.id,
                                  ovr.alertNumber,
                                  ovr.institutionName,
                                  'Confirmed Related'
                                )
                              }
                              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${ovr.reviewStatus === 'Confirmed Related'
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                  : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                                }`}
                            >
                              Confirmed Related
                            </button>

                            {/* Action 2: Confirmed Duplicate */}
                            <button
                              onClick={() =>
                                openConfirmDialog(
                                  ovr.id,
                                  ovr.alertNumber,
                                  ovr.institutionName,
                                  'Confirmed Duplicate'
                                )
                              }
                              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${ovr.reviewStatus === 'Confirmed Duplicate'
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                                  : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
                                }`}
                            >
                              Confirmed Duplicate
                            </button>

                            {/* Action 3: Separate Matters */}
                            <button
                              onClick={() =>
                                openConfirmDialog(
                                  ovr.id,
                                  ovr.alertNumber,
                                  ovr.institutionName,
                                  'Separate Matters'
                                )
                              }
                              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${ovr.reviewStatus === 'Separate Matters'
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                  : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                                }`}
                            >
                              Separate Matters
                            </button>

                            {/* Action 4: Further Investigation */}
                            <button
                              onClick={() =>
                                openConfirmDialog(
                                  ovr.id,
                                  ovr.alertNumber,
                                  ovr.institutionName,
                                  'Requires Further Investigation'
                                )
                              }
                              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${ovr.reviewStatus === 'Requires Further Investigation'
                                  ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                                  : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50'
                                }`}
                            >
                              Requires Investigation
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>

            {/* Explanatory Policy Card */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs"
            >
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                AICTE Anti-Duplication & Multi-Bureau Governance Protocol
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cases concerning the same technical institution are not automatically classified as duplicates. Multiple distinct complaints (e.g. faculty wage grievance under PGRC alongside infrastructure inadequacy under Regulation Bureau) must maintain distinct hearing files. Flagging an alert as &ldquo;Confirmed Related&rdquo; triggers synchronous status updates between PGRC and Regulation Bureau officers without modifying individual statutory disposal procedures.
              </p>
            </motion.div>
          </motion.div>
        </main>
      </div>

      {/* Confirmation Dialog Modal */}
      <AnimatePresence>
        {pendingAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setPendingAction(null)}
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Confirm Administrative Classification
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {pendingAction.alertNumber} • {pendingAction.institutionName}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setPendingAction(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Proposed Classification Badge */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Proposed Decision
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${getReviewStatusBadge(
                      pendingAction.status
                    )}`}
                  >
                    {pendingAction.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  {getActionExplanation(pendingAction.status)}
                </p>
              </div>

              {/* Reviewer Note Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Senior Management Directives / Internal Audit Note (Optional)
                </label>
                <textarea
                  rows={3}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="e.g. Approved joint coordination between PGRC Director and RB Dy Director. Hearing scheduled next week."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3">
                <button
                  onClick={() => setPendingAction(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReviewAction}
                  className="rounded-lg bg-purple-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-purple-800 transition"
                >
                  Confirm & Apply Classification
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
