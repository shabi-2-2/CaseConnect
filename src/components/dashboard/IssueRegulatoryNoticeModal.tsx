'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Scale,
  Calendar,
  AlertTriangle,
  FileText,
  Send,
  Building2,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { CaseItem } from '@/types/dashboard';

interface IssueRegulatoryNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  rbCases: CaseItem[];
  preselectedCaseId?: string;
  onNoticeIssued?: () => void;
}

const NOTICE_TYPES = [
  'Show Cause Notice',
  'Compliance Directive',
  'Defect Rectification Order',
  'Physical Inspection Notice',
  'Hearing Summons',
  'Statutory Warning Advisory',
];

export function IssueRegulatoryNoticeModal({
  isOpen,
  onClose,
  rbCases,
  preselectedCaseId,
  onNoticeIssued,
}: IssueRegulatoryNoticeModalProps) {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [noticeType, setNoticeType] = useState<string>(NOTICE_TYPES[0]);
  const [reason, setReason] = useState<string>('');
  const [noticeDate, setNoticeDate] = useState<string>('');
  const [responseDeadline, setResponseDeadline] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [supportingDocs, setSupportingDocs] = useState<string>('');
  const [issuedBy, setIssuedBy] = useState<string>('Er. Sandeep Mukherjee, Director (Regulation)');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<any | null>(null);

  // Initialize dates and preselection
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessNotice(null);

      const today = new Date().toISOString().split('T')[0];
      setNoticeDate(today);

      // Default deadline: +15 days
      const d = new Date();
      d.setDate(d.getDate() + 15);
      setResponseDeadline(d.toISOString().split('T')[0]);

      if (preselectedCaseId && rbCases.some((c) => c.id === preselectedCaseId)) {
        setSelectedCaseId(preselectedCaseId);
      } else if (rbCases.length > 0) {
        setSelectedCaseId(rbCases[0].id);
      }
    }
  }, [isOpen, preselectedCaseId, rbCases]);

  const activeCase = rbCases.find((c) => c.id === selectedCaseId);

  // Quick deadline setter helper
  const setQuickDeadline = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setResponseDeadline(d.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId || !activeCase) {
      setError('Please select a valid regulatory case.');
      return;
    }
    if (!reason.trim()) {
      setError('Please enter the statutory violation reason.');
      return;
    }
    if (!responseDeadline) {
      setError('Please specify a mandatory response deadline.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: activeCase.id,
          caseNumber: activeCase.caseNumber,
          institutionName: activeCase.institutionName,
          institutionCode: activeCase.institutionCode,
          noticeType,
          reason: reason.trim(),
          noticeDate,
          responseDeadline,
          remarks: remarks.trim(),
          supportingDocs: supportingDocs.trim(),
          issuedBy,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to issue notice');
      }

      const result = await res.json();
      setSuccessNotice(result.notice);

      if (onNoticeIssued) {
        onNoticeIssued();
      }
    } catch (err: any) {
      setError(err?.message || 'Error occurred while issuing regulatory notice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-[#002b5c] px-6 py-4 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-amber-300">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight">Issue Official Regulatory Notice</h2>
                <p className="text-xs text-white/70">
                  AICTE Regulation Bureau • Statutory Enforcement Framework
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Success State */}
          {successNotice ? (
            <div className="p-8 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Regulatory Notice Successfully Issued
              </h3>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-left max-w-lg mx-auto text-xs space-y-2 text-emerald-950 font-sans">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Notice Number:</span>
                  <span className="font-mono font-bold text-slate-900">{successNotice.noticeNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Notice Type:</span>
                  <span className="font-semibold text-slate-900">{successNotice.noticeType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Target Institution:</span>
                  <span className="font-semibold text-slate-900">{successNotice.institutionName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Response Deadline:</span>
                  <span className="font-bold text-rose-600">{successNotice.responseDeadline}</span>
                </div>
                <div className="border-t border-emerald-200/60 pt-2 text-[11px] text-emerald-800">
                  Notice has been recorded in the case docket and appended to the permanent audit trail.
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="rounded-lg bg-[#002b5c] px-5 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 transition"
                >
                  Return to Enforcement Docket
                </button>
              </div>
            </div>
          ) : (
            /* Main Form */
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Linked Case Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Regulatory Case &amp; Institution <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  {rbCases.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.caseNumber}] {c.institutionName} ({c.institutionCode}) — {c.category}
                    </option>
                  ))}
                </select>
                {activeCase && (
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-md border border-slate-200/60">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      <strong>Location:</strong> {activeCase.location} • <strong>Status:</strong> {activeCase.status} •{' '}
                      <strong>Assigned:</strong> {activeCase.assignedOfficer}
                    </span>
                  </div>
                )}
              </div>

              {/* Notice Type & Issuer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notice Classification <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={noticeType}
                    onChange={(e) => setNoticeType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    required
                  >
                    {NOTICE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Issuing Authority
                  </label>
                  <input
                    type="text"
                    value={issuedBy}
                    onChange={(e) => setIssuedBy(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Violation Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Statutory Deficiency / Infraction Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Cite specific clauses of AICTE Approval Process Handbook (APH), inspection committee observations, or unapproved infrastructure findings..."
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              {/* Dates & Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notice Issue Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="date"
                      value={noticeDate}
                      onChange={(e) => setNoticeDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Response Deadline <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setQuickDeadline(7)}
                        className="rounded px-1.5 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        +7d
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickDeadline(15)}
                        className="rounded px-1.5 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        +15d
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickDeadline(30)}
                        className="rounded px-1.5 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        +30d
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="date"
                      value={responseDeadline}
                      onChange={(e) => setResponseDeadline(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Supporting Evidence / Documents */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supporting Documents &amp; Reference Audit Codes
                </label>
                <input
                  type="text"
                  value={supportingDocs}
                  onChange={(e) => setSupportingDocs(e.target.value)}
                  placeholder="e.g. Expert Visiting Committee (EVC) Report #04/2026; Geospatial Land Survey #991"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enforcement Remarks &amp; Hearing Instructions
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. In-person representation permitted before Appellate Committee on 10 Nov 2026."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#002b5c] px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSubmitting ? 'Recording Notice...' : 'Issue Regulatory Notice'}</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
