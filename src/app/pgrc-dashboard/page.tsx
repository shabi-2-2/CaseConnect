'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Download,
  RefreshCw,
  ShieldCheck,
  Building2,
  FileText,
  CheckCircle2,
  Users,
  Search,
  BarChart3,
  Link2,
} from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { PgrcSidebar } from '@/components/layout/PgrcSidebar';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { StatusDonutChart } from '@/components/charts/StatusDonutChart';
import { CaseDetailsModal } from '@/components/dashboard/CaseDetailsModal';
import { RECENT_ACTIVITIES } from '@/data/mockData';
import { CaseItem } from '@/types/dashboard';
import { useMounted, formatDate, formatIndianNumber } from '@/lib/utils';
import { fetchComplaints } from '@/lib/complaints-api';

type PGRCSidebarTab =
  | 'overview'
  | 'cases'
  | 'institution-search'
  | 'related-rb'
  | 'overlap-queue'
  | 'coordination'
  | 'reports';

export default function PGRCDashboardPage() {
  const [activeTab, setActiveTab] = useState<PGRCSidebarTab>('overview');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | CaseItem['status']>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | string>('ALL');
  const [overlapFilter, setOverlapFilter] = useState<'ALL' | 'OVERLAP' | 'NO_OVERLAP'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [allCases, setAllCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const mounted = useMounted();

  const loadCases = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      setError(null);
      const data = await fetchComplaints();
      setAllCases(data);
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
    }, 8000);
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
    : 'Saturday, 24 October 2026';

  const pgrcCases = useMemo(() => {
    return allCases.filter((c) => c.bureau === 'PGRC');
  }, [allCases]);

  const rbCases = useMemo(() => {
    return allCases.filter((c) => c.bureau === 'Regulation Bureau');
  }, [allCases]);

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
        title: 'Total PGRC cases',
        value: total,
        changePercent: undefined,
        changeType: 'neutral' as const,
        subtext: 'Assigned to Public Grievance Redressal Cell',
        iconName: 'FolderKanban',
        accentColor: 'blue',
      },
      {
        id: 'pgrc-pending',
        title: 'Pending grievances',
        value: pending,
        changePercent: undefined,
        changeType: 'neutral' as const,
        subtext: 'Awaiting scrutiny/action',
        iconName: 'Clock',
        accentColor: 'amber',
      },
      {
        id: 'pgrc-under-process',
        title: 'Cases under process',
        value: underProcess,
        changePercent: undefined,
        changeType: 'neutral' as const,
        subtext: 'Inquiry/review underway',
        iconName: 'Activity',
        accentColor: 'indigo',
      },
      {
        id: 'pgrc-disposed',
        title: 'Cases disposed',
        value: disposed,
        changePercent: undefined,
        changeType: 'positive' as const,
        subtext: 'Resolved/closed',
        iconName: 'CheckCircle2',
        accentColor: 'emerald',
      },
      {
        id: 'pgrc-overdue',
        title: 'Overdue cases',
        value: overdue,
        changePercent: undefined,
        changeType: 'negative' as const,
        subtext: 'Beyond expected disposal',
        iconName: 'AlertTriangle',
        accentColor: 'rose',
        badgeText: overdue > 0 ? 'Needs Action' : undefined,
      },
      {
        id: 'pgrc-overlap',
        title: 'Open cross-bureau overlap alerts',
        value: openOverlap,
        changePercent: undefined,
        changeType: 'neutral' as const,
        subtext: 'Potential PGRC–RB overlaps',
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
          c.status.toLowerCase().includes(q);
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

  const handleRefresh = () => {
    loadCases(true);
  };

  const handleExport = () => {
    const headers = [
      'Source case ID',
      'Institution name',
      'AICTE Permanent ID',
      'Complaint category',
      'Date received',
      'Current status',
      'Assigned officer',
      'Last action',
      'Next action',
      'Expected disposal date',
      'Overlap indicator',
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

  const overlapItems = useMemo(() => {
    return pgrcCases
      .filter((c) => c.hasOverlapAlert && c.overlapDetails)
      .map((c) => ({
        pgrcCase: c,
        rbCase: allCases.find((rb) => rb.caseNumber === c.overlapDetails?.overlapCaseId) || null,
      }));
  }, [pgrcCases, allCases]);

  const relatedRbByInstitution = useMemo(() => {
    const pgrcInsts = new Set(pgrcCases.map((c) => c.institutionCode));
    return rbCases.filter((rb) => pgrcInsts.has(rb.institutionCode));
  }, [pgrcCases, rbCases]);

  const pgrcActivities = useMemo(() => {
    const pgrcCaseIds = new Set(pgrcCases.map((c) => c.caseNumber));
    return RECENT_ACTIVITIES.filter((a) => pgrcCaseIds.has(a.caseId)).slice(0, 6);
  }, [pgrcCases]);



  const sidebarNav = [
    { id: 'overview' as PGRCSidebarTab, label: 'PGRC Overview', icon: LayoutDashboardIcon },
    { id: 'cases' as PGRCSidebarTab, label: 'PGRC Cases', icon: FolderKanbanIcon },
    { id: 'institution-search' as PGRCSidebarTab, label: 'Institution Search', icon: Building2Icon },
    { id: 'related-rb' as PGRCSidebarTab, label: 'Related RB Cases', icon: Link2Icon },
    { id: 'overlap-queue' as PGRCSidebarTab, label: 'Overlap Review Queue', icon: CopyCheckIcon },
    { id: 'coordination' as PGRCSidebarTab, label: 'Coordination Workspace', icon: UsersIcon },
    { id: 'reports' as PGRCSidebarTab, label: 'PGRC Reports', icon: BarChart3Icon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar */}
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
        <Navbar
          onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
          isSidebarOpen={isSidebarOpenMobile}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectCase={handleSelectCaseById}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200/80 pb-5">
            <div>
              <div className="flex items-center gap-2">
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
              <h1 className="mt-2 font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">PGRC Official Dashboard</h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
                Grievance monitoring, case tracking and cross-bureau coordination
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:self-start md:self-auto">
              <button onClick={handleRefresh} disabled={isRefreshing} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
              </button>
              <button onClick={handleExport} className="inline-flex items-center gap-1.5 rounded-lg bg-[#002b5c] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#001f3f] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <Download className="h-3.5 w-3.5" />
                <span>Report export</span>
              </button>
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <section aria-label="PGRC KPI Cards">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
                  {pgrcKpis.map((kpi, index) => (
                    <KpiCard
                      key={kpi.id}
                      metric={kpi}
                      index={index}
                      onClick={() => {
                        if (kpi.id === 'pgrc-overlap') setActiveTab('overlap-queue');
                        else if (kpi.id === 'pgrc-overdue') setActiveTab('cases');
                        else setActiveTab('cases');
                      }}
                    />
                  ))}
                </div>
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }} className="lg:col-span-4">
                  <StatusDonutChart />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }} className="lg:col-span-8">
                  <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden h-full">
                    <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5">
                      <div>
                        <h3 className="font-bold text-base text-slate-900">PGRC vs Regulation Bureau visibility</h3>
                        <p className="mt-1 text-xs text-slate-500">Cross-bureau coordination view (RB records shown for visibility only)</p>
                      </div>
                    </div>
                    <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-2 w-2 rounded-full bg-blue-600" />
                          <span className="text-xs font-semibold text-blue-800">PGRC cases</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900">{formatIndianNumber(pgrcCases.length)}</div>
                        <div className="text-xs text-slate-500 mt-1">Owned by PGRC</div>
                      </div>
                      <div className="rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-2 w-2 rounded-full bg-amber-500" />
                          <span className="text-xs font-semibold text-amber-800">Relevant RB cases (same institutions)</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900">{formatIndianNumber(relatedRbByInstitution.length)}</div>
                        <div className="text-xs text-slate-500 mt-1">For coordination & visibility only</div>
                      </div>
                      <div className="md:col-span-2 rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-700">Potentially related cases</span>
                          <span className="text-xs text-slate-500">{overlapItems.length} items</span>
                        </div>
                        <div className="space-y-2">
                          {overlapItems.slice(0, 3).map(({ pgrcCase, rbCase }) => (
                            <div key={pgrcCase.caseNumber} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border border-slate-100 p-2.5">
                              <div className="text-xs">
                                <div className="font-semibold text-slate-900">{pgrcCase.caseNumber} ↔ {rbCase?.caseNumber || pgrcCase.overlapDetails?.overlapCaseId}</div>
                                <div className="text-slate-500">{pgrcCase.institutionName}</div>
                              </div>
                              <button onClick={() => setSelectedCase(pgrcCase)} className="mt-2 sm:mt-0 text-xs font-semibold text-blue-700 hover:text-blue-800">View both cases</button>
                            </div>
                          ))}
                          {overlapItems.length === 0 && <div className="text-xs text-slate-500">No overlap items currently identified.</div>}
                        </div>
                      </div>
                      <div className="md:col-span-2 rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-700">Coordination requests awaiting action</span>
                          <span className="text-xs text-slate-500">{overlapItems.length}</span>
                        </div>
                        <div className="text-xs text-slate-500">Coordination requests tracked via overlap review queue.</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.25 }} className="lg:col-span-8">
                  <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
                    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-bold text-base text-slate-900">PGRC case table</h3>
                        <p className="mt-1 text-xs text-slate-500">Searchable, filterable list of PGRC cases</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search cases/institutions..." className="rounded-lg border border-slate-200 pl-7 pr-2 py-1.5 text-xs" />
                        </div>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'ALL' | CaseItem['status'])} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs">
                          <option value="ALL">All Status</option>
                          <option value="Pending">Pending</option>
                          <option value="Under Process">Under Process</option>
                          <option value="Disposed">Disposed</option>
                          <option value="Overdue">Overdue</option>
                        </select>
                        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs">
                          <option value="ALL">All Categories</option>
                          {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <select value={overlapFilter} onChange={(e) => setOverlapFilter(e.target.value as 'ALL' | 'OVERLAP' | 'NO_OVERLAP')} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs">
                          <option value="ALL">All Overlap</option>
                          <option value="OVERLAP">With Overlap</option>
                          <option value="NO_OVERLAP">No Overlap</option>
                        </select>
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs" />
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs" />
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50/80">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold text-slate-600">Source case ID</th>
                            <th className="px-4 py-2 text-left font-semibold text-slate-600">Institution name</th>
                            <th className="px-4 py-2 text-left font-semibold text-slate-600">AICTE Permanent ID</th>
                            <th className="px-4 py-2 text-left font-semibold text-slate-600">Complaint category</th>
                            <th className="px-4 py-2 text-left font-semibold text-slate-600">Date received</th>
                            <th className="px-4 py-2 text-left font-semibold text-slate-600">Current status</th>
                            <th className="px-4 py-2 text-left font-semibold text-slate-600">Assigned officer</th>
                            <th className="px-4 py-2 text-left font-semibold text-slate-600">Last action</th>
                            <th className="px-4 py-2 text-left font-semibold text-slate-600">Next action</th>
                            <th className="px-4 py-2 text-left font-semibold text-slate-600">Expected disposal date</th>
                            <th className="px-4 py-2 text-left font-semibold text-slate-600">Overlap indicator</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTableCases.map((c) => (
                            <tr key={c.id} onClick={() => setSelectedCase(c)} className="border-t border-slate-100 hover:bg-slate-50/60 cursor-pointer">
                              <td className="px-4 py-2 font-mono text-slate-900">{c.caseNumber}</td>
                              <td className="px-4 py-2">
                                <div className="font-medium text-slate-900">{c.institutionName}</div>
                                <div className="text-slate-500">{c.location}</div>
                              </td>
                              <td className="px-4 py-2 text-slate-700">{c.institutionCode}</td>
                              <td className="px-4 py-2 text-slate-700">{c.category}</td>
                              <td className="px-4 py-2 text-slate-700">{formatDate(c.submissionDate)}</td>
                              <td className="px-4 py-2">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                                  c.status === 'Overdue' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                  c.status === 'Under Process' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  c.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>{c.status}</span>
                              </td>
                              <td className="px-4 py-2 text-slate-700">{c.assignedOfficer}</td>
                              <td className="px-4 py-2 text-slate-700">{formatDate(c.lastUpdated)}</td>
                              <td className="px-4 py-2 text-slate-700">{c.status === 'Overdue' ? 'Follow-up/Escalation' : c.status === 'Pending' ? 'Review & Assign/Act' : c.status === 'Disposed' ? 'Archive/Closeout' : 'Review progress'}</td>
                              <td className="px-4 py-2 text-slate-700">{formatDate(c.expectedDisposalDate)}</td>
                              <td className="px-4 py-2">{c.hasOverlapAlert ? <span className="text-rose-700 font-semibold">Yes</span> : <span className="text-slate-500">No</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredTableCases.length === 0 && <div className="p-4 text-center text-xs text-slate-500">No PGRC cases match the current filters.</div>}
                    </div>
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.3 }} className="lg:col-span-4 space-y-5">
                  <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 p-4">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">Overlap review section</h3>
                        <p className="text-xs text-slate-500">Potential PGRC/RB relationships</p>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      {overlapItems.map(({ pgrcCase, rbCase }) => (
                        <div key={pgrcCase.caseNumber} className="rounded-lg border border-slate-200 p-3">
                          <div className="text-xs font-semibold text-slate-900">{pgrcCase.caseNumber} ↔ {rbCase?.caseNumber || pgrcCase.overlapDetails?.overlapCaseId}</div>
                          <div className="text-xs text-slate-500 mt-1">{pgrcCase.institutionName} ({pgrcCase.institutionCode})</div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                            <span>PGRC: {pgrcCase.status}</span>
                            <span>•</span>
                            <span>RB: {rbCase?.status || 'N/A'}</span>
                          </div>
                          <div className="mt-2 text-xs text-slate-700">{pgrcCase.overlapDetails?.reason}</div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <button onClick={() => { if (rbCase) setSelectedCase(rbCase); else setSelectedCase(pgrcCase); }} className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">View both cases</button>
                            <button onClick={() => setSelectedCase(pgrcCase)} className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">Open the comparison</button>
                            <button onClick={() => alert('Review outcome recorded (demo). No case status changed. Each source case ID and separate identity preserved.')} className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">Record a review outcome</button>
                          </div>
                          <div className="mt-1 text-[10px] text-slate-400">Each source case ID and separate identity preserved. No automatic merge/close.</div>
                        </div>
                      ))}
                      {overlapItems.length === 0 && <div className="text-xs text-slate-500">No overlap review items.</div>}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 p-4">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">Recent PGRC activity</h3>
                        <p className="text-xs text-slate-500">Latest relevant actions</p>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      {pgrcActivities.map((act) => (
                        <button key={act.id} onClick={() => handleSelectCaseById(act.caseId)} className="w-full text-left rounded-lg border border-slate-100 p-2.5 hover:bg-slate-50/60">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-semibold text-slate-900">{act.title}</div>
                            <div className="text-[10px] text-slate-400">{act.timestamp}</div>
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">{act.description}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{act.caseId}</div>
                        </button>
                      ))}
                      {pgrcActivities.length === 0 && <div className="text-xs text-slate-500">No recent PGRC activities.</div>}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 p-4">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">Deadlines and follow-ups</h3>
                        <p className="text-xs text-slate-500">Overdue/approaching deadlines</p>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      {pgrcCases.filter((c) => c.status === 'Overdue' || c.status === 'Pending' || c.status === 'Under Process').slice(0, 6).map((c) => (
                          <button key={c.id} onClick={() => setSelectedCase(c)} className="w-full text-left rounded-lg border border-slate-100 p-2.5 hover:bg-slate-50/60">
                            <div className="flex items-center justify-between">
                              <div className="text-xs font-semibold text-slate-900">{c.caseNumber}</div>
                              <div className="text-[10px] font-semibold text-slate-500">Due {formatDate(c.expectedDisposalDate)}</div>
                            </div>
                            <div className="text-xs text-slate-600 mt-0.5">{c.institutionName}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{c.status} • Follow-up needed</div>
                          </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </section>
            </div>
          )}

          {activeTab !== 'overview' && (
            <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
              <div className="border-b border-slate-100 p-5">
                <h2 className="font-bold text-lg text-slate-900">{getPGRCTabTitle(activeTab)}</h2>
                <p className="text-sm text-slate-500 mt-1">{getPGRCTabDesc(activeTab)}</p>
              </div>
              <div className="p-6">
                <div className="rounded-lg border border-slate-200 p-6 text-center">
                  <FileText className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                  <div className="font-semibold text-slate-900">Functional placeholder</div>
                  <div className="text-sm text-slate-500 mt-1">This section is implemented as a clearly labelled, functional view consistent with PGRC scope. Use the Overview tab for the full dashboard experience.</div>
                  <button onClick={() => setActiveTab('overview')} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#002b5c] px-3 py-2 text-xs font-semibold text-white hover:bg-[#001f3f]">Back to PGRC Overview</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

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
    </div>
  );
}

function LayoutDashboardIcon(props: React.SVGProps<SVGSVGElement>) { return <BarChart3 {...props} />; }
function FolderKanbanIcon(props: React.SVGProps<SVGSVGElement>) { return <FileText {...props} />; }
function Building2Icon(props: React.SVGProps<SVGSVGElement>) { return <Building2 {...props} />; }
function Link2Icon(props: React.SVGProps<SVGSVGElement>) { return <Link2 {...props} />; }
function CopyCheckIcon(props: React.SVGProps<SVGSVGElement>) { return <CheckCircle2 {...props} />; }
function UsersIcon(props: React.SVGProps<SVGSVGElement>) { return <Users {...props} />; }
function BarChart3Icon(props: React.SVGProps<SVGSVGElement>) { return <BarChart3 {...props} />; }

function getPGRCTabTitle(tab: PGRCSidebarTab) {
  switch (tab) {
    case 'cases': return 'PGRC Cases';
    case 'institution-search': return 'Institution Search';
    case 'related-rb': return 'Related RB Cases';
    case 'overlap-queue': return 'Overlap Review Queue';
    case 'coordination': return 'Coordination Workspace';
    case 'reports': return 'PGRC Reports';
    default: return 'PGRC';
  }
}

function getPGRCTabDesc(tab: PGRCSidebarTab) {
  switch (tab) {
    case 'cases': return 'Manage and track PGRC grievances';
    case 'institution-search': return 'Search institutions across PGRC/RB records';
    case 'related-rb': return 'RB cases related to PGRC institutions (visibility only)';
    case 'overlap-queue': return 'Review potential PGRC/RB case overlaps';
    case 'coordination': return 'Cross-bureau coordination workspace';
    case 'reports': return 'PGRC reports and exports';
    default: return 'PGRC functionality';
  }
}
