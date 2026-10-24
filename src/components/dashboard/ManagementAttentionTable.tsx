'use client';

import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Eye,
  Sparkles,
  Building,
} from 'lucide-react';
import { CaseItem, BureauType, CasePriority, CaseStatus } from '@/types/dashboard';
import { formatDate } from '@/lib/utils';

interface ManagementAttentionTableProps {
  cases: CaseItem[];
  onViewCase: (caseItem: CaseItem) => void;
  externalSearchQuery?: string;
}

export function ManagementAttentionTable({
  cases,
  onViewCase,
  externalSearchQuery = '',
}: ManagementAttentionTableProps) {
  const [bureauFilter, setBureauFilter] = useState<'ALL' | BureauType>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | CasePriority>('ALL');
  const [onlyOverlaps, setOnlyOverlaps] = useState<boolean>(false);

  const combinedSearch = externalSearchQuery.trim().toLowerCase();

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Bureau filter
      if (bureauFilter !== 'ALL' && c.bureau !== bureauFilter) return false;

      // Priority filter
      if (priorityFilter !== 'ALL' && c.priority !== priorityFilter) return false;

      // Overlap filter
      if (onlyOverlaps && !c.hasOverlapAlert) return false;

      // Search match
      if (combinedSearch) {
        const matchesName = c.institutionName.toLowerCase().includes(combinedSearch);
        const matchesCode = c.institutionCode.toLowerCase().includes(combinedSearch);
        const matchesCaseNum = c.caseNumber.toLowerCase().includes(combinedSearch);
        const matchesSubject = c.subject.toLowerCase().includes(combinedSearch);
        const matchesRegion = c.region.toLowerCase().includes(combinedSearch);
        const matchesBureau = c.bureau.toLowerCase().includes(combinedSearch);
        const matchesStatus = c.status.toLowerCase().includes(combinedSearch);
        return (
          matchesName ||
          matchesCode ||
          matchesCaseNum ||
          matchesSubject ||
          matchesRegion ||
          matchesBureau ||
          matchesStatus
        );
      }

      return true;
    });
  }, [cases, bureauFilter, priorityFilter, onlyOverlaps, combinedSearch]);

  const getPriorityBadge = (priority: CasePriority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'High':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Low':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (status: CaseStatus) => {
    switch (status) {
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            Overdue
          </span>
        );
      case 'Under Process':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Under Process
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Pending
          </span>
        );
      case 'Disposed':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Disposed
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
      {/* Table Header and Control Bar */}
      <div className="border-b border-slate-100 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-base text-slate-900">
                Requires Management Attention
              </h3>
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">
                {filteredCases.length} Cases
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              High-priority grievances, overdue statutory SLAs, and cross-bureau overlap alerts
            </p>
          </div>

          {/* Quick filter pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setOnlyOverlaps(!onlyOverlaps)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                onlyOverlaps
                  ? 'border-purple-300 bg-purple-50 text-purple-800 shadow-xs ring-1 ring-purple-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              <span>Overlap Flags Only</span>
            </button>

            {/* Bureau Filter */}
            <select
              value={bureauFilter}
              onChange={(e) => setBureauFilter(e.target.value as 'ALL' | BureauType)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Bureaus</option>
              <option value="PGRC">PGRC Only</option>
              <option value="Regulation Bureau">Regulation Bureau Only</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as 'ALL' | CasePriority)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200/80 bg-slate-50/80 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-4 py-3 sm:px-5">Institution Name</th>
              <th className="px-4 py-3">Case ID</th>
              <th className="px-4 py-3">Bureau</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Expected Disposal</th>
              <th className="px-4 py-3 text-right sm:pr-5">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Building className="h-8 w-8 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">No matching cases found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Try clearing or adjusting your search filters.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCases.map((c) => {
                const isOverdue = c.status === 'Overdue';

                return (
                  <tr
                    key={c.id}
                    className="group transition-colors duration-150 hover:bg-blue-50/30"
                  >
                    {/* Institution Name */}
                    <td className="px-4 py-3.5 sm:px-5">
                      <div className="font-semibold text-slate-900 group-hover:text-blue-900 line-clamp-1 max-w-xs sm:max-w-sm">
                        {c.institutionName}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                        <span>Code: {c.institutionCode}</span>
                        <span>•</span>
                        <span>{c.location}</span>
                      </div>
                    </td>

                    {/* Case ID + optional overlap pill */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-mono font-medium text-slate-800">
                        {c.caseNumber}
                      </div>
                      {c.hasOverlapAlert && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-purple-700">
                          <Sparkles className="h-3 w-3 text-purple-600" />
                          <span>Overlap Alert</span>
                        </div>
                      )}
                    </td>

                    {/* Bureau */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          c.bureau === 'PGRC'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {c.bureau}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getStatusBadge(c.status)}
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${getPriorityBadge(
                          c.priority
                        )}`}
                      >
                        {c.priority}
                      </span>
                    </td>

                    {/* Expected Disposal Date */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div
                        className={`font-medium ${
                          isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'
                        }`}
                      >
                        {formatDate(c.expectedDisposalDate)}
                      </div>
                      {isOverdue && (
                        <div className="text-[10px] text-rose-500 font-semibold">
                          SLA Breached
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 text-right sm:pr-5 whitespace-nowrap">
                      <button
                        onClick={() => onViewCase(c)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:border-blue-400 hover:bg-blue-50 hover:text-blue-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        title="View Case Dossier"
                      >
                        <Eye className="h-3.5 w-3.5 text-blue-600" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer info */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs text-slate-500 gap-2">
        <span>
          Showing {filteredCases.length} of {cases.length} priority management records
        </span>
        <span className="text-[11px] text-slate-400">
          Click &quot;View&quot; on any row to open full case dossier and management actions
        </span>
      </div>
    </div>
  );
}
