'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  SendHorizontal,
  FileCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Upload,
  Trash2,
  Search,
  Filter,
  Eye,
  Building2,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { InstitutionSidebar } from '@/components/layout/InstitutionSidebar';
import { NoticeItem, CaseItem } from '@/types/dashboard';
import { useInstitution } from '@/lib/institution-context';
import { formatDate } from '@/lib/utils';
import { fetchComplaints } from '@/lib/complaints-api';

function InstitutionCompliancePageContent() {
  const searchParams = useSearchParams();
  const preselectedNoticeId = searchParams.get('noticeId');
  const preselectedCaseId = searchParams.get('caseId');

  const { activeCode, activeInstitution } = useInstitution();
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [complaints, setComplaints] = useState<CaseItem[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedCaseId, setSelectedCaseId] = useState<string>(preselectedCaseId || '');
  const [selectedNoticeId, setSelectedNoticeId] = useState<string>(preselectedNoticeId || '');
  const [submitterName, setSubmitterName] = useState(activeInstitution.principalName || 'Dr. Principal / Director');
  const [submitterDesignation, setSubmitterDesignation] = useState('Head of Institution');
  const [subject, setSubject] = useState('');
  const [responseText, setResponseText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; type: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Tabs: 'compose' | 'submitted' | 'notices'
  const [activeTab, setActiveTab] = useState<'compose' | 'submitted' | 'notices'>(
    preselectedCaseId || preselectedNoticeId ? 'compose' : 'submitted'
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [notRes, compRes, respRes] = await Promise.all([
        fetch(`/api/notices?institutionCode=${encodeURIComponent(activeCode)}`).then((r) => r.json()),
        fetchComplaints(),
        fetch(`/api/institution/responses?institutionCode=${encodeURIComponent(activeCode)}`).then((r) => r.json()),
      ]);

      if (notRes.success) setNotices(notRes.notices || []);
      setComplaints(compRes.filter((c) => c.institutionCode === activeCode || c.institutionName.toLowerCase() === activeInstitution.name.toLowerCase()));
      if (respRes.success) setResponses(respRes.responses || []);
    } catch (e) {
      console.error('Failed to load compliance data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCode]);

  useEffect(() => {
    if (preselectedCaseId) {
      setSelectedCaseId(preselectedCaseId);
      const match = complaints.find((c) => c.id === preselectedCaseId || c.caseNumber === preselectedCaseId);
      if (match) {
        setSubject(`Compliance Reply - ${match.caseNumber}: ${match.subject}`);
      }
    }
    if (preselectedNoticeId) {
      setSelectedNoticeId(preselectedNoticeId);
    }
  }, [preselectedCaseId, preselectedNoticeId, complaints]);

  // When selectedCaseId changes
  const handleCaseChange = (cId: string) => {
    setSelectedCaseId(cId);
    const match = complaints.find((c) => c.id === cId || c.caseNumber === cId);
    if (match) {
      setSubject(`Official Compliance Response - ${match.caseNumber}`);
    }
  };

  // Add mock proof document
  const handleAddSampleFile = () => {
    const samples = [
      'Fee_Refund_Bank_Transfer_Scroll.pdf',
      'Faculty_Joining_Reports_Certified.pdf',
      'Governing_Body_Resolution_2026.pdf',
      'Structural_Safety_Certificate_PWD.pdf',
    ];
    const file = samples[Math.floor(Math.random() * samples.length)];
    if (!uploadedFiles.some((f) => f.name === file)) {
      setUploadedFiles([...uploadedFiles, { name: file, size: '2.1 MB', type: 'application/pdf' }]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  // Submit response
  const handleSendResponse = async (isDraft: boolean) => {
    if (!responseText.trim() || !subject.trim()) {
      alert('Please fill out both the Subject and Response Rebuttal text.');
      return;
    }

    try {
      setIsSubmitting(true);
      const matchedCase = complaints.find((c) => c.id === selectedCaseId || c.caseNumber === selectedCaseId);
      const matchedNotice = notices.find((n) => n.id === selectedNoticeId || n.noticeNumber === selectedNoticeId);

      const res = await fetch('/api/institution/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: matchedCase?.id || selectedCaseId || null,
          caseNumber: matchedCase?.caseNumber || selectedCaseId || null,
          noticeId: matchedNotice?.id || selectedNoticeId || null,
          noticeNumber: matchedNotice?.noticeNumber || selectedNoticeId || null,
          institutionCode: activeCode,
          institutionName: activeInstitution.name,
          bureau: matchedCase?.bureau || 'PGRC',
          subject,
          responseText,
          supportingDocuments: uploadedFiles,
          submittedByName: submitterName,
          submittedByDesignation: submitterDesignation,
          isDraft,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitSuccess(
          isDraft
            ? 'Response draft saved in local SQLite storage.'
            : 'Official compliance response submitted to AICTE and appended to Case Audit Ledger!'
        );
        setSubject('');
        setResponseText('');
        setUploadedFiles([]);
        loadData();
        setTimeout(() => {
          setActiveTab('submitted');
          setSubmitSuccess(null);
        }, 2200);
      } else {
        alert(data.error || 'Failed to submit response');
      }
    } catch (e: any) {
      alert(e.message || 'Error occurred while saving compliance response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingNoticesCount = notices.filter((n) => n.status !== 'Complied' && n.status !== 'Closed').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <InstitutionSidebar
        activeTab="compliance"
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        badgeCounts={{
          compliance: responses.length,
          notices: pendingNoticesCount,
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
              <span className="font-semibold text-slate-900">Compliance & Responses</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('compose')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
            >
              <SendHorizontal className="h-3.5 w-3.5" />
              <span>Compose Reply</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <SendHorizontal className="h-3.5 w-3.5 text-emerald-600" />
                  Compliance & Rebuttal Workspace
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-slate-500 font-mono">
                  {activeInstitution.name} ({activeInstitution.code})
                </span>
              </div>
              <h1 className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Institutional Compliance Management
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-3xl">
                Compose official rebuttals to regulatory notices, submit documentary evidence, track
                bureau review feedback, and maintain persistent audit proof in SQLite.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-right shadow-xs">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Total Submissions
                </div>
                <div className="text-xl font-bold text-slate-900">{responses.length} Replies</div>
              </div>
            </div>
          </div>

          {/* Navigation Pill Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setActiveTab('submitted')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'submitted'
                  ? 'bg-[#002b5c] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <FileCheck className="h-3.5 w-3.5" />
              <span>Submitted Responses ({responses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('compose')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'compose'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SendHorizontal className="h-3.5 w-3.5" />
              <span>Compose New Response</span>
            </button>

            <button
              onClick={() => setActiveTab('notices')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'notices'
                  ? 'bg-[#002b5c] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span>Active Directives Awaiting Response ({pendingNoticesCount})</span>
            </button>
          </div>

          {/* TAB 1: COMPOSE NEW RESPONSE */}
          {activeTab === 'compose' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">
                  Compose Formal Institutional Compliance Report
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sign and file an official response to an AICTE grievance or regulatory directive.
                </p>
              </div>

              {submitSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Case / Notice Linker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Link to Inward Case Dossier
                    </label>
                    <select
                      value={selectedCaseId}
                      onChange={(e) => handleCaseChange(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select linked case (optional)...</option>
                      {complaints.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.caseNumber} - {c.subject}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Link to Specific Notice / Directive
                    </label>
                    <select
                      value={selectedNoticeId}
                      onChange={(e) => setSelectedNoticeId(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select linked notice (optional)...</option>
                      {notices.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.noticeNumber} - {n.noticeType} ({n.reason})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Submitter Info */}
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
                      Designation
                    </label>
                    <input
                      type="text"
                      value={submitterDesignation}
                      onChange={(e) => setSubmitterDesignation(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Response Subject / Reference Header
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Compliance Report regarding Faculty Pay Scales and Arrears Remittance..."
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Response Paragraph */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Formal Rebuttal, Factual Clarifications & Evidence Summary
                  </label>
                  <textarea
                    rows={8}
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Provide a detailed official statement on behalf of the institution. Include dates of committee meetings, remedial checks, fee transactions, or administrative actions..."
                    className="w-full p-3.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                  />
                </div>

                {/* Attachments */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Certified Supporting Evidence Documents
                    </label>
                    <button
                      type="button"
                      onClick={handleAddSampleFile}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Upload className="h-3 w-3" />
                      <span>Attach Proof File</span>
                    </button>
                  </div>

                  <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50/50 space-y-2">
                    {uploadedFiles.length === 0 ? (
                      <div className="text-center py-4">
                        <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                        <p className="text-xs text-slate-600">No documents attached.</p>
                        <button
                          type="button"
                          onClick={handleAddSampleFile}
                          className="mt-1 text-xs font-semibold text-blue-600 hover:underline"
                        >
                          Attach sample resolution / affidavit PDF
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

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSendResponse(true)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSendResponse(false)}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <SendHorizontal className="h-3.5 w-3.5" />
                    <span>{isSubmitting ? 'Submitting to AICTE...' : 'Submit Official Compliance Reply'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SUBMITTED RESPONSES LIST */}
          {activeTab === 'submitted' && (
            <div className="space-y-4">
              {responses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <h3 className="font-bold text-slate-800 text-sm">No Compliance Responses Filed Yet</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    When {activeInstitution.name} submits an official rebuttal or remedial report,
                    it will be recorded and tracked here with bureau feedback.
                  </p>
                  <button
                    onClick={() => setActiveTab('compose')}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                  >
                    <SendHorizontal className="h-3.5 w-3.5" />
                    <span>Compose First Response</span>
                  </button>
                </div>
              ) : (
                responses.map((resp) => (
                  <motion.div
                    key={resp.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-[#002b5c] bg-slate-100 px-2 py-0.5 rounded">
                          {resp.responseNumber}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            resp.status === 'Accepted' || resp.status === 'Satisfied'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : resp.status === 'Under Review'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : resp.status === 'Draft'
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {resp.status}
                        </span>
                        {resp.caseNumber && (
                          <span className="text-xs font-mono text-slate-500">
                            Linked: {resp.caseNumber}
                          </span>
                        )}
                        {resp.noticeNumber && (
                          <span className="text-xs font-mono text-amber-700">
                            Notice: {resp.noticeNumber}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400">
                        Submitted: {formatDate(resp.submissionDate || resp.createdAt)}
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm">{resp.subject}</h3>
                    <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700 leading-relaxed border border-slate-200/60 whitespace-pre-line">
                      {resp.responseText}
                    </div>

                    {resp.supportingDocuments && resp.supportingDocuments.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Submitted Evidence Documents:
                        </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {resp.supportingDocuments.map((doc: any, i: number) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 border border-slate-200"
                            >
                              <FileText className="h-3 w-3 text-emerald-600" />
                              {doc.name || doc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <div>
                        Signatory: <strong className="text-slate-800">{resp.submittedByName}</strong> ({resp.submittedByDesignation})
                      </div>

                      {resp.bureauFeedback ? (
                        <div className="flex items-center gap-1.5 text-blue-700 font-semibold bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>AICTE Bureau Feedback: {resp.bureauFeedback}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">
                          Awaiting official bureau review & disposal decision
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: NOTICES AWAITING RESPONSE */}
          {activeTab === 'notices' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-xs text-amber-900">
                <span className="font-bold">Active Directives from AICTE:</span> The following notices
                require immediate institutional attention, submission of certified affidavits, or
                rectification compliance.
              </div>

              {notices
                .filter((n) => n.status !== 'Complied' && n.status !== 'Closed')
                .map((n) => (
                  <div
                    key={n.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{n.noticeNumber}</span>
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          {n.noticeType}
                        </span>
                        <span className="text-slate-400 font-mono text-xs">Case: {n.caseNumber}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">{n.reason}</h4>
                      <p className="text-xs text-slate-500">{n.remarks}</p>
                      <div className="text-[11px] text-slate-400">
                        Deadline: <strong className="text-slate-700">{formatDate(n.responseDeadline)}</strong> • Issued By: {n.issuedBy}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedNoticeId(n.id);
                        setSelectedCaseId(n.caseId || n.caseNumber);
                        setSubject(`Compliance Reply - Notice ${n.noticeNumber}: ${n.reason}`);
                        setActiveTab('compose');
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shrink-0 shadow-xs"
                    >
                      <SendHorizontal className="h-3.5 w-3.5" />
                      <span>Draft Response</span>
                    </button>
                  </div>
                ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function InstitutionCompliancePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#002b5c] border-t-transparent" />
        </div>
      }
    >
      <InstitutionCompliancePageContent />
    </Suspense>
  );
}
