'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import {
  Building2,
  Calendar,
  Download,
  Eye,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  SendHorizontal,
  BellRing,
  Filter,
  Search,
  ExternalLink,
  UserCheck,
  HelpCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { InstitutionSidebar } from '@/components/layout/InstitutionSidebar';
import { CaseDetailsModal } from '@/components/dashboard/CaseDetailsModal';
import { CaseItem, NoticeItem } from '@/types/dashboard';
import { useMounted, formatDate } from '@/lib/utils';
import { fetchComplaints } from '@/lib/complaints-api';
import { useInstitution } from '@/lib/institution-context';

function InstitutionOverviewPageContent() {
  const { activeCode, activeInstitution } = useInstitution();
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [allComplaints, setAllComplaints] = useState<CaseItem[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'under_process' | 'disposed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const mounted = useMounted();

  const loadData = async () => {
    try {
      setLoading(true);
      const [casesRes, noticesRes, responsesRes] = await Promise.all([
        fetchComplaints(),
        fetch(`/api/notices?institutionCode=${encodeURIComponent(activeCode)}`).then((r) => r.json()),
        fetch(`/api/institution/responses?institutionCode=${encodeURIComponent(activeCode)}`).then((r) => r.json()),
      ]);

      setAllComplaints(casesRes);
      if (noticesRes.success) {
        setNotices(noticesRes.notices || []);
      }
      if (responsesRes.success) {
        setResponses(responsesRes.responses || []);
      }
    } catch (e) {
      console.error('Failed to load institution overview data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [activeCode]);

  // Filter complaints strictly for active institution
  const institutionComplaints = useMemo(() => {
    return allComplaints.filter(
      (c) =>
        c.institutionCode === activeCode ||
        c.institutionName.toLowerCase() === activeInstitution.name.toLowerCase()
    );
  }, [allComplaints, activeCode, activeInstitution.name]);

  // Filter notices for active institution
  const institutionNotices = useMemo(() => {
    return notices.filter(
      (n) =>
        n.institutionCode === activeCode ||
        n.institutionName.toLowerCase() === activeInstitution.name.toLowerCase()
    );
  }, [notices, activeCode, activeInstitution.name]);

  // Metrics
  const metrics = useMemo(() => {
    const total = institutionComplaints.length;
    const pending = institutionComplaints.filter((c) => c.status === 'Pending').length;
    const underProcess = institutionComplaints.filter((c) => c.status === 'Under Process').length;
    const disposed = institutionComplaints.filter((c) => c.status === 'Disposed').length;
    const overdue = institutionComplaints.filter((c) => c.status === 'Overdue').length;
    const actionRequiredNotices = institutionNotices.filter((n) => n.status !== 'Complied' && n.status !== 'Closed').length;

    return { total, pending, underProcess, disposed, overdue, actionRequiredNotices };
  }, [institutionComplaints, institutionNotices]);

  // Deadlines calculation
  const upcomingDeadlines = useMemo(() => {
    if (!mounted) return [];
    const items: {
      id: string;
      title: string;
      caseNumber: string;
      dueDate: string;
      daysRemaining: number;
      type: 'notice' | 'case';
      severity: 'urgent' | 'warning' | 'normal';
    }[] = [];

    const today = new Date();

    institutionNotices.forEach((n) => {
      if (n.responseDeadline && n.status !== 'Complied' && n.status !== 'Closed') {
        const due = new Date(n.responseDeadline);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        items.push({
          id: n.id,
          title: `${n.noticeType}: ${n.reason}`,
          caseNumber: n.caseNumber,
          dueDate: n.responseDeadline,
          daysRemaining: diffDays,
          type: 'notice',
          severity: diffDays <= 3 ? 'urgent' : diffDays <= 7 ? 'warning' : 'normal',
        });
      }
    });

    institutionComplaints.forEach((c) => {
      if (c.expectedDisposalDate && c.status !== 'Disposed') {
        const due = new Date(c.expectedDisposalDate);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 14) {
          items.push({
            id: c.id,
            title: c.subject,
            caseNumber: c.caseNumber,
            dueDate: c.expectedDisposalDate,
            daysRemaining: diffDays,
            type: 'case',
            severity: diffDays <= 3 ? 'urgent' : diffDays <= 7 ? 'warning' : 'normal',
          });
        }
      }
    });

    return items.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [institutionNotices, institutionComplaints]);

  // Filtered complaints for table
  const displayedComplaints = useMemo(() => {
    return institutionComplaints.filter((c) => {
      if (filterType === 'pending' && c.status !== 'Pending') return false;
      if (filterType === 'under_process' && c.status !== 'Under Process') return false;
      if (filterType === 'disposed' && c.status !== 'Disposed') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.caseNumber.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.bureau.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [institutionComplaints, filterType, searchQuery]);

  const formattedDate = mounted
    ? new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Monday, 26 October 2026';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Institution Sidebar */}
      <InstitutionSidebar
        activeTab="overview"
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        badgeCounts={{
          notices: metrics.actionRequiredNotices,
          cases: metrics.total,
          compliance: responses.length,
        }}
      />

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md transition-all sm:px-6">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              onClick={() => setIsSidebarOpenMobile(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
              aria-label="Toggle navigation menu"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-900">CaseConnect</span>
              <span className="text-slate-400">/</span>
              <span>Institution Portal</span>
              <span className="text-slate-400">/</span>
              <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {activeInstitution.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/institution-dashboard/compliance"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
            >
              <SendHorizontal className="h-3.5 w-3.5" />
              <span>Submit Compliance Reply</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Switch Role
            </Link>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Welcome Identity Banner */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-to-r from-[#002b5c] via-[#083b70] to-[#0f4c81] p-6 text-white shadow-lg border border-blue-900/40 relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-10 pointer-events-none">
              <Building2 className="w-64 h-64 text-white" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-400/30">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    AICTE Approved Technical Campus
                  </span>
                  <span className="text-white/40">•</span>
                  <span className="font-mono text-xs text-blue-200">
                    Permanent AICTE ID: {activeInstitution.code}
                  </span>
                  <span className="text-white/40">•</span>
                  <span className="text-xs text-white/80">{formattedDate}</span>
                </div>

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
                  {activeInstitution.name}
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
                  {activeInstitution.address} • {activeInstitution.region} Region • {activeInstitution.type}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 sm:self-start md:self-auto">
                <Link
                  href="/institution-dashboard/profile"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 text-xs font-semibold text-white transition-all backdrop-blur-xs"
                >
                  <UserCheck className="h-3.5 w-3.5 text-emerald-300" />
                  <span>Nodal Officer Info</span>
                </Link>
                <Link
                  href="/institution-dashboard/compliance"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-md transition-all"
                >
                  <SendHorizontal className="h-3.5 w-3.5" />
                  <span>Submit Rebuttal</span>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* KPI Summary Cards */}
          <section aria-label="Summary KPIs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {/* Total Inward */}
              <div className="group rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border bg-blue-50 border-blue-100">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Docket</span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-slate-900">{metrics.total}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Total Inward Grievances</div>
                </div>
              </div>

              {/* Pending Action */}
              <div className="group rounded-xl border border-amber-200 bg-amber-50/30 p-4 shadow-xs hover:border-amber-400 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border bg-amber-100 border-amber-200">
                    <Clock className="h-4 w-4 text-amber-700" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Action Needed</span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-amber-700">{metrics.pending}</div>
                  <div className="text-xs text-amber-900 mt-0.5">Pending Reply / Awaiting</div>
                </div>
              </div>

              {/* Under Process */}
              <div className="group rounded-xl border border-blue-200 bg-blue-50/30 p-4 shadow-xs hover:border-blue-400 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border bg-blue-100 border-blue-200">
                    <Building2 className="h-4 w-4 text-blue-700" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Under Review</span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-blue-800">{metrics.underProcess}</div>
                  <div className="text-xs text-blue-900 mt-0.5">Committee Scrutiny</div>
                </div>
              </div>

              {/* Disposed */}
              <div className="group rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 shadow-xs hover:border-emerald-400 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border bg-emerald-100 border-emerald-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Resolved</span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-emerald-700">{metrics.disposed}</div>
                  <div className="text-xs text-emerald-900 mt-0.5">Disposed / Satisfied</div>
                </div>
              </div>

              {/* Overdue Warnings */}
              <div className="group rounded-xl border border-rose-200 bg-rose-50/30 p-4 shadow-xs hover:border-rose-400 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border bg-rose-100 border-rose-200">
                    <AlertTriangle className="h-4 w-4 text-rose-700" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Critical</span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-rose-700">{metrics.overdue}</div>
                  <div className="text-xs text-rose-900 mt-0.5">Overdue Action</div>
                </div>
              </div>
            </div>
          </section>

          {/* Two-Column Layout: Left (Directives & Deadlines), Right (Quick Action Strip) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Active Regulatory Directives & Notices */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BellRing className="h-5 w-5 text-amber-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Statutory Directives & Formal Notices
                  </h2>
                </div>
                <Link
                  href="/institution-dashboard/notices"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>View All ({institutionNotices.length})</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {institutionNotices.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No active regulatory notices</p>
                  <p className="text-xs text-slate-400 mt-1">
                    There are no pending directives or show-cause notices for {activeInstitution.name}.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {institutionNotices.slice(0, 3).map((notice) => (
                    <div
                      key={notice.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {notice.noticeNumber}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              notice.noticeType.includes('Show Cause') || notice.noticeType.includes('Hearing')
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {notice.noticeType}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Case: {notice.caseNumber}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-800">
                          {notice.reason}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                          <span>Issued by: {notice.issuedBy}</span>
                          <span>•</span>
                          <span>
                            Deadline:{' '}
                            <strong className="text-slate-700">
                              {formatDate(notice.responseDeadline)}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                        <Link
                          href={`/institution-dashboard/cases/${notice.caseId || notice.caseNumber}`}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Case</span>
                        </Link>
                        <Link
                          href="/institution-dashboard/compliance"
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                        >
                          <SendHorizontal className="h-3.5 w-3.5" />
                          <span>Reply</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right 1 Col: Upcoming Response Deadlines Widget */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-rose-600" />
                  <h2 className="text-base font-bold text-slate-900">Upcoming Deadlines</h2>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {upcomingDeadlines.length} Due Soon
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                {upcomingDeadlines.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">
                    No urgent response deadlines pending.
                  </p>
                ) : (
                  upcomingDeadlines.slice(0, 4).map((d) => (
                    <div
                      key={d.id}
                      className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                        d.severity === 'urgent'
                          ? 'border-rose-200 bg-rose-50/40'
                          : d.severity === 'warning'
                          ? 'border-amber-200 bg-amber-50/40'
                          : 'border-slate-200 bg-slate-50/40'
                      }`}
                    >
                      <div className="space-y-0.5 overflow-hidden">
                        <div className="font-mono text-[10px] text-slate-500">{d.caseNumber}</div>
                        <div className="font-semibold text-slate-800 truncate" title={d.title}>
                          {d.title}
                        </div>
                        <div className="text-[10px] text-slate-500">Due: {formatDate(d.dueDate)}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.severity === 'urgent'
                              ? 'bg-rose-600 text-white'
                              : d.severity === 'warning'
                              ? 'bg-amber-600 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {d.daysRemaining <= 0
                            ? 'Overdue'
                            : `${d.daysRemaining}d left`}
                        </span>
                      </div>
                    </div>
                  ))
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>AICTE Statutory Norm: 14 Days</span>
                  <Link
                    href="/institution-dashboard/compliance"
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    Compliance Rules →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Inward Complaints Table */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Inward Complaints Docket</h2>
                <p className="text-xs text-slate-500">
                  Active matters forwarded by AICTE Public Grievance Redressal Cell & Regulation Bureau
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search docket..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      filterType === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({institutionComplaints.length})
                  </button>
                  <button
                    onClick={() => setFilterType('pending')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      filterType === 'pending'
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pending ({metrics.pending})
                  </button>
                  <button
                    onClick={() => setFilterType('under_process')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      filterType === 'under_process'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    In Review ({metrics.underProcess})
                  </button>
                  <button
                    onClick={() => setFilterType('disposed')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      filterType === 'disposed'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Disposed ({metrics.disposed})
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-4">Case Number</th>
                      <th className="py-3 px-4">Forwarded By</th>
                      <th className="py-3 px-4">Subject & Grievance Category</th>
                      <th className="py-3 px-4">Received On</th>
                      <th className="py-3 px-4">Expected Reply</th>
                      <th className="py-3 px-4">AICTE Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedComplaints.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          No grievances found matching the selected filter for {activeInstitution.name}.
                        </td>
                      </tr>
                    ) : (
                      displayedComplaints.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {item.caseNumber}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.bureau === 'PGRC'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.bureau}
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-semibold text-slate-800 truncate" title={item.subject}>
                              {item.subject}
                            </div>
                            <div className="text-[11px] text-slate-400">{item.category}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                            {formatDate(item.submissionDate)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-medium text-slate-700">
                              {formatDate(item.expectedDisposalDate)}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.status === 'Disposed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.status === 'Pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : item.status === 'Overdue'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                            <button
                              onClick={() => setSelectedCase(item)}
                              className="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md font-medium text-[11px] inline-flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Quick View</span>
                            </button>
                            <Link
                              href={`/institution-dashboard/cases/${item.id}`}
                              className="px-2.5 py-1 bg-[#002b5c] text-white hover:bg-[#001f3f] rounded-md font-medium text-[11px] inline-flex items-center gap-1"
                            >
                              <span>Dossier</span>
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
          </section>
        </main>
      </div>

      {/* Case Details Modal */}
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

export default function InstitutionOverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#002b5c] border-t-transparent" />
        </div>
      }
    >
      <InstitutionOverviewPageContent />
    </Suspense>
  );
}
