'use client';

import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Download,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Users,
  Search,
  Link2,
  Clock,
  AlertTriangle,
  CopyCheck,
  Activity,
  ArrowRight,
  FolderKanban,
  ChevronLeft,
  ChevronRight,
  X,
  Scale,
} from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { PgrcSidebar } from '@/components/layout/PgrcSidebar';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { StatusDonutChart } from '@/components/charts/StatusDonutChart';
import { CaseDetailsModal } from '@/components/dashboard/CaseDetailsModal';
import { RECENT_ACTIVITIES } from '@/data/mockData';
import { CaseItem, OverlapAlertItem, OverlapReviewStatus } from '@/types/dashboard';
import { useMounted, formatDate, formatIndianNumber } from '@/lib/utils';
import { fetchComplaints } from '@/lib/complaints-api';

interface ComparisonData {
  pgrcCase: CaseItem;
  rbCase: CaseItem | null;
  similarityScore?: number;
  reason?: string;
  alertId?: string;
}

function PGRCDashboardContent() {
  const shouldReduceMotion = useReducedMotion();
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | CaseItem['status']>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | string>('ALL');
  const [overlapFilter, setOverlapFilter] = useState<'ALL' | 'OVERLAP' | 'NO_OVERLAP'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination for Case Table (prevents excessive vertical stretching)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Data states
  const [allCases, setAllCases] = useState<CaseItem[]>([]);
  const [overlapAlerts, setOverlapAlerts] = useState<OverlapAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Interactive Modals for Overlap Actions
  const [comparisonModalData, setComparisonModalData] = useState<ComparisonData | null>(null);
  const [reviewOutcomeModal, setReviewOutcomeModal] = useState<{
    alertId?: string;
    pgrcCase: CaseItem;
    rbCase: CaseItem | null;
    defaultStatus: OverlapReviewStatus;
  } | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAllActivitiesModal, setShowAllActivitiesModal] = useState(false);

  const mounted = useMounted();

  const loadCases = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      setError(null);
      const [casesData, ovrRes] = await Promise.all([
        fetchComplaints(),
        fetch('/api/overlaps', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ overlaps: [] })),
      ]);

      setAllCases(casesData);
      if (Array.isArray(ovrRes?.overlaps)) {
        setOverlapAlerts(ovrRes.overlaps);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
      if (showRefresh) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCases(false);
    pollingRef.current = setInterval(() => {
      loadCases(false);
    }, 10000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const formattedDate = mounted
    ? new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Monday, 26 October 2026';

  const pgrcCases = useMemo(() => {
    return allCases.filter((c) => c.bureau === 'PGRC');
  }, [allCases]);

  const rbCases = useMemo(() => {
    return allCases.filter((c) => c.bureau === 'Regulation Bureau');
  }, [allCases]);

  // Derived metrics for 6 horizontal KPI cards
  const pgrcKpis = useMemo(() => {
    const total = pgrcCases.length;
    const pending = pgrcCases.filter((c) => c.status === 'Pending').length;
    const underProcess = pgrcCases.filter((c) => c.status === 'Under Process').length;
    const disposed = pgrcCases.filter((c) => c.status === 'Disposed').length;
    const overdue = pgrcCases.filter((c) => c.status === 'Overdue').length;
    const openOverlap = pgrcCases.filter((c) => c.hasOverlapAlert).length;

    return [
      {
        id: 'pgrc-total',
        title: 'Total PGRC Cases',
        value: total,
        changePercent: undefined,
        changeType: 'neutral' as const,
        subtext: 'Assigned to PGRC cell',
        iconName: 'FolderKanban',
        accentColor: 'blue',
      },
      {
        id: 'pgrc-pending',
        title: 'Pending Grievances',
        value: pending,
        changePercent: undefined,
        changeType: 'neutral' as const,
        subtext: 'Awaiting initial action',
        iconName: 'Clock',
        accentColor: 'amber',
      },
      {
        id: 'pgrc-under-process',
        title: 'Under Process',
        value: underProcess,
        changePercent: undefined,
        changeType: 'neutral' as const,
        subtext: 'Active committee review',
        iconName: 'Activity',
        accentColor: 'indigo',
      },
      {
        id: 'pgrc-disposed',
        title: 'Cases Disposed',
        value: disposed,
        changePercent: undefined,
        changeType: 'positive' as const,
        subtext: 'Resolved & closed',
        iconName: 'CheckCircle2',
        accentColor: 'emerald',
      },
      {
        id: 'pgrc-overdue',
        title: 'Overdue Cases',
        value: overdue,
        changePercent: undefined,
        changeType: 'negative' as const,
        subtext: 'Exceeded statutory SLA',
        iconName: 'AlertTriangle',
        accentColor: 'rose',
        badgeText: overdue > 0 ? `${overdue} Urgent` : undefined,
      },
      {
        id: 'pgrc-overlap',
        title: 'Open Overlap Alerts',
        value: openOverlap,
        changePercent: undefined,
        changeType: 'neutral' as const,
        subtext: 'Cross-bureau matches',
        iconName: 'CopyCheck',
        accentColor: 'purple',
        badgeText: openOverlap > 0 ? 'Review' : undefined,
      },
    ];
  }, [pgrcCases]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    pgrcCases.forEach((c) => set.add(c.category));
    return Array.from(set).sort();
  }, [pgrcCases]);

  // Overlap items
  const overlapItems = useMemo(() => {
    return pgrcCases
      .filter((c) => c.hasOverlapAlert && c.overlapDetails)
      .map((c) => {
        const rbCase = allCases.find((rb) => rb.caseNumber === c.overlapDetails?.overlapCaseId) || null;
        const matchingAlert = overlapAlerts.find(
          (a) => a.case1.caseNumber === c.caseNumber || a.case2.caseNumber === c.caseNumber
        );
        return {
          pgrcCase: c,
          rbCase,
          alertId: matchingAlert?.id,
          similarityScore: matchingAlert?.similarityScore || c.overlapDetails?.matchScore || 88,
          reason: matchingAlert?.matchingReasons?.[0] || c.overlapDetails?.reason || 'Cross-bureau overlap detected',
          reviewStatus: matchingAlert?.reviewStatus || c.overlapDetails?.reviewStatus || 'Awaiting Review',
        };
      });
  }, [pgrcCases, allCases, overlapAlerts]);

  // Related RB cases from institutions with PGRC grievances
  const relatedRbByInstitution = useMemo(() => {
    const pgrcInsts = new Set(pgrcCases.map((c) => c.institutionCode));
    return rbCases.filter((rb) => pgrcInsts.has(rb.institutionCode));
  }, [pgrcCases, rbCases]);

  // PGRC Activity stream (complete history and preview)
  const allPgrcActivities = useMemo(() => {
    const pgrcCaseIds = new Set(pgrcCases.map((c) => c.caseNumber));
    return RECENT_ACTIVITIES.filter((a) => pgrcCaseIds.has(a.caseId));
  }, [pgrcCases]);

  const pgrcActivities = useMemo(() => {
    return allPgrcActivities.slice(0, 3);
  }, [allPgrcActivities]);

  // Deadlines and follow-ups (sorted by urgency, top 3 for compact view)
  const urgentDeadlines = useMemo(() => {
    if (!mounted) return [];
    const active = pgrcCases.filter((c) => c.status !== 'Disposed' && c.expectedDisposalDate);
    const today = new Date();

    const mapped = active.map((c) => {
      const due = new Date(c.expectedDisposalDate);
      const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...c,
        daysRemaining: diffDays,
        isOverdue: diffDays < 0 || c.status === 'Overdue',
      };
    });

    // Sort: Overdue items first, then nearest due date
    mapped.sort((a, b) => a.daysRemaining - b.daysRemaining);
    return mapped.slice(0, 3);
  }, [pgrcCases]);

  // Filtered case table
  const filteredTableCases = useMemo(() => {
    return pgrcCases.filter((c) => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;
      if (overlapFilter === 'OVERLAP' && !c.hasOverlapAlert) return false;
      if (overlapFilter === 'NO_OVERLAP' && c.hasOverlapAlert) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          c.caseNumber.toLowerCase().includes(q) ||
          c.institutionName.toLowerCase().includes(q) ||
          c.institutionCode.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.assignedOfficer.toLowerCase().includes(q) ||
          c.status.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (dateFrom) {
        if (new Date(c.submissionDate) < new Date(dateFrom)) return false;
      }
      if (dateTo) {
        if (new Date(c.submissionDate) > new Date(dateTo)) return false;
      }

      return true;
    });
  }, [pgrcCases, statusFilter, categoryFilter, overlapFilter, searchQuery, dateFrom, dateTo]);

  // Paginated table items
  const totalPages = Math.max(1, Math.ceil(filteredTableCases.length / pageSize));
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTableCases.slice(start, start + pageSize);
  }, [filteredTableCases, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, categoryFilter, overlapFilter, searchQuery, dateFrom, dateTo]);

  const handleRefresh = () => {
    loadCases(true);
  };

  const handleExport = () => {
    const headers = [
      'Source Case ID',
      'Institution Name',
      'AICTE Permanent ID',
      'Complaint Category',
      'Date Received',
      'Current Status',
      'Assigned Officer',
      'Last Action',
      'Next Action',
      'Expected Disposal Date',
      'Overlap Indicator',
    ];
    const rows = filteredTableCases.map((c) => [
      c.caseNumber,
      c.institutionName,
      c.institutionCode,
      c.category,
      c.submissionDate,
      c.status,
      c.assignedOfficer,
      c.lastUpdated,
      c.status === 'Overdue' ? 'Follow-up/Escalation' : c.status === 'Pending' ? 'Review & Assign/Act' : 'Review progress',
      c.expectedDisposalDate,
      c.hasOverlapAlert ? 'Yes' : 'No',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pgrc-dashboard-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSelectCaseById = (caseId: string) => {
    const found = allCases.find((c) => c.id === caseId || c.caseNumber === caseId);
    if (found) {
      setSelectedCase(found);
    }
  };

  const handleViewRelatedCase = (relatedCaseNumber: string) => {
    const found = allCases.find((c) => c.caseNumber === relatedCaseNumber);
    if (found) {
      setSelectedCase(found);
    }
  };

  // Record Overlap Review Outcome
  const handleSaveReviewOutcome = async (outcomeStatus: OverlapReviewStatus) => {
    if (!reviewOutcomeModal) return;
    try {
      setIsSubmittingReview(true);
      const alertId = reviewOutcomeModal.alertId;

      if (alertId) {
        await fetch('/api/overlaps', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: alertId,
            reviewStatus: outcomeStatus,
            reviewedBy: 'PGRC Scrutiny Officer',
            reviewNotes: reviewNote || `Recorded outcome from PGRC Overview: ${outcomeStatus}. Separate identities preserved.`,
          }),
        });
      }

      setToastMessage(`Review outcome recorded: ${outcomeStatus}. Cross-bureau audit trail updated.`);
      setReviewOutcomeModal(null);
      setReviewNote('');
      loadCases(false);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (e: any) {
      alert(e?.message || 'Failed to record review outcome');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const hasActiveFilters =
    statusFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    overlapFilter !== 'ALL' ||
    searchQuery.trim() !== '' ||
    dateFrom !== '' ||
    dateTo !== '';

  const clearAllFilters = () => {
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setOverlapFilter('ALL');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar Navigation */}
      <PgrcSidebar
        activeTab="overview"
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        badgeCounts={{
          cases: pgrcCases.length,
          overlaps: overlapItems.length,
        }}
      />

      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Top Navbar */}
        <Navbar
          onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
          isSidebarOpen={isSidebarOpenMobile}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectCase={handleSelectCaseById}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-5 lg:p-6 space-y-5 max-w-7xl mx-auto w-full">
          {/* Toast Notification */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{toastMessage}</span>
                </div>
                <button onClick={() => setToastMessage(null)} className="text-emerald-600 hover:text-emerald-800">
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Banner */}
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-800 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {loading && allCases.length === 0 && (
            <div className="py-1 text-center text-xs text-slate-400 animate-pulse">
              Syncing with AICTE central complaint database...
            </div>
          )}

          {/* Section B: Compact Page Introduction Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#002b5c]/10 px-2.5 py-0.5 text-xs font-semibold text-[#002b5c] border border-[#002b5c]/20">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#002b5c]" />
                  PGRC Official Dashboard
                </span>
                <span className="text-xs text-slate-400">•</span>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>{formattedDate}</span>
                </div>
              </div>
              <h1 className="font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">
                PGRC Grievance Oversight & Case Ledger
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                AICTE Public Grievance Redressal Cell • Real-time grievance tracking and cross-bureau coordination
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                title="Refresh complaints from SQLite"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#002b5c] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#001f3f] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                title="Export filtered grievances as CSV"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Dossier</span>
              </button>
            </div>
          </div>

          {/* Section C: KPI Summary Cards (Single Horizontal Row on Desktop) */}
          <section aria-label="PGRC KPI Summary Cards">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {pgrcKpis.map((kpi, index) => (
                <KpiCard
                  key={kpi.id}
                  metric={kpi}
                  index={index}
                  onClick={() => {
                    if (kpi.id === 'pgrc-pending') setStatusFilter('Pending');
                    else if (kpi.id === 'pgrc-under-process') setStatusFilter('Under Process');
                    else if (kpi.id === 'pgrc-disposed') setStatusFilter('Disposed');
                    else if (kpi.id === 'pgrc-overdue') setStatusFilter('Overdue');
                    else if (kpi.id === 'pgrc-overlap') setOverlapFilter('OVERLAP');
                    else clearAllFilters();
                  }}
                />
              ))}
            </div>
          </section>

          {/* Section D: Upper Analytical & Coordination Section (Directly Below KPI Cards) */}
          <section aria-label="Upper Analytical and Coordination Overview" className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Left: Cases by Disposal Status */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:col-span-5 xl:col-span-4 flex flex-col"
            >
              <StatusDonutChart />
            </motion.div>

            {/* Right: PGRC ↔ Regulation Bureau Coordination Stream */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="lg:col-span-7 xl:col-span-8 flex flex-col"
            >
              <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs p-4 sm:p-5 h-full flex flex-col justify-between space-y-3.5">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Scale className="h-4 w-4 text-amber-600" />
                        <h3 className="font-bold text-sm text-slate-900">
                          PGRC ↔ Regulation Bureau Coordination Stream
                        </h3>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Cross-bureau visibility across shared institutions without jurisdiction overlap
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-600">
                      SLA Guard Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3.5">
                    <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-2 w-2 rounded-full bg-blue-600" />
                        <span className="text-xs font-semibold text-blue-900">PGRC Active Cases</span>
                      </div>
                      <div className="text-2xl font-bold text-slate-900">{formatIndianNumber(pgrcCases.length)}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Primary redressal jurisdiction</div>
                    </div>

                    <div className="rounded-lg border border-amber-100 bg-amber-50/40 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-2 w-2 rounded-full bg-amber-600" />
                        <span className="text-xs font-semibold text-amber-900">Parallel RB Matters</span>
                      </div>
                      <div className="text-2xl font-bold text-slate-900">{formatIndianNumber(relatedRbByInstitution.length)}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Institutions with active PGRC cases</div>
                    </div>
                  </div>

                  <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200/70 text-xs text-slate-700 flex items-start gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-900">Preserved Identity & Independent Scrutiny</div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Cross-bureau matches notify both cells for synchronized enforcement. Neither bureau can alter,
                        auto-merge, or close out the other bureau&apos;s source case records.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 text-[11px]">Cross-bureau workspaces:</span>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/pgrc-dashboard/related-rb-cases"
                      className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
                    >
                      <Link2 className="h-3 w-3" />
                      <span>Related RB Cases</span>
                    </Link>
                    <Link
                      href="/pgrc-dashboard/coordination"
                      className="px-2.5 py-1.5 rounded-md bg-[#002b5c] hover:bg-[#001f3f] text-white font-semibold text-[11px] inline-flex items-center gap-1 transition-colors shadow-2xs"
                    >
                      <Users className="h-3 w-3" />
                      <span>Coordination Desk</span>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Section E: Primary Operational Area (Balanced 68% / 32% Two-Column Layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left Column: PGRC Active Grievances Table (~68% width) */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:col-span-8 space-y-3"
            >
              <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
                {/* Table Header & Interactive Filter Bar */}
                <div className="border-b border-slate-100 p-3.5 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <FolderKanban className="h-4 w-4 text-blue-600" />
                        <h2 className="font-bold text-sm text-slate-900">
                          PGRC Active Grievances Docket
                        </h2>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {filteredTableCases.length} {filteredTableCases.length === 1 ? 'case' : 'cases'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Statutory grievance records assigned to PGRC officers
                      </p>
                    </div>

                    {/* Quick Status Filter Tabs */}
                    <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60 text-xs">
                      {(['ALL', 'Pending', 'Under Process', 'Disposed', 'Overdue'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setStatusFilter(st)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                            statusFilter === st
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {st === 'ALL' ? 'All' : st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Secondary Filter Row: Search, Category, Overlap, Clear */}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by case ID, institution, officer, category..."
                        className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      aria-label="Filter by category"
                    >
                      <option value="ALL">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>

                    <select
                      value={overlapFilter}
                      onChange={(e) => setOverlapFilter(e.target.value as 'ALL' | 'OVERLAP' | 'NO_OVERLAP')}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      aria-label="Filter by overlap status"
                    >
                      <option value="ALL">All Cases</option>
                      <option value="OVERLAP">With RB Overlap</option>
                      <option value="NO_OVERLAP">No Overlap</option>
                    </select>

                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <X className="h-3 w-3 text-slate-400" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Table Data Grid */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse min-w-[860px]">
                    <thead className="bg-slate-50/90 text-slate-600 border-b border-slate-200/80 uppercase text-[10px] tracking-wider font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Source Case ID</th>
                        <th className="py-2.5 px-3">Institution & Campus ID</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Received / Due</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Assigned Officer</th>
                        <th className="py-2.5 px-3 text-center">RB Overlap</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedCases.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-10 text-center text-slate-500">
                            <FolderKanban className="mx-auto h-7 w-7 text-slate-300 mb-1.5" />
                            <div className="font-semibold text-slate-700 text-xs">No PGRC cases match the criteria</div>
                            <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your search keywords or active filters.</p>
                            {hasActiveFilters && (
                              <button
                                onClick={clearAllFilters}
                                className="mt-2.5 px-3 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                              >
                                Reset All Filters
                              </button>
                            )}
                          </td>
                        </tr>
                      ) : (
                        paginatedCases.map((c) => {
                          const isOverdue = c.status === 'Overdue';
                          return (
                            <tr
                              key={c.id}
                              onClick={() => setSelectedCase(c)}
                              className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                            >
                              {/* Source Case ID */}
                              <td className="py-2 px-3 whitespace-nowrap">
                                <span className="font-mono font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                                  {c.caseNumber}
                                </span>
                              </td>

                              {/* Institution Name & Location */}
                              <td className="py-2 px-3 max-w-[220px]">
                                <div className="font-semibold text-slate-900 truncate" title={c.institutionName}>
                                  {c.institutionName}
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                  <span className="truncate">{c.location}</span>
                                  <span>•</span>
                                  <span className="font-mono text-slate-400">{c.institutionCode}</span>
                                </div>
                              </td>

                              {/* Complaint Category */}
                              <td className="py-2 px-3 whitespace-nowrap">
                                <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                                  {c.category}
                                </span>
                              </td>

                              {/* Date Received & Expected Disposal */}
                              <td className="py-2 px-3 whitespace-nowrap">
                                <div className="text-slate-700 text-[11px]">{formatDate(c.submissionDate)}</div>
                                <div className={`text-[10px] font-medium mt-0.5 ${isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
                                  Due: {formatDate(c.expectedDisposalDate)}
                                </div>
                              </td>

                              {/* Current Status */}
                              <td className="py-2 px-3 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    c.status === 'Overdue'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : c.status === 'Under Process'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : c.status === 'Pending'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}
                                >
                                  {c.status}
                                </span>
                              </td>

                              {/* Assigned Officer */}
                              <td className="py-2 px-3 max-w-[150px] truncate" title={c.assignedOfficer}>
                                <span className="text-slate-700 text-[11px]">{c.assignedOfficer}</span>
                              </td>

                              {/* Overlap Indicator */}
                              <td className="py-2 px-3 text-center whitespace-nowrap">
                                {c.hasOverlapAlert ? (
                                  <span
                                    className="inline-flex items-center gap-1 rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200"
                                    title={`Overlap with ${c.overlapDetails?.overlapCaseId || 'RB Docket'}`}
                                  >
                                    <CopyCheck className="h-3 w-3 text-purple-600" />
                                    <span>RB Match</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-300 font-mono text-[10px]">—</span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-2 px-3 text-right whitespace-nowrap space-x-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => setSelectedCase(c)}
                                  className="px-2 py-0.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-semibold transition-colors"
                                  title="Quick View"
                                >
                                  Inspect
                                </button>
                                <Link
                                  href={`/pgrc-dashboard/cases`}
                                  className="px-2 py-0.5 text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded text-[11px] font-semibold transition-colors inline-block"
                                  title="Open in PGRC Cases"
                                >
                                  Docket →
                                </Link>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Compact Pagination Bar */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-xs text-slate-500 bg-slate-50/50">
                    <div>
                      Showing{' '}
                      <span className="font-semibold text-slate-800">
                        {Math.min(filteredTableCases.length, (currentPage - 1) * pageSize + 1)}
                      </span>{' '}
                      to{' '}
                      <span className="font-semibold text-slate-800">
                        {Math.min(filteredTableCases.length, currentPage * pageSize)}
                      </span>{' '}
                      of <span className="font-semibold text-slate-800">{filteredTableCases.length}</span> cases
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Previous Page"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-2 font-medium text-slate-700 text-xs">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Next Page"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Right Column: Compact Operational Panels (~32% width) */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="lg:col-span-4 space-y-3"
            >
              {/* Panel 1: Overlap Review Queue */}
              <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-50 border border-purple-100 text-purple-700">
                      <CopyCheck className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-900">Overlap Review Queue</h3>
                      <p className="text-[10px] text-slate-500">PGRC ↔ Regulation Bureau Matches</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                    {overlapItems.length} Active
                  </span>
                </div>

                <div className="p-3 space-y-2">
                  {overlapItems.length === 0 ? (
                    <div className="text-center py-4 text-slate-400 text-xs">
                      <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-500 mb-1" />
                      <p className="font-medium text-slate-700">No active cross-bureau overlaps</p>
                    </div>
                  ) : (
                    overlapItems.slice(0, 2).map(({ pgrcCase, rbCase, similarityScore, reason, alertId, reviewStatus }) => (
                      <div
                        key={pgrcCase.caseNumber}
                        className="rounded-lg border border-slate-200 bg-slate-50/40 p-2 text-xs space-y-1 hover:border-purple-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-900 text-[11px]">
                            {pgrcCase.caseNumber} <span className="text-purple-600">↔</span> {rbCase?.caseNumber || pgrcCase.overlapDetails?.overlapCaseId}
                          </span>
                          <span className="rounded bg-purple-100/80 text-purple-800 px-1.5 py-0.2 font-mono text-[10px] font-bold">
                            {similarityScore}% Match
                          </span>
                        </div>

                        <div className="text-[10px] font-medium text-slate-800 truncate" title={pgrcCase.institutionName}>
                          {pgrcCase.institutionName}
                        </div>

                        <p className="text-[10px] text-slate-600 line-clamp-1 leading-snug">
                          {reason}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                          <span className="text-slate-400">Status: <strong className="text-slate-700">{reviewStatus}</strong></span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setComparisonModalData({
                                  pgrcCase,
                                  rbCase,
                                  similarityScore,
                                  reason,
                                  alertId,
                                });
                              }}
                              className="text-purple-700 hover:text-purple-900 font-semibold hover:underline"
                            >
                              Compare
                            </button>
                            <span className="text-slate-300">•</span>
                            <button
                              onClick={() => {
                                setReviewOutcomeModal({
                                  alertId,
                                  pgrcCase,
                                  rbCase,
                                  defaultStatus: 'Confirmed Related',
                                });
                              }}
                              className="text-blue-700 hover:text-blue-900 font-semibold hover:underline"
                            >
                              Review
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  <Link
                    href="/pgrc-dashboard/overlaps"
                    className="w-full text-center py-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 flex items-center justify-center gap-1 border-t border-slate-100 pt-1.5"
                  >
                    <span>Open Full Overlap Review Queue ({overlapItems.length})</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Panel 2: Recent PGRC Activity */}
              <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 border border-blue-100 text-blue-700">
                      <Activity className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-900">Recent PGRC Activity</h3>
                      <p className="text-[10px] text-slate-500">Live operational audit stream</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                    Latest 3
                  </span>
                </div>

                <div className="p-3 space-y-1.5">
                  {pgrcActivities.length === 0 ? (
                    <div className="text-center py-3 text-slate-400 text-xs">No recent actions logged.</div>
                  ) : (
                    pgrcActivities.map((act) => (
                      <button
                        key={act.id}
                        onClick={() => handleSelectCaseById(act.caseId)}
                        className="w-full text-left rounded-lg border border-slate-100 bg-slate-50/30 p-2 hover:bg-slate-50 transition-colors block group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900 text-[11px] group-hover:text-blue-700 transition-colors truncate max-w-[190px]">
                            {act.title}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">{act.timestamp}</span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-0.5 line-clamp-1">{act.description}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 font-mono text-[9px] text-blue-700 font-bold">
                          <span>{act.caseId}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400 font-normal">Click to view case</span>
                        </div>
                      </button>
                    ))
                  )}

                  <button
                    onClick={() => setShowAllActivitiesModal(true)}
                    className="w-full text-center py-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 flex items-center justify-center gap-1 border-t border-slate-100 pt-1.5"
                  >
                    <span>View All Activities ({allPgrcActivities.length})</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Panel 3: Urgent Deadlines & SLAs */}
              <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-50 border border-rose-100 text-rose-700">
                      <Clock className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-900">Urgent Deadlines & SLAs</h3>
                      <p className="text-[10px] text-slate-500">Approaching disposal limits</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                    Action Required
                  </span>
                </div>

                <div className="p-3 space-y-1.5">
                  {urgentDeadlines.length === 0 ? (
                    <div className="text-center py-3 text-slate-400 text-xs">No imminent deadlines.</div>
                  ) : (
                    urgentDeadlines.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCase(c)}
                        className={`w-full text-left rounded-lg border p-2 transition-colors block ${
                          c.isOverdue
                            ? 'border-rose-200 bg-rose-50/40 hover:bg-rose-50/70'
                            : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-900 text-[11px]">{c.caseNumber}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              c.isOverdue ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {c.isOverdue ? 'Overdue' : `${c.daysRemaining}d left`}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-700 font-medium truncate mt-0.5" title={c.institutionName}>
                          {c.institutionName}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-0.5">
                          <span>Due: {formatDate(c.expectedDisposalDate)}</span>
                          <span className="font-semibold text-slate-700">{c.status}</span>
                        </div>
                      </button>
                    ))
                  )}

                  <button
                    onClick={() => setStatusFilter('Overdue')}
                    className="w-full text-center py-1 text-[11px] font-semibold text-rose-700 hover:text-rose-900 flex items-center justify-center gap-1 border-t border-slate-100 pt-1.5"
                  >
                    <span>Filter All Overdue Cases in Table →</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Case Details Modal */}
      <CaseDetailsModal
        selectedCase={selectedCase}
        onClose={() => setSelectedCase(null)}
        onViewRelatedCase={handleViewRelatedCase}
        onStatusUpdated={(updated) => {
          setAllCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          setSelectedCase(updated);
        }}
        allowStatusEdit={true}
      />

      {/* Overlap Side-by-Side Comparison Modal */}
      <AnimatePresence>
        {comparisonModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="flex items-center justify-between bg-slate-900 px-5 py-4 text-white">
                <div className="flex items-center gap-2">
                  <CopyCheck className="h-5 w-5 text-purple-400" />
                  <div>
                    <h3 className="font-bold text-sm">Cross-Bureau Case Comparison</h3>
                    <p className="text-[11px] text-slate-300">PGRC Grievance vs Regulation Bureau Docket</p>
                  </div>
                </div>
                <button
                  onClick={() => setComparisonModalData(null)}
                  className="rounded-lg p-1 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="flex items-center justify-between bg-purple-50 p-3 rounded-xl border border-purple-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-800 tracking-wider">
                      Overlap Classification
                    </span>
                    <div className="text-xs font-bold text-purple-950 mt-0.5">
                      {comparisonModalData.reason}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-purple-900">
                      {comparisonModalData.similarityScore}%
                    </span>
                    <div className="text-[10px] text-purple-700">Cosine Match</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* PGRC Case */}
                  <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-blue-600 text-white font-mono text-[10px] font-bold px-2 py-0.5">
                        PGRC Cell
                      </span>
                      <span className="text-xs font-bold text-slate-800">{comparisonModalData.pgrcCase.status}</span>
                    </div>
                    <div className="font-mono font-bold text-slate-900 text-sm">
                      {comparisonModalData.pgrcCase.caseNumber}
                    </div>
                    <div className="text-xs font-semibold text-slate-800">
                      {comparisonModalData.pgrcCase.subject}
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-3">
                      {comparisonModalData.pgrcCase.summary}
                    </p>
                    <div className="text-[10px] text-slate-500 pt-2 border-t border-blue-100">
                      <div>Category: {comparisonModalData.pgrcCase.category}</div>
                      <div>Officer: {comparisonModalData.pgrcCase.assignedOfficer}</div>
                    </div>
                  </div>

                  {/* RB Case */}
                  <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-amber-600 text-white font-mono text-[10px] font-bold px-2 py-0.5">
                        Regulation Bureau
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {comparisonModalData.rbCase?.status || 'Active Scrutiny'}
                      </span>
                    </div>
                    <div className="font-mono font-bold text-slate-900 text-sm">
                      {comparisonModalData.rbCase?.caseNumber || comparisonModalData.pgrcCase.overlapDetails?.overlapCaseId}
                    </div>
                    <div className="text-xs font-semibold text-slate-800">
                      {comparisonModalData.rbCase?.subject || 'Related Statutory Compliance Inquiry'}
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-3">
                      {comparisonModalData.rbCase?.summary || 'Pending official coordination document verification.'}
                    </p>
                    <div className="text-[10px] text-slate-500 pt-2 border-t border-amber-100">
                      <div>Category: {comparisonModalData.rbCase?.category || 'Regulatory Compliance'}</div>
                      <div>Officer: {comparisonModalData.rbCase?.assignedOfficer || 'Joint Director, RB'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-50 px-5 py-3 border-t border-slate-200">
                <div className="text-[11px] text-slate-500">
                  Separate identities preserved. No automated closing.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const data = comparisonModalData;
                      setComparisonModalData(null);
                      setReviewOutcomeModal({
                        alertId: data.alertId,
                        pgrcCase: data.pgrcCase,
                        rbCase: data.rbCase,
                        defaultStatus: 'Confirmed Related',
                      });
                    }}
                    className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-lg shadow-2xs"
                  >
                    Record Review Outcome
                  </button>
                  <button
                    onClick={() => setComparisonModalData(null)}
                    className="px-3.5 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Record Review Outcome Modal */}
      <AnimatePresence>
        {reviewOutcomeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Record Overlap Review Outcome</h3>
                  <p className="text-xs text-slate-500">
                    Case {reviewOutcomeModal.pgrcCase.caseNumber}
                  </p>
                </div>
                <button
                  onClick={() => setReviewOutcomeModal(null)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Determination:
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {(
                      [
                        { id: 'Confirmed Related', desc: 'Parallel issues confirmed across cells — coordinate action' },
                        { id: 'Confirmed Duplicate', desc: 'Duplicate filing — synchronise findings' },
                        { id: 'Dismissed', desc: 'Distinct matters — continue independent inquiry' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleSaveReviewOutcome(opt.id as OverlapReviewStatus)}
                        disabled={isSubmittingReview}
                        className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-xs transition-colors"
                      >
                        <div className="font-bold text-slate-900">{opt.id}</div>
                        <div className="text-[11px] text-slate-500">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Review Remarks / Action Notes (Optional):
                  </label>
                  <textarea
                    rows={3}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Enter coordination notes, joint hearing requirements, or rationale..."
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setReviewOutcomeModal(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* All Activities History Modal */}
      <AnimatePresence>
        {showAllActivitiesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="flex items-center justify-between bg-slate-900 px-5 py-4 text-white">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-400" />
                  <div>
                    <h3 className="font-bold text-sm">PGRC Activity Stream & Audit Log</h3>
                    <p className="text-[11px] text-slate-300">Complete historical grievance updates and notices</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAllActivitiesModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-5 space-y-2.5">
                {allPgrcActivities.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">No activity logs recorded.</div>
                ) : (
                  allPgrcActivities.map((act) => (
                    <div
                      key={act.id}
                      onClick={() => {
                        setShowAllActivitiesModal(false);
                        handleSelectCaseById(act.caseId);
                      }}
                      className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50/50 p-3 hover:bg-slate-100 hover:border-blue-300 transition-all block group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 text-xs group-hover:text-blue-700 transition-colors">
                          {act.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">{act.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{act.description}</p>
                      <div className="flex items-center gap-2 mt-1.5 font-mono text-[10px] text-blue-700 font-bold">
                        <span>Case #{act.caseId}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 font-normal group-hover:text-blue-600">Click to view full docket & record</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-between items-center px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
                <span>Showing {allPgrcActivities.length} operational log entries</span>
                <button
                  onClick={() => setShowAllActivitiesModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 bg-white"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PGRCDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#002b5c] border-t-transparent" />
        </div>
      }
    >
      <PGRCDashboardContent />
    </Suspense>
  );
}
