'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  FolderKanban,
  ArrowLeft,
  Calendar,
  Clock,
  ShieldAlert,
  SendHorizontal,
  Lock,
  Building2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Download,
  Trash2,
  History,
  FileCheck,
  User,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { InstitutionSidebar } from '@/components/layout/InstitutionSidebar';
import { CaseItem, NoticeItem } from '@/types/dashboard';
import { useInstitution } from '@/lib/institution-context';
import { formatDate } from '@/lib/utils';
import { fetchComplaintById, fetchComplaints } from '@/lib/complaints-api';

function InstitutionCaseDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const caseId = params?.caseId as string;
  const { activeCode, activeInstitution } = useInstitution();

  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [caseData, setCaseData] = useState<CaseItem | null>(null);
  const [caseHistory, setCaseHistory] = useState<any[]>([]);
  const [caseNotices, setCaseNotices] = useState<NoticeItem[]>([]);
  const [previousResponses, setPreviousResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'response' | 'history'>('details');

  // Response Form State
  const [submitterName, setSubmitterName] = useState(activeInstitution.principalName || 'Dr. Principal / Director');
  const [submitterDesignation, setSubmitterDesignation] = useState('Head of Institution');
  const [responseSubject, setResponseSubject] = useState('');
  const [responseText, setResponseText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; type: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  const loadCaseFull = async () => {
    try {
      setLoading(true);
      // Fetch complaint
      let fetched = await fetchComplaintById(caseId);
      if (!fetched) {
        // Fallback: search in complaints list by caseNumber or ID
        const all = await fetchComplaints();
        fetched = all.find((c) => c.id === caseId || c.caseNumber === caseId) || null;
      }

      setCaseData(fetched);

      if (fetched) {
        // Default response subject
        setResponseSubject(`Institutional Rebuttal & Compliance Clarification - ${fetched.caseNumber}`);

        // Fetch case history
        try {
          const histRes = await fetch(`/api/case-history?caseId=${encodeURIComponent(fetched.id)}`);
          const histData = await histRes.json();
          setCaseHistory(histData.history || []);
        } catch {}

        // Fetch notices for this case
        try {
          const notRes = await fetch(`/api/notices?institutionCode=${encodeURIComponent(activeCode)}`);
          const notData = await notRes.json();
          if (notData.success) {
            const matched = (notData.notices || []).filter(
              (n: NoticeItem) => n.caseId === fetched?.id || n.caseNumber === fetched?.caseNumber
            );
            setCaseNotices(matched);
          }
        } catch {}

        // Fetch previous responses for this case
        try {
          const respRes = await fetch(`/api/institution/responses?caseId=${encodeURIComponent(fetched.id)}`);
          const respData = await respRes.json();
          if (respData.success) {
            setPreviousResponses(respData.responses || []);
          }
        } catch {}
      }
    } catch (e) {
      console.error('Failed to load case full details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) {
      loadCaseFull();
    }
  }, [caseId, activeCode]);

  // Handle file mock upload
  const handleAddSampleFile = (type: 'pdf' | 'doc') => {
    const sampleNames = [
      'Affidavit_of_Compliance_2026.pdf',
      'Faculty_Pay_Register_Certified.pdf',
      'Audited_Fee_Structure_Resolution.pdf',
      'Building_Fire_Safety_NOC_Renewal.pdf',
    ];
    const randName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    if (!uploadedFiles.some((f) => f.name === randName)) {
      setUploadedFiles([...uploadedFiles, { name: randName, size: '2.4 MB', type: 'application/pdf' }]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  // Submit response
  const handleSubmitResponse = async (isDraft: boolean) => {
    if (!caseData) return;
    if (!responseText.trim()) {
      alert('Please provide your official response or rebuttal text.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/institution/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: caseData.id,
          caseNumber: caseData.caseNumber,
          institutionCode: activeCode,
          institutionName: activeInstitution.name,
          bureau: caseData.bureau,
          subject: responseSubject || `Institutional Response - ${caseData.caseNumber}`,
          responseText,
          supportingDocuments: uploadedFiles,
          submittedByName: submitterName,
          submittedByDesignation: submitterDesignation,
          isDraft,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmissionSuccess(
          isDraft
            ? 'Draft response saved successfully.'
            : 'Official response submitted successfully and logged into AICTE Case History!'
        );
        setResponseText('');
        setUploadedFiles([]);
        // Refresh history and responses
        loadCaseFull();
        setTimeout(() => {
          setActiveTab('history');
          setSubmissionSuccess(null);
        }, 2000);
      } else {
        alert(data.error || 'Failed to submit response');
      }
    } catch (e: any) {
      alert(e.message || 'Error submitting response');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#002b5c] border-t-transparent mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading institutional dossier...</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 text-center border border-slate-200 shadow-md space-y-4">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Case Dossier Not Found</h2>
          <p className="text-xs text-slate-500">
            The requested case ID <span className="font-mono text-slate-800">{caseId}</span> does not
            exist or is not affiliated with {activeInstitution.name}.
          </p>
          <Link
            href="/institution-dashboard/cases"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#002b5c] text-white rounded-lg text-xs font-semibold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Case Dossiers</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <InstitutionSidebar
        activeTab="cases"
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/institution-dashboard/cases"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
              title="Back to Cases"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Link href="/institution-dashboard" className="text-slate-500 hover:text-slate-800">
                Institution
              </Link>
              <span className="text-slate-400">/</span>
              <Link href="/institution-dashboard/cases" className="text-slate-500 hover:text-slate-800">
                Cases
              </Link>
              <span className="text-slate-400">/</span>
              <span className="font-mono font-bold text-slate-900">{caseData.caseNumber}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                caseData.status === 'Disposed'
                  ? 'bg-emerald-100 text-emerald-800'
                  : caseData.status === 'Pending'
                  ? 'bg-amber-100 text-amber-800'
                  : caseData.status === 'Overdue'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {caseData.status}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Strict Read-Only Security Guard Notice */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 flex items-start gap-3 shadow-2xs">
            <Lock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-blue-950 flex items-center gap-2">
                <span>Statutory AICTE File: Institutional View Mode</span>
                <span className="text-[10px] bg-blue-200/80 text-blue-900 px-2 py-0.5 rounded-full font-mono font-semibold">
                  AUDITED
                </span>
              </div>
              <p className="text-blue-800 leading-relaxed">
                As an accredited institution, your access allows reviewing formal grievance allegations,
                inspecting committee directives, reviewing official audit trails, and submitting institutional
                evidence/rebuttals. Official status determinations remain strictly under the jurisdiction of AICTE
                officers.
              </p>
            </div>
          </div>

          {/* Case Main Header Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-extrabold text-[#002b5c] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                    {caseData.caseNumber}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      caseData.bureau === 'PGRC'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {caseData.bureau}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                    {caseData.category}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      caseData.priority === 'Critical'
                        ? 'bg-rose-100 text-rose-800'
                        : caseData.priority === 'High'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {caseData.priority} Priority
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {caseData.subject}
                </h1>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                  <span>Received On: <strong className="text-slate-700">{formatDate(caseData.submissionDate)}</strong></span>
                  <span>•</span>
                  <span>Response Due: <strong className="text-slate-700">{formatDate(caseData.expectedDisposalDate)}</strong></span>
                  <span>•</span>
                  <span>Assigned Officer: <strong className="text-slate-700">{caseData.assignedOfficer}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setActiveTab('response')}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors"
                >
                  <SendHorizontal className="h-4 w-4" />
                  <span>Submit Institutional Response</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs within Case Dossier */}
            <div className="flex items-center gap-2 border-t border-slate-100 pt-4 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'details'
                    ? 'bg-[#002b5c] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Grievance Dossier & Allegations
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'timeline'
                    ? 'bg-[#002b5c] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <History className="h-3.5 w-3.5" />
                <span>Audit Timeline ({caseHistory.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('response')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'response'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <SendHorizontal className="h-3.5 w-3.5" />
                <span>Submit Response</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'bg-[#002b5c] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileCheck className="h-3.5 w-3.5" />
                <span>Submitted Replies ({previousResponses.length})</span>
              </button>
            </div>
          </div>

          {/* TAB 1: DETAILS & ALLEGATIONS */}
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Description & Statutory Directives */}
              <div className="lg:col-span-2 space-y-6">
                {/* Full Allegation Summary */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>Official Grievance Statement / Inward Allegation</span>
                  </h3>
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                    {caseData.summary || 'No detailed statement recorded.'}
                  </div>
                </div>

                {/* Statutory Directives Issued For This Case */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                    <span>Statutory Directives & Formal Notices for this Case</span>
                  </h3>
                  {caseNotices.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3">
                      No separate formal show-cause notices have been issued for this case number.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {caseNotices.map((n) => (
                        <div
                          key={n.id}
                          className="rounded-lg border border-amber-200 bg-amber-50/40 p-4 text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-slate-900">{n.noticeNumber}</span>
                            <span className="font-bold text-amber-800">{n.noticeType}</span>
                          </div>
                          <p className="font-semibold text-slate-800">{n.reason}</p>
                          {n.remarks && <p className="text-slate-600">{n.remarks}</p>}
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-amber-200/60">
                            <span>Issued By: {n.issuedBy}</span>
                            <span>Deadline: {formatDate(n.responseDeadline)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Evidence & Case Attachments */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Download className="h-4 w-4 text-emerald-600" />
                    <span>Bureau Records & Official Attachments</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-4 w-4 text-rose-600 shrink-0" />
                        <div className="truncate">
                          <div className="text-xs font-semibold text-slate-800 truncate">
                            AICTE_Inward_Complaint_Record.pdf
                          </div>
                          <div className="text-[10px] text-slate-400">1.8 MB • Certified Copy</div>
                        </div>
                      </div>
                      <button
                        onClick={() => alert('Downloading official encrypted case document')}
                        className="p-1.5 hover:bg-slate-200 text-slate-600 rounded"
                        title="Download"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                        <div className="truncate">
                          <div className="text-xs font-semibold text-slate-800 truncate">
                            Statutory_Hearing_Notice.pdf
                          </div>
                          <div className="text-[10px] text-slate-400">420 KB • Bureau Order</div>
                        </div>
                      </div>
                      <button
                        onClick={() => alert('Downloading statutory notice document')}
                        className="p-1.5 hover:bg-slate-200 text-slate-600 rounded"
                        title="Download"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Col: Complainant Privacy & Metadata */}
              <div className="space-y-6">
                {/* Complainant Privacy Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-slate-600" />
                    <span>Complainant Disclosure</span>
                  </h3>
                  <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200 text-xs space-y-2">
                    <div>
                      <div className="text-[10px] text-amber-800 uppercase font-bold tracking-wider">
                        Complainant Category
                      </div>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">
                        {caseData.complainantType || 'Student / Citizen'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-amber-800 uppercase font-bold tracking-wider">
                        Personal Identification
                      </div>
                      <div className="text-[11px] font-mono text-slate-600 bg-white/70 p-2 rounded border border-amber-200/60 mt-0.5">
                        [PROTECTED UNDER AICTE STATUTORY WHISTLEBLOWER & PRIVACY RULES]
                      </div>
                    </div>
                  </div>
                </div>

                {/* Case Parameters */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">Case Metadata</h3>
                  <dl className="text-xs space-y-2.5 divide-y divide-slate-100">
                    <div className="pt-1 flex justify-between">
                      <dt className="text-slate-500">Institution Code</dt>
                      <dd className="font-mono font-bold text-slate-800">{caseData.institutionCode}</dd>
                    </div>
                    <div className="pt-2 flex justify-between">
                      <dt className="text-slate-500">Region</dt>
                      <dd className="font-semibold text-slate-800">{caseData.region}</dd>
                    </div>
                    <div className="pt-2 flex justify-between">
                      <dt className="text-slate-500">Bureau Jurisdiction</dt>
                      <dd className="font-semibold text-slate-800">{caseData.bureau}</dd>
                    </div>
                    <div className="pt-2 flex justify-between">
                      <dt className="text-slate-500">Last System Update</dt>
                      <dd className="font-semibold text-slate-800">{caseData.lastUpdated}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIT TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Official Chronological Audit Trail</h3>
                  <p className="text-xs text-slate-500">
                    Immutable event log persisted in SQLite case_history
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-400">
                  {caseHistory.length} Recorded Entries
                </span>
              </div>

              {caseHistory.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No chronological history records logged yet for this case.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {caseHistory.map((item, idx) => (
                    <div key={item.id || idx} className="relative group">
                      <div className="absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow-xs" />
                      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs space-y-1 hover:bg-slate-50 transition-colors">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-slate-900">{item.action}</span>
                          <span className="text-[11px] text-slate-400">
                            {formatDate(item.createdAt || item.timestamp)}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{item.details || item.remarks}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                          <span>Logged by:</span>
                          <strong className="text-slate-800">{item.actorName || 'System'}</strong>
                          <span>({item.actorRole || 'Official'})</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SUBMIT RESPONSE FORM */}
          {activeTab === 'response' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">
                  Official Institutional Response & Rebuttal Submission
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your formal response will be signed with institutional credentials, persisted to
                  the central AICTE database, and appended directly into the case audit trail.
                </p>
              </div>

              {submissionSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>{submissionSuccess}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Authorized Submitter Name
                    </label>
                    <input
                      type="text"
                      value={submitterName}
                      onChange={(e) => setSubmitterName(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Authorized Designation
                    </label>
                    <input
                      type="text"
                      value={submitterDesignation}
                      onChange={(e) => setSubmitterDesignation(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Response Subject / Reference Header
                  </label>
                  <input
                    type="text"
                    value={responseSubject}
                    onChange={(e) => setResponseSubject(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Rebuttal, Factual Clarification & Remedial Actions Taken
                  </label>
                  <textarea
                    rows={6}
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Provide a comprehensive paragraph explaining the institution's position, committee resolutions, fee refunds remitted, or infrastructure improvements implemented..."
                    className="w-full p-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                  />
                </div>

                {/* File Upload Simulator */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Supporting Evidence & Document Uploads
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAddSampleFile('pdf')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Upload className="h-3 w-3" />
                      <span>Attach Proof Document</span>
                    </button>
                  </div>

                  <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50/50 space-y-2">
                    {uploadedFiles.length === 0 ? (
                      <div className="text-center py-4">
                        <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                        <p className="text-xs text-slate-600">No documents attached yet.</p>
                        <button
                          type="button"
                          onClick={() => handleAddSampleFile('pdf')}
                          className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
                        >
                          Click to attach sample affidavit / compliance report
                        </button>
                      </div>
                    ) : (
                      uploadedFiles.map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-emerald-600" />
                            <span className="font-semibold text-slate-800">{file.name}</span>
                            <span className="text-[10px] text-slate-400">({file.size})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(i)}
                            className="text-rose-600 hover:text-rose-800 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSubmitResponse(true)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSubmitResponse(false)}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <SendHorizontal className="h-3.5 w-3.5" />
                    <span>{isSubmitting ? 'Submitting to AICTE...' : 'Submit Official Rebuttal'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PREVIOUS RESPONSES */}
          {activeTab === 'history' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Submitted Institutional Responses
                  </h3>
                  <p className="text-xs text-slate-500">
                    Replies filed by {activeInstitution.name} for Case #{caseData.caseNumber}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('response')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                >
                  <SendHorizontal className="h-3.5 w-3.5" />
                  <span>File Another Response</span>
                </button>
              </div>

              {previousResponses.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No responses submitted yet for this case. Click &ldquo;Submit Response&rdquo; to file your
                  official explanation.
                </div>
              ) : (
                <div className="space-y-4">
                  {previousResponses.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 text-xs space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{r.responseNumber}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              r.status === 'Submitted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.status === 'Draft'
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>
                        <span className="text-slate-400 text-[11px]">
                          Filed: {formatDate(r.submissionDate || r.createdAt)}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm">{r.subject}</h4>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                        {r.responseText}
                      </p>

                      {r.supportingDocuments && r.supportingDocuments.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60">
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            Attached Evidence:
                          </span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {r.supportingDocuments.map((doc: any, i: number) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-[11px] font-medium border border-slate-200 text-slate-700"
                              >
                                <FileText className="h-3 w-3 text-emerald-600" />
                                {doc.name || doc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                        <span>
                          Submitter: <strong>{r.submittedByName}</strong> ({r.submittedByDesignation})
                        </span>
                        {r.bureauFeedback ? (
                          <span className="text-blue-700 font-semibold">
                            Bureau Remark: {r.bureauFeedback}
                          </span>
                        ) : (
                          <span className="text-slate-400">Awaiting Bureau Assessment</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function InstitutionCaseDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#002b5c] border-t-transparent" />
        </div>
      }
    >
      <InstitutionCaseDetailPageContent />
    </Suspense>
  );
}
