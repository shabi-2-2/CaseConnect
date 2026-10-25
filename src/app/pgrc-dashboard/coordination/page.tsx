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
} from 'lucide-react';
import { PgrcSidebar } from '@/components/layout/PgrcSidebar';
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

export default function PgrcCoordinationWorkspacePage() {
  const shouldReduceMotion = useReducedMotion();
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [requests, setRequests] = useState<CoordinationRequestItem[]>([]);
  const [allCases, setAllCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Selected request for details drawer/modal
  const [selectedRequest, setSelectedRequest] = useState<CoordinationRequestItem | null>(null);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);

  // New Request Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLinkedCase, setNewLinkedCase] = useState('');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [newTargetBureau, setNewTargetBureau] = useState('Regulation Bureau');
  const [newOwner, setNewOwner] = useState('PGRC Coordination Officer');
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
      setAllCases(casesData);
    } catch (e) {
      console.error('Failed to load coordination requests', e);
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
  const awaitingPgrc = requests.filter((r) => r.status === 'Awaiting PGRC Action').length;
  const awaitingRb = requests.filter((r) => r.status === 'Awaiting RB Response').length;
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
          institutionName: matchedCase?.institutionName || 'Apex Institute of Technology & Engineering',
          institutionCode: matchedCase?.institutionCode || '1-3329182741',
          requestingBureau: 'PGRC',
          targetBureau: newTargetBureau,
          priority: newPriority,
          assignedOwner: newOwner,
          followUpDeadline: newDeadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          description: newDesc,
          initialRemark: newInitialRemark,
          creatorName: 'PGRC Official',
          creatorRole: 'PGRC Official',
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
          newRemark: replyRemark.trim(),
          author: 'PGRC Official',
          role: 'PGRC Official',
        }),
      });

      if (!res.ok) throw new Error('Failed to append remark');
      const data = await res.json();
      setSelectedRequest(data.request);
      setReplyRemark('');
      await loadData(false);
    } catch (err: any) {
      alert(`Error: ${err?.message || 'Failed'}`);
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
          author: 'PGRC Official',
          role: 'PGRC Official',
          newRemark: `Coordination request status updated to: ${newStatus}`,
        }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      const data = await res.json();
      setSelectedRequest(data.request);
      await loadData(false);
    } catch (err: any) {
      alert(`Error: ${err?.message || 'Failed'}`);
    }
  };

  const getStatusBadge = (status: CoordinationRequestItem['status']) => {
    switch (status) {
      case 'Awaiting RB Response':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Awaiting PGRC Action':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'In Joint Review':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
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
        activeTab="coordination"
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        badgeCounts={{
          coordination: awaitingPgrc + awaitingRb,
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
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Link href="/pgrc-dashboard" className="hover:text-blue-700 transition-colors">
                  PGRC Dashboard
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-800 font-semibold">Coordination Workspace</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <Users className="h-6 w-6 text-[#002b5c]" />
                Regulation Bureau Coordination Workspace
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 max-w-2xl">
                Joint inquiry desk for coordinating grievances with the Regulation Bureau. Create requests, exchange inter-bureau notes, track deadlines, and sync resolutions in SQLite.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#002b5c] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#001f3f]"
              >
                <Plus className="h-4 w-4" />
                <span>New Coordination Request</span>
              </button>
              <button
                onClick={() => loadData(true)}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* Metric Strips */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div
                onClick={() => setStatusFilter('ALL')}
                className={`cursor-pointer rounded-xl border p-3.5 shadow-2xs transition-all ${
                  statusFilter === 'ALL' ? 'border-[#002b5c] bg-blue-50/50 ring-1 ring-[#002b5c]' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-[11px] font-medium text-slate-500">All Active Requests</div>
                <div className="mt-1 text-xl font-bold text-slate-900">{totalOpen}</div>
                <div className="text-[10px] text-slate-400">PGRC ↔ RB active</div>
              </div>

              <div
                onClick={() => setStatusFilter('Awaiting RB Response')}
                className={`cursor-pointer rounded-xl border p-3.5 shadow-2xs transition-all ${
                  statusFilter === 'Awaiting RB Response' ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-[11px] font-medium text-amber-700">Awaiting RB Response</div>
                <div className="mt-1 text-xl font-bold text-amber-800">{awaitingRb}</div>
                <div className="text-[10px] text-amber-600">Pending RB action</div>
              </div>

              <div
                onClick={() => setStatusFilter('Awaiting PGRC Action')}
                className={`cursor-pointer rounded-xl border p-3.5 shadow-2xs transition-all ${
                  statusFilter === 'Awaiting PGRC Action' ? 'border-rose-500 bg-rose-50/50 ring-1 ring-rose-500' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-[11px] font-medium text-rose-700">Awaiting PGRC Action</div>
                <div className="mt-1 text-xl font-bold text-rose-800">{awaitingPgrc}</div>
                <div className="text-[10px] text-rose-600">Requires our reply</div>
              </div>

              <div
                onClick={() => setStatusFilter('In Joint Review')}
                className={`cursor-pointer rounded-xl border p-3.5 shadow-2xs transition-all ${
                  statusFilter === 'In Joint Review' ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-[11px] font-medium text-blue-700">In Joint Review</div>
                <div className="mt-1 text-xl font-bold text-blue-800">{inJoint}</div>
                <div className="text-[10px] text-blue-600">Joint committee review</div>
              </div>

              <div
                onClick={() => setStatusFilter('Resolved')}
                className={`cursor-pointer rounded-xl border p-3.5 shadow-2xs transition-all ${
                  statusFilter === 'Resolved' ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-[11px] font-medium text-emerald-700">Resolved Requests</div>
                <div className="mt-1 text-xl font-bold text-emerald-800">{resolvedCount}</div>
                <div className="text-[10px] text-emerald-600">Formally concluded</div>
              </div>
            </motion.div>

            {/* Filter Bar */}
            <motion.div variants={itemVariants} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search request number, title, institution, or officer..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/60 py-1.5 pl-8 pr-8 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Showing <strong>{filteredRequests.length}</strong> of {requests.length} requests</span>
                  {(search || statusFilter !== 'ALL' || priorityFilter !== 'ALL') && (
                    <button onClick={() => { setSearch(''); setStatusFilter('ALL'); setPriorityFilter('ALL'); }} className="text-blue-700 font-semibold hover:underline ml-2">
                      Reset filters
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Coordination Requests Table */}
            <motion.div variants={itemVariants} className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200/80 bg-slate-50/80 font-semibold text-slate-600 uppercase text-[11px]">
                    <tr>
                      <th className="px-4 py-3.5">Request No</th>
                      <th className="px-4 py-3.5">Title & Institution</th>
                      <th className="px-4 py-3.5">Linked Case</th>
                      <th className="px-4 py-3.5 text-center">Status</th>
                      <th className="px-4 py-3.5 text-center">Priority</th>
                      <th className="px-4 py-3.5">Assigned Owner</th>
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
                        <tr key={r.id} className="hover:bg-blue-50/20 transition-colors">
                          <td className="px-4 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {r.requestNumber}
                          </td>
                          <td className="px-4 py-3.5 max-w-[240px]">
                            <div className="font-semibold text-slate-900 line-clamp-1">{r.title}</div>
                            <div className="text-[11px] text-slate-500 truncate">{r.institutionName}</div>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap font-mono text-blue-800 font-semibold text-[11px]">
                            {r.linkedCaseNumber || 'None'}
                          </td>
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${getStatusBadge(r.status)}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              r.priority === 'Critical' ? 'bg-rose-100 text-rose-800' :
                              r.priority === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {r.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-slate-700">
                            {r.assignedOwner}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                            {formatDate(r.followUpDeadline)}
                          </td>
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                              <MessageSquare className="h-3 w-3" />
                              {r.remarks?.length || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => setSelectedRequest(r)}
                              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 shadow-2xs"
                            >
                              Manage Request
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

      {/* Create Coordination Request Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#002b5c]" />
                Initiate Inter-Bureau Coordination Request
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Request Subject / Purpose *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Joint Verification of Degree Certificates & Fee Ledgers"
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Bureau</label>
                  <select
                    value={newTargetBureau}
                    onChange={(e) => setNewTargetBureau(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="Regulation Bureau">Regulation Bureau</option>
                    <option value="Approval Bureau">Approval Bureau</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="Critical">Critical (Immediate Joint Action)</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Link to Existing Complaint Case Number</label>
                <select
                  value={newLinkedCase}
                  onChange={(e) => setNewLinkedCase(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:outline-none"
                >
                  <option value="">Select a case (optional)</option>
                  {allCases.map((c) => (
                    <option key={c.id} value={c.caseNumber}>
                      {c.caseNumber} — {c.institutionName.slice(0, 30)} ({c.bureau})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Follow-Up Owner</label>
                  <input
                    type="text"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Response Target Deadline</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Inter-Bureau Context & Specific Queries</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Outline the specific factual questions, documentation required, or joint committee terms..."
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Procedural Remark</label>
                <input
                  type="text"
                  value={newInitialRemark}
                  onChange={(e) => setNewInitialRemark(e.target.value)}
                  placeholder="e.g. Formal notice dispatched under inter-bureau coordination standard."
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-lg bg-[#002b5c] px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#001f3f] disabled:opacity-50"
                >
                  {isCreating ? 'Creating in SQLite...' : 'Dispatch Request'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Manage Request Modal / Drawer */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl my-8 rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 text-xs"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                    {selectedRequest.requestNumber}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${getStatusBadge(selectedRequest.status)}`}>
                    {selectedRequest.status}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-[11px] text-slate-500 font-medium">Priority: {selectedRequest.priority}</span>
                </div>
                <h3 className="font-bold text-base text-slate-900 mt-1">{selectedRequest.title}</h3>
                <p className="text-[11px] text-slate-500">
                  {selectedRequest.institutionName} ({selectedRequest.institutionCode}) • Target: {selectedRequest.targetBureau}
                </p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="rounded p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedRequest.description && (
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-slate-700 text-xs leading-relaxed">
                {selectedRequest.description}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50/60 p-3 rounded-lg border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Linked Case</span>
                <span className="font-mono font-semibold text-blue-800">{selectedRequest.linkedCaseNumber || 'None'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Assigned Owner</span>
                <span className="font-medium text-slate-800">{selectedRequest.assignedOwner}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Follow-Up Deadline</span>
                <span className="font-medium text-slate-800">{formatDate(selectedRequest.followUpDeadline)}</span>
              </div>
            </div>

            {/* Quick Status Update Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-y border-slate-100 py-3">
              <span className="font-semibold text-slate-700">Set Coordination Standing:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleUpdateStatus('Awaiting RB Response')}
                  className="rounded border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100"
                >
                  Mark Awaiting RB
                </button>
                <button
                  onClick={() => handleUpdateStatus('In Joint Review')}
                  className="rounded border border-blue-300 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-800 hover:bg-blue-100"
                >
                  Mark Joint Review
                </button>
                <button
                  onClick={() => handleUpdateStatus('Resolved')}
                  className="rounded border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                  Conclude & Resolve
                </button>
              </div>
            </div>

            {/* Chronological Inter-Bureau Communication Trail */}
            <div>
              <h4 className="font-bold text-slate-900 text-xs mb-2 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                Inter-Bureau Remarks & Communication History ({selectedRequest.remarks?.length || 0})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border border-slate-200 p-3 bg-slate-50/40">
                {!selectedRequest.remarks || selectedRequest.remarks.length === 0 ? (
                  <div className="text-center text-slate-400 text-xs py-2">No remarks yet. Add the first note below.</div>
                ) : (
                  selectedRequest.remarks.map((rem) => (
                    <div key={rem.id} className="rounded border border-slate-200/80 bg-white p-2.5 shadow-2xs">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-semibold text-slate-800">{rem.author} ({rem.role})</span>
                        <span>{rem.timestamp}</span>
                      </div>
                      <p className="text-slate-700 text-xs">{rem.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add Remark Input */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={replyRemark}
                onChange={(e) => setReplyRemark(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddRemark(); }}
                placeholder="Type inter-bureau remark or note to commit to SQLite..."
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleAddRemark}
                disabled={isSendingRemark || !replyRemark.trim()}
                className="inline-flex items-center gap-1 rounded-lg bg-[#002b5c] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#001f3f] disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Post Note</span>
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedRequest(null)}
                className="rounded-lg bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Close
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
