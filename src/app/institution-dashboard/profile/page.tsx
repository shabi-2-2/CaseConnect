'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Building2,
  Lock,
  Mail,
  Phone,
  Globe,
  MapPin,
  CheckCircle2,
  Save,
  AlertTriangle,
  FileText,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { InstitutionSidebar } from '@/components/layout/InstitutionSidebar';
import { useInstitution } from '@/lib/institution-context';
import { formatDate } from '@/lib/utils';
import { fetchComplaints } from '@/lib/complaints-api';

export default function InstitutionProfilePage() {
  const { activeCode, activeInstitution, refreshProfile } = useInstitution();
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Form State
  const [principalName, setPrincipalName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [nodalOfficerName, setNodalOfficerName] = useState('');
  const [nodalOfficerEmail, setNodalOfficerEmail] = useState('');
  const [nodalOfficerPhone, setNodalOfficerPhone] = useState('');
  const [website, setWebsite] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Linked Activity
  const [casesCount, setCasesCount] = useState(0);
  const [noticesCount, setNoticesCount] = useState(0);

  useEffect(() => {
    // Populate form with current activeInstitution
    setPrincipalName(activeInstitution.principalName || '');
    setContactEmail(activeInstitution.contactEmail || '');
    setContactPhone(activeInstitution.contactPhone || '');
    setNodalOfficerName(activeInstitution.nodalOfficerName || '');
    setNodalOfficerEmail(activeInstitution.nodalOfficerEmail || '');
    setNodalOfficerPhone(activeInstitution.nodalOfficerPhone || '');
    setWebsite(activeInstitution.website || '');
  }, [activeInstitution]);

  useEffect(() => {
    // Fetch stats
    Promise.all([
      fetchComplaints(),
      fetch(`/api/notices?institutionCode=${encodeURIComponent(activeCode)}`).then((r) => r.json()),
    ]).then(([cases, noticesData]) => {
      const myCases = cases.filter(
        (c) =>
          c.institutionCode === activeCode ||
          c.institutionName.toLowerCase() === activeInstitution.name.toLowerCase()
      );
      setCasesCount(myCases.length);
      if (noticesData.success) {
        setNoticesCount((noticesData.notices || []).length);
      }
    });
  }, [activeCode, activeInstitution.name]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const res = await fetch('/api/institution/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: activeCode,
          principalName,
          contactEmail,
          contactPhone,
          nodalOfficerName,
          nodalOfficerEmail,
          nodalOfficerPhone,
          website,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccess('Institution profile and Nodal Officer details successfully saved in SQLite.');
        await refreshProfile();
        setTimeout(() => setSaveSuccess(null), 3500);
      } else {
        setSaveError(data.error || 'Failed to update profile');
      }
    } catch (err: any) {
      setSaveError(err.message || 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <InstitutionSidebar
        activeTab="profile"
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
              <span className="font-semibold text-slate-900">Campus Profile & Nodal Officer</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Statutory Profile & Directory
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-slate-500 font-mono">
                  Permanent AICTE ID: {activeInstitution.code}
                </span>
              </div>
              <h1 className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Campus Profile & Nodal Officer Registry
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-3xl">
                Official AICTE Approval records and verified administrative contact points. Changes to
                Nodal Officer details are synced with central AICTE communications and notification dispatches.
              </p>
            </div>
          </div>

          {/* Feedback alerts */}
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-2xs"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span className="font-medium">{saveSuccess}</span>
            </motion.div>
          )}

          {saveError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Grid Layout: Left (Verified Read-Only Details), Right (Editable Contact & Nodal Form) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 1 Col: Verified Institutional Records (Read-Only) */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Verified AICTE Approval</span>
                  </h3>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded flex items-center gap-1">
                    <Lock className="h-2.5 w-2.5" />
                    Read-Only
                  </span>
                </div>

                <dl className="text-xs space-y-3">
                  <div>
                    <dt className="text-slate-400 font-medium">Permanent AICTE ID</dt>
                    <dd className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                      {activeInstitution.code}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 font-medium">Approved Institution Name</dt>
                    <dd className="font-bold text-slate-900 mt-0.5">{activeInstitution.name}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 font-medium">Institution Category / Type</dt>
                    <dd className="font-semibold text-slate-800 mt-0.5">{activeInstitution.type}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 font-medium">Regional Jurisdiction</dt>
                    <dd className="font-semibold text-slate-800 mt-0.5">
                      {activeInstitution.region} Regional Office (AICTE)
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 font-medium">State & District</dt>
                    <dd className="font-semibold text-slate-800 mt-0.5">
                      {activeInstitution.district}, {activeInstitution.state}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 font-medium">Campus Physical Address</dt>
                    <dd className="text-slate-700 mt-0.5 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                      {activeInstitution.address}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Linked Activity Dossier */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Active Dossier Summary</h3>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="text-xl font-bold text-blue-900">{casesCount}</div>
                    <div className="text-[10px] text-blue-700 font-semibold mt-0.5">Linked Cases</div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <div className="text-xl font-bold text-amber-900">{noticesCount}</div>
                    <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Formal Notices</div>
                  </div>
                </div>
                <Link
                  href="/institution-dashboard/cases"
                  className="w-full text-center py-2 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center justify-center gap-1"
                >
                  <span>View All Grievance Files</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Right 2 Cols: Editable Contact & Grievance Nodal Officer */}
            <div className="lg:col-span-2">
              <form
                onSubmit={handleSaveProfile}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6"
              >
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-900">
                    Authorized Contact & Grievance Nodal Officer
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Maintain up-to-date contact information for statutory compliance notices and
                    public grievance alerts.
                  </p>
                </div>

                {/* Section 1: Head of Institution (Principal / Director) */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Head of Institution (Principal / Director)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Principal / Director Name
                      </label>
                      <input
                        type="text"
                        value={principalName}
                        onChange={(e) => setPrincipalName(e.target.value)}
                        required
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Official Contact Email
                      </label>
                      <div className="relative">
                        <Mail className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          required
                          className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Official Telephone / Mobile
                      </label>
                      <div className="relative">
                        <Phone className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Institutional Website
                      </label>
                      <div className="relative">
                        <Globe className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://example.edu.in"
                          className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Designated Grievance Nodal Officer */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Designated Grievance Redressal Nodal Officer
                    </h4>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                      AICTE Reg. 2019 Mandate
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nodal Officer Full Name & Faculty Designation
                    </label>
                    <input
                      type="text"
                      value={nodalOfficerName}
                      onChange={(e) => setNodalOfficerName(e.target.value)}
                      placeholder="e.g., Dr. Ramesh Chandra (Dean Academics & Head PGRC)"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nodal Officer Email Address
                      </label>
                      <div className="relative">
                        <Mail className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={nodalOfficerEmail}
                          onChange={(e) => setNodalOfficerEmail(e.target.value)}
                          placeholder="nodal.grievance@college.edu.in"
                          className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nodal Officer Mobile / Direct Line
                      </label>
                      <div className="relative">
                        <Phone className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={nodalOfficerPhone}
                          onChange={(e) => setNodalOfficerPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-[#002b5c] hover:bg-[#001f3f] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{isSaving ? 'Saving to Database...' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
