'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  User,
  ShieldAlert,
  CopyCheck,
  FileText,
  ExternalLink,
  Gavel,
  Edit3,
  Check,
} from 'lucide-react';
import { CaseItem } from '@/types/dashboard';
import { formatDate } from '@/lib/utils';
import { updateComplaint } from '@/lib/complaints-api';

interface CaseDetailsModalProps {
  selectedCase: CaseItem | null;
  onClose: () => void;
  onViewRelatedCase?: (relatedCaseNumber: string) => void;
  onStatusUpdated?: (updated: CaseItem) => void;
  allowStatusEdit?: boolean;
}

const STATUS_OPTIONS: CaseItem['status'][] = ['Pending', 'Under Process', 'Disposed', 'Overdue'];

export function CaseDetailsModal({
  selectedCase,
  onClose,
  onViewRelatedCase,
  onStatusUpdated,
  allowStatusEdit = true,
}: CaseDetailsModalProps) {
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [statusValue, setStatusValue] = useState<CaseItem['status']>('Pending');
  const [isSaving, setIsSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isSaving]);

  useEffect(() => {
    if (selectedCase) {
      setStatusValue(selectedCase.status);
      setIsEditingStatus(false);
      setStatusError(null);
      setStatusSuccess(false);
    }
  }, [selectedCase]);

  if (!selectedCase) return null;

  const isOverdue = selectedCase.status === 'Overdue';

  const getPriorityBadge = (priority: CaseItem['priority']) => {
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

  const getStatusBadge = (status: CaseItem['status']) => {
    switch (status) {
      case 'Overdue':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Under Process':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Disposed':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/70 p-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold text-sm text-slate-900">
                  {selectedCase.caseNumber}
                </span>
                {!isEditingStatus ? (
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getStatusBadge(
                      statusValue
                    )}`}
                  >
                    {statusValue}
                  </span>
                ) : (
                  <select
                    value={statusValue}
                    onChange={(e) => setStatusValue(e.target.value as CaseItem['status'])}
                    disabled={isSaving}
                    className="rounded-md border border-slate-300 px-2 py-0.5 text-[11px] font-semibold"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                )}
                {allowStatusEdit && !isEditingStatus && (
                  <button
                    onClick={() => {
                      setStatusValue(selectedCase.status);
                      setIsEditingStatus(true);
                      setStatusError(null);
                      setStatusSuccess(false);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Edit3 className="h-3 w-3" />
                    Edit Status
                  </button>
                )}
                {isEditingStatus && (
                  <div className="flex items-center gap-1">
                    <button
                      disabled={isSaving}
                      onClick={async () => {
                        setIsSaving(true);
                        setStatusError(null);
                        setStatusSuccess(false);
                        try {
                          const updated = await updateComplaint(selectedCase.id, { status: statusValue });
                          setStatusSuccess(true);
                          onStatusUpdated?.(updated);
                          setTimeout(() => setIsEditingStatus(false), 600);
                        } catch (err: any) {
                          setStatusError(err?.message || 'Failed to update status');
                        } finally {
                          setIsSaving(false);
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-md bg-[#003366] px-2 py-0.5 text-[10px] font-semibold text-white disabled:opacity-60"
                    >
                      <Check className="h-3 w-3" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      disabled={isSaving}
                      onClick={() => {
                        setStatusValue(selectedCase.status);
                        setIsEditingStatus(false);
                        setStatusError(null);
                        setStatusSuccess(false);
                      }}
                      className="rounded-md border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${getPriorityBadge(
                    selectedCase.priority
                  )}`}
                >
                  {selectedCase.priority} Priority
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                    selectedCase.bureau === 'PGRC'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedCase.bureau}
                </span>
              </div>
              {(statusError || statusSuccess) && (
                <div className="mt-1 text-[10px]">
                  {statusError && <span className="text-rose-600">{statusError}</span>}
                  {statusSuccess && <span className="text-emerald-600">Status updated successfully</span>}
                </div>
              )}
              <h2 className="mt-1.5 font-bold text-base text-slate-900 leading-snug">
                {selectedCase.institutionName}
              </h2>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>Code: {selectedCase.institutionCode}</span>
                <span>•</span>
                <span>{selectedCase.location}</span>
                <span>•</span>
                <span className="font-medium text-slate-700">
                  Region: {selectedCase.region}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 space-y-5 max-h-[72vh] overflow-y-auto">
            {/* Overlap Detection Banner (if flagged) */}
            {selectedCase.hasOverlapAlert && selectedCase.overlapDetails && (
              <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-white shadow-xs">
                    <CopyCheck className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-purple-900 text-xs uppercase tracking-wider">
                        Cross-Bureau Overlap Flagged ({selectedCase.overlapDetails.matchScore}% Match)
                      </span>
                      <span className="rounded-full bg-purple-200/80 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                        PGRC ⟷ Regulation Bureau
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-purple-950 font-medium leading-relaxed">
                      {selectedCase.overlapDetails.reason}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between border-t border-purple-200/60 pt-2 text-xs">
                      <span className="text-purple-800">
                        Correlated Case:{' '}
                        <span className="font-mono font-bold text-purple-950">
                          {selectedCase.overlapDetails.overlapCaseId}
                        </span>{' '}
                        ({selectedCase.overlapDetails.overlapBureau})
                      </span>
                      {onViewRelatedCase && (
                        <button
                          onClick={() =>
                            onViewRelatedCase(selectedCase.overlapDetails!.overlapCaseId)
                          }
                          className="flex items-center gap-1 font-semibold text-purple-900 hover:underline"
                        >
                          View Linked Case <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLA & Timeline Status Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Logged On</span>
                <div className="mt-0.5 font-semibold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  {formatDate(selectedCase.submissionDate)}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Expected Disposal</span>
                <div
                  className={`mt-0.5 font-semibold flex items-center gap-1.5 ${
                    isOverdue ? 'text-rose-600' : 'text-slate-800'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {formatDate(selectedCase.expectedDisposalDate)}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Complainant Group</span>
                <div className="mt-0.5 font-semibold text-slate-800 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-blue-600" />
                  {selectedCase.complainantType} Grievance
                </div>
              </div>
            </div>

            {/* Subject & Category */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Grievance Subject & Category
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-md bg-slate-100 px-2.5 py-1 font-semibold text-xs text-slate-700">
                  {selectedCase.category}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-800 leading-normal">
                {selectedCase.subject}
              </p>
            </div>

            {/* Summary Dossier */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Case Summary & Findings
              </span>
              <div className="mt-1.5 rounded-xl border border-slate-200 bg-white p-3.5 text-xs leading-relaxed text-slate-700">
                {selectedCase.summary}
              </div>
            </div>

            {/* Assigned Investigating Officer */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Supervising Officer
                  </span>
                  <div className="font-semibold text-xs text-slate-900">
                    {selectedCase.assignedOfficer}
                  </div>
                </div>
              </div>
              <div className="text-right text-[11px] text-slate-500">
                <span>Last Updated:</span>
                <div className="font-medium text-slate-700">
                  {formatDate(selectedCase.lastUpdated)}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  alert(
                    `Action Triggered: Show-Cause Notice drafted for ${selectedCase.institutionName} under AICTE Approval Regulations.`
                  );
                }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-xs text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                Show-Cause Notice
              </button>
              <button
                onClick={() => {
                  alert(
                    `Action Triggered: Virtual Scrutiny Committee hearing scheduled for Case ${selectedCase.caseNumber}.`
                  );
                }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-xs text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <Gavel className="h-3.5 w-3.5 text-slate-500" />
                Summon Hearing
              </button>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg bg-[#003366] px-4 py-1.5 font-semibold text-xs text-white shadow-xs hover:bg-blue-900 transition-colors"
            >
              Close Dossier
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
