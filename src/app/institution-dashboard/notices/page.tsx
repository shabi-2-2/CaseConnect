'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import {
  BellRing,
  Search,
  Filter,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  SendHorizontal,
  Eye,
  FileText,
  ChevronRight,
  Info,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { InstitutionSidebar } from '@/components/layout/InstitutionSidebar';
import { NoticeItem, CaseItem } from '@/types/dashboard';
import { useInstitution } from '@/lib/institution-context';
import { formatDate } from '@/lib/utils';
import { fetchComplaints } from '@/lib/complaints-api';

function InstitutionNoticesPageContent() {
  const { activeCode, activeInstitution } = useInstitution();
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [complaints, setComplaints] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [noticeTypeFilter, setNoticeTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [noticesRes, complaintsRes] = await Promise.all([
        fetch(`/api/notices?institutionCode=${encodeURIComponent(activeCode)}`).then((r) => r.json()),
        fetchComplaints(),
      ]);

      if (noticesRes.success) {
        setNotices(noticesRes.notices || []);
      }
      setComplaints(complaintsRes);
    } catch (e) {
      console.error('Failed to load notices:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCode]);

  // Filter notices for this institution
  const institutionNotices = useMemo(() => {
    return notices.filter(
      (n) =>
        n.institutionCode === activeCode ||
        n.institutionName.toLowerCase() === activeInstitution.name.toLowerCase()
    );
  }, [notices, activeCode, activeInstitution.name]);

  // Available Notice Types
  const noticeTypes = useMemo(() => {
    const set = new Set<string>();
    institutionNotices.forEach((n) => set.add(n.noticeType));
    return Array.from(set);
  }, [institutionNotices]);

  // Filtered List
  const filteredNotices = useMemo(() => {
    return institutionNotices.filter((n) => {
      if (noticeTypeFilter !== 'all' && n.noticeType !== noticeTypeFilter) return false;
      if (statusFilter !== 'all' && n.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          n.noticeNumber.toLowerCase().includes(q) ||
          n.caseNumber.toLowerCase().includes(q) ||
          n.reason.toLowerCase().includes(q) ||
          n.noticeType.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [institutionNotices, noticeTypeFilter, statusFilter, searchQuery]);

  // Action required vs info only
  const actionRequiredCount = institutionNotices.filter(
    (n) => n.status !== 'Complied' && n.status !== 'Closed'
  ).length;

  const getDaysRemaining = (deadline: string) => {
    if (!deadline) return null;
    const today = new Date();
    const due = new Date(deadline);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <InstitutionSidebar
        activeTab="notices"
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        badgeCounts={{
          notices: actionRequiredCount,
        }}
      />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpenMobile(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Link href="/institution-dashboard" className="text-slate-500 hover:text-slate-800">
                Institution Portal
              </Link>
              <span className="text-slate-400">/</span>
              <span className="font-semibold text-slate-900">Grievance & Regulatory Notices</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/institution-dashboard/compliance"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
            >
              <SendHorizontal className="h-3.5 w-3.5" />
              <span>Submit Reply</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200 flex items-center gap-1">
                  <BellRing className="h-3.5 w-3.5 text-amber-600" />
                  Statutory Communications
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-slate-500 font-mono">
                  Campus ID: {activeInstitution.code}
                </span>
              </div>
              <h1 className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Official Grievance Notices & Directives
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl">
                Formal directives, show-cause notices, and grievance alerts issued to{' '}
                <strong className="text-slate-700">{activeInstitution.name}</strong> by AICTE
                councils and bureaus.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-2 text-right">
                <div className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">
                  Action Required
                </div>
                <div className="text-xl font-bold text-amber-900">{actionRequiredCount} Notices</div>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Notice Number, Case Number, or Subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <span>Type:</span>
                <select
                  value={noticeTypeFilter}
                  onChange={(e) => setNoticeTypeFilter(e.target.value)}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Notice Types</option>
                  {noticeTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="Issued">Issued / Pending Reply</option>
                  <option value="Complied">Complied</option>
                  <option value="Under Review">Under Review</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notices Grid / Cards */}
          <div className="space-y-3.5">
            {filteredNotices.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-3" />
                <h3 className="font-bold text-slate-800 text-sm">No notices match your criteria</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  {institutionNotices.length === 0
                    ? `No regulatory notices or show-cause summons have been issued to ${activeInstitution.name}.`
                    : 'Try clearing the filters or search query above.'}
                </p>
              </div>
            ) : (
              filteredNotices.map((notice) => {
                const days = getDaysRemaining(notice.responseDeadline);
                const isActionRequired = notice.status !== 'Complied' && notice.status !== 'Closed';

                return (
                  <motion.div
                    key={notice.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl border bg-white p-5 shadow-xs transition-all ${
                      isActionRequired
                        ? 'border-slate-200 hover:border-amber-400 hover:shadow-md'
                        : 'border-slate-200/80 opacity-90'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        {/* Tags and headers */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                            {notice.noticeNumber}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              notice.noticeType.includes('Show Cause') ||
                              notice.noticeType.includes('Hearing')
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : notice.noticeType.includes('Compliance')
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {notice.noticeType}
                          </span>

                          {isActionRequired ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
                              <AlertTriangle className="h-3 w-3 text-amber-600" />
                              Action Required
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Information / Complied
                            </span>
                          )}

                          <span className="text-xs text-slate-400 font-mono">
                            Case: {notice.caseNumber}
                          </span>
                        </div>

                        {/* Title / Reason */}
                        <h3 className="text-base font-bold text-slate-900">{notice.reason}</h3>

                        {/* Remarks / instructions */}
                        {notice.remarks && (
                          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700 border border-slate-200/70">
                            <span className="font-semibold text-slate-900">Directive Summary: </span>
                            {notice.remarks}
                          </div>
                        )}

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>Issued: {formatDate(notice.noticeDate)}</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <span>Issued By:</span>
                            <strong className="text-slate-700">{notice.issuedBy}</strong>
                          </div>
                          {notice.supportingDocs && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1 text-blue-700">
                                <FileText className="h-3.5 w-3.5" />
                                <span>Reference: {notice.supportingDocs}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right side: Countdown & Action buttons */}
                      <div className="flex lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        {notice.responseDeadline && (
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400 font-medium">Response Deadline</div>
                            <div className="font-bold text-xs text-slate-800">
                              {formatDate(notice.responseDeadline)}
                            </div>
                            {days !== null && isActionRequired && (
                              <div className="mt-1">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                    days <= 3
                                      ? 'bg-rose-600 text-white animate-pulse'
                                      : days <= 7
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-slate-700 text-white'
                                  }`}
                                >
                                  {days <= 0 ? 'Overdue' : `${days} Days Remaining`}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/institution-dashboard/cases/${notice.caseId || notice.caseNumber}`}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Case Details</span>
                          </Link>

                          {isActionRequired && (
                            <Link
                              href={`/institution-dashboard/compliance?noticeId=${notice.id}&caseId=${notice.caseId || notice.caseNumber}`}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                            >
                              <SendHorizontal className="h-3.5 w-3.5" />
                              <span>Submit Reply</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function InstitutionNoticesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#002b5c] border-t-transparent" />
        </div>
      }
    >
      <InstitutionNoticesPageContent />
    </Suspense>
  );
}
