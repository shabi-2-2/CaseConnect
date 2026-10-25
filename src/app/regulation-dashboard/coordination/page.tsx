'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import {
  Users,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Building2,
  Calendar,
  MessageSquare,
  Send,
  X,
  FileText,
  UserCheck,
  Filter,
  Scale,
} from 'lucide-react';
import { RbSidebar } from '@/components/layout/RbSidebar';
import { Navbar } from '@/components/layout/Navbar';
import { CaseDetailsModal } from '@/components/dashboard/CaseDetailsModal';
import { CaseItem } from '@/types/dashboard';
import { fetchComplaints } from '@/lib/complaints-api';
import { formatDate } from '@/lib/utils';

interface CoordinationRequestItem {
  id: string;
  requestNumber: string;
  linkedCaseId: string;
  linkedCaseNumber: string;
  institutionName: string;
  institutionCode: string;
  requestingBureau: string;
  targetBureau: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedOwner: string;
  status: 'Awaiting PGRC Action' | 'Awaiting RB Response' | 'In Joint Review' | 'Resolved';
  followUpDeadline: string;
  remarks: Array<{
    id: string;
    author: string;
    role: string;
    text: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function RbCoordinationWorkspacePage() {
  const shouldReduceMotion = useReducedMotion();
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [requests, setRequests] = useState<CoordinationRequestItem[]>([]);
  const [allCases, setAllCases] = useState<CaseItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Selected for communication thread
  const [selectedRequest, setSelectedRequest] = useState<CoordinationRequestItem | null>(null);
  const [selectedCaseModal, setSelectedCaseModal] = useState<CaseItem | null>(null);

  // Modal: New Request
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLinkedCase, setNewLinkedCase] = useState('');
  const [newTargetBureau, setNewTargetBureau] = useState('PGRC');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High');
  const [newOwner, setNewOwner] = useState('Er. Sandeep Mukherjee');
  const [newDeadline, setNewDeadline] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newInitialRemark, setNewInitialRemark] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Remark in selected request
  const [replyRemark, setReplyRemark] = useState('');
  const [isSendingRemark, setIsSendingRemark] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const [coordRes, casesData] = await Promise.all([
        fetch('/api/coordination', { cache: 'no-store' }).then((r) => r.json()),
        fetchComplaints(),
      ]);
      if (Array.isArray(coordRes.requests)) {
        setRequests(coordRes.requests);
        if (selectedRequest) {
          const updated = coordRes.requests.find((r: CoordinationRequestItem) => r.id === selectedRequest.id);
          if (updated) setSelectedRequest(updated);
        }
      }
      setAllCases(casesData || []);
    } catch (e) {
      console.error('Failed to load coordination requests', e);
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

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && r.priority !== priorityFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNum = r.requestNumber.toLowerCase().includes(q);
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchInst = r.institutionName.toLowerCase().includes(q) || r.institutionCode.toLowerCase().includes(q);
        const matchCase = r.linkedCaseNumber.toLowerCase().includes(q);
        const matchOwner = r.assignedOwner.toLowerCase().includes(q);
        if (!matchNum && !matchTitle && !matchInst && !matchCase && !matchOwner) return false;
      }
      return true;
    });
  }, [requests, statusFilter, priorityFilter, search]);

  // Counts
  const totalOpen = requests.filter((r) => r.status !== 'Resolved').length;
  const awaitingRb = requests.filter((r) => r.status === 'Awaiting RB Response').length;
  const awaitingPgrc = requests.filter((r) => r.status === 'Awaiting PGRC Action').length;
  const inJoint = requests.filter((r) => r.status === 'In Joint Review').length;
  const resolvedCount = requests.filter((r) => r.status === 'Resolved').length;

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsCreating(true);
    try {
      const matchedCase = allCases.find(
        (c) => c.caseNumber === newLinkedCase || c.id === newLinkedCase
      );

      const res = await fetch('/api/coordination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          linkedCaseId: matchedCase?.id || '',
          linkedCaseNumber: matchedCase?.caseNumber || newLinkedCase,
          institutionName: matchedCase?.institutionName || 'Metro City College of Engineering',
          institutionCode: matchedCase?.institutionCode || '1-2098471625',
          requestingBureau: 'Regulation Bureau',
          targetBureau: newTargetBureau,
          priority: newPriority,
          assignedOwner: newOwner,
          followUpDeadline: newDeadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          description: newDesc,
          initialRemark: newInitialRemark,
          creatorName: 'Regulation Bureau Official',
          creatorRole: 'Regulation Bureau Official',
        }),
      });

      if (!res.ok) throw new Error('Failed to create coordination request');

      setIsCreateOpen(false);
      setNewTitle('');
      setNewLinkedCase('');
      setNewDesc('');
      setNewInitialRemark('');
      await loadData(false);
    } catch (err: any) {
      alert(`Error creating request: ${err?.message || 'Failed'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddRemark = async () => {
    if (!selectedRequest || !replyRemark.trim()) return;
    setIsSendingRemark(true);
    try {
      const res = await fetch('/api/coordination', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRequest.id,
          remarkText: replyRemark.trim(),
          authorName: 'Regulation Bureau Official',
          authorRole: 'Regulation Bureau Official',
        }),
      });

      if (!res.ok) throw new Error('Failed to add remark');

      setReplyRemark('');
      await loadData(false);
    } catch (err: any) {
      alert(`Error updating thread: ${err?.message || 'Failed'}`);
    } finally {
      setIsSendingRemark(false);
    }
  };

  const handleUpdateStatus = async (newStatus: CoordinationRequestItem['status']) => {
    if (!selectedRequest) return;
    try {
      const res = await fetch('/api/coordination', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRequest.id,
          status: newStatus,
          remarkText: `Status updated to "${newStatus}" by Regulation Bureau Official.`,
          authorName: 'Regulation Bureau Official',
          authorRole: 'Regulation Bureau Official',
        }),
      });

      if (!res.ok) throw new Error('Failed to update status');
      await loadData(false);
    } catch (err: any) {
      alert(`Error updating status: ${err?.message || 'Failed'}`);
    }
  };

  const handleInspectCase = (caseNumber: string) => {
    const found = allCases.find((c) => c.caseNumber === caseNumber);
    if (found) {
      setSelectedCaseModal(found);
    } else {
      alert(`Case ${caseNumber} details not found in active database.`);
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
        activeTab="coordination"
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        badgeCounts={{
          cases: rbCases.length,
          coordination: totalOpen,
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
                  <span className="text-slate-800 font-semibold">Inter-Bureau Coordination Workspace</span>
                </div>
                <h1 className="mt-1 font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight flex items-center gap-2.5">
                  <Users className="h-6 w-6 text-amber-600" />
                  Inter-Bureau Coordination &amp; Joint Action Hub
                </h1>
                <p className="mt-0.5 text-xs text-slate-500">
                  Collaborate directly with Public Grievance Redressal Cell (PGRC) and Senior Management on cross-bureau institutional inspections
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadData(true)}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#002b5c] px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Coordination Request</span>
                </button>
              </div>
            </motion.div>

            {/* Quick Metrics Strip */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs"
            >
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <span className="text-slate-500 font-medium">All Active Requests</span>
                <div className="mt-1 text-xl font-bold text-slate-900">{totalOpen}</div>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 shadow-2xs">
                <span className="text-amber-800 font-medium">Awaiting RB Action</span>
                <div className="mt-1 text-xl font-bold text-amber-900">{awaitingRb}</div>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 shadow-2xs">
                <span className="text-blue-800 font-medium">Awaiting PGRC Response</span>
                <div className="mt-1 text-xl font-bold text-blue-900">{awaitingPgrc}</div>
              </div>
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3.5 shadow-2xs">
                <span className="text-indigo-800 font-medium">In Joint Review</span>
                <div className="mt-1 text-xl font-bold text-indigo-900">{inJoint}</div>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-2xs">
                <span className="text-emerald-800 font-medium">Resolved</span>
                <div className="mt-1 text-xl font-bold text-emerald-900">{resolvedCount}</div>
              </div>
            </motion.div>

            {/* Filters */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Filter className="h-3.5 w-3.5 text-amber-600" />
                  <span>Filter Requests</span>
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
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Search Coordination</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Title, request #, institution, case ID..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Awaiting RB Response">Awaiting RB Response</option>
                    <option value="Awaiting PGRC Action">Awaiting PGRC Action</option>
                    <option value="In Joint Review">In Joint Review</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Requests Table */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5">Request ID</th>
                      <th className="px-4 py-3.5">Subject &amp; Institution</th>
                      <th className="px-4 py-3.5">Linked Case</th>
                      <th className="px-4 py-3.5">Bureau Flow</th>
                      <th className="px-4 py-3.5">Priority</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5">Follow-up Target</th>
                      <th className="px-4 py-3.5 text-center">Remarks</th>
                      <th className="px-4 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-500">
                          <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                          <p className="font-semibold text-slate-700 text-sm">No coordination requests found</p>
                          <p className="text-xs text-slate-400 mt-0.5">Click &ldquo;New Coordination Request&rdquo; to initiate joint tracking.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((r) => (
                        <tr key={r.id} className="hover:bg-amber-50/20 transition-colors">
                          <td className="px-4 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {r.requestNumber}
                          </td>
                          <td className="px-4 py-3.5 max-w-[240px]">
                            <div className="font-semibold text-slate-900 line-clamp-1">{r.title}</div>
                            <div className="text-[11px] text-slate-500 truncate">{r.institutionName}</div>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap font-mono text-amber-800 font-semibold text-[11px]">
                            {r.linkedCaseNumber || 'None'}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-[11px]">
                            <span className="font-medium text-slate-700">{r.requestingBureau}</span>
                            <span className="text-slate-400 mx-1">→</span>
                            <span className="font-medium text-slate-900">{r.targetBureau}</span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                r.priority === 'Critical'
                                  ? 'bg-rose-100 text-rose-800'
                                  : r.priority === 'High'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {r.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                                r.status === 'Resolved'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : r.status === 'In Joint Review'
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                                  : r.status === 'Awaiting RB Response'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-blue-50 text-blue-700 border-blue-300'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">
                            {formatDate(r.followUpDeadline)}
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">
                              {r.remarks.length}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => setSelectedRequest(r)}
                              className="inline-flex items-center gap-1 rounded bg-[#002b5c] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-800 transition"
                            >
                              <MessageSquare className="h-3 w-3" /> Thread
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        </main>
      </div>

      {/* Communication Thread & Status Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-amber-50/70 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-amber-900 bg-white border border-amber-200 px-2 py-0.5 rounded">
                    {selectedRequest.requestNumber}
                  </span>
                  <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                    {selectedRequest.status}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mt-1">{selectedRequest.title}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {selectedRequest.institutionName} ({selectedRequest.institutionCode})
                </p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {/* Description & Case Link */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 text-xs space-y-2">
              <p className="text-slate-700 leading-relaxed">{selectedRequest.description}</p>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <span>Linked Case:</span>
                  <button
                    onClick={() => handleInspectCase(selectedRequest.linkedCaseNumber)}
                    className="font-mono font-semibold text-amber-800 hover:underline inline-flex items-center gap-1"
                  >
                    {selectedRequest.linkedCaseNumber} <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div>
                  Assigned Owner: <strong className="text-slate-800">{selectedRequest.assignedOwner}</strong>
                </div>
              </div>
            </div>

            {/* Status Transition Action Bar */}
            <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-600 text-[11px]">Update Coordination Stage:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleUpdateStatus('Awaiting RB Response')}
                  className="rounded bg-amber-50 border border-amber-200 px-2 py-1 text-[10px] font-semibold text-amber-800 hover:bg-amber-100 transition"
                >
                  Awaiting RB
                </button>
                <button
                  onClick={() => handleUpdateStatus('Awaiting PGRC Action')}
                  className="rounded bg-blue-50 border border-blue-200 px-2 py-1 text-[10px] font-semibold text-blue-800 hover:bg-blue-100 transition"
                >
                  Awaiting PGRC
                </button>
                <button
                  onClick={() => handleUpdateStatus('In Joint Review')}
                  className="rounded bg-indigo-50 border border-indigo-200 px-2 py-1 text-[10px] font-semibold text-indigo-800 hover:bg-indigo-100 transition"
                >
                  In Joint Review
                </button>
                <button
                  onClick={() => handleUpdateStatus('Resolved')}
                  className="rounded bg-emerald-50 border border-emerald-200 px-2 py-1 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                >
                  Mark Resolved
                </button>
              </div>
            </div>

            {/* Conversation Log */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Official Correspondence Log
              </div>

              {selectedRequest.remarks.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No correspondence recorded yet. Post the first update below.
                </div>
              ) : (
                selectedRequest.remarks.map((rem) => (
                  <div
                    key={rem.id}
                    className={`rounded-xl p-3 text-xs space-y-1 ${
                      rem.role.includes('Regulation')
                        ? 'bg-amber-50/70 border border-amber-200 ml-4'
                        : 'bg-slate-100 border border-slate-200 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                        {rem.author} ({rem.role})
                      </span>
                      <span className="text-slate-400 font-mono">{rem.timestamp}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{rem.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Reply Input Box */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-2">
              <input
                type="text"
                value={replyRemark}
                onChange={(e) => setReplyRemark(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRemark()}
                placeholder="Post inspection findings, response memo, or internal update..."
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
              />
              <button
                onClick={handleAddRemark}
                disabled={isSendingRemark || !replyRemark.trim()}
                className="inline-flex items-center gap-1 rounded-lg bg-[#002b5c] px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-50 transition"
              >
                <Send className="h-3 w-3" />
                <span>Send</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* New Request Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-amber-600" />
                Initiate Inter-Bureau Coordination Request
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Subject / Inquiry Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Joint Inquiry on Sanctioned Intake & Capitation Receipts"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Linked Regulatory Docket / Case</label>
                <select
                  value={newLinkedCase}
                  onChange={(e) => setNewLinkedCase(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                >
                  <option value="">Select an active case...</option>
                  {allCases.map((c) => (
                    <option key={c.id} value={c.caseNumber}>
                      [{c.bureau}] {c.caseNumber} — {c.institutionName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Target Bureau</label>
                  <select
                    value={newTargetBureau}
                    onChange={(e) => setNewTargetBureau(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="PGRC">Public Grievance Cell (PGRC)</option>
                    <option value="Senior Management">Senior Management</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Urgency Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Critical">Critical (Immediate Audit)</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Assigned RB Lead</label>
                  <input
                    type="text"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Follow-up Target Date</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Investigation Scope &amp; Context</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Outline evidence required, physical audit dates, or specific violations..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Opening Memorandum / Remark</label>
                <input
                  type="text"
                  value={newInitialRemark}
                  onChange={(e) => setNewInitialRemark(e.target.value)}
                  placeholder="e.g. Formal enquiry dispatched citing Council Regulation Section 10(b)."
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-1.5 rounded-lg bg-[#002b5c] text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  {isCreating ? 'Creating...' : 'Dispatch Request'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Case Details Quick View */}
      <CaseDetailsModal
        selectedCase={selectedCaseModal}
        onClose={() => setSelectedCaseModal(null)}
        allowStatusEdit={selectedCaseModal?.bureau === 'Regulation Bureau'}
      />
    </div>
  );
}
