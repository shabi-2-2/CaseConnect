'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Users,
  Scale,
  Building2,
  ArrowRight,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck2,
  Sparkles,
  Layers,
  Eye,
  EyeOff,
} from 'lucide-react';

interface RoleConfig {
  id: string;
  name: string;
  badge: string;
  description: string;
  route: string;
  icon: React.ElementType;
  demoEmail: string;
  colorScheme: {
    border: string;
    bgHover: string;
    iconBg: string;
    iconText: string;
    buttonBg: string;
    badgeBg: string;
    badgeText: string;
  };
  highlights: string[];
}

const ROLES: RoleConfig[] = [
  {
    id: 'management',
    name: 'Senior Management',
    badge: 'Executive Oversight',
    description:
      'Monitor overall complaints, institutional performance, overlap alerts, and reports.',
    route: '/management',
    icon: ShieldCheck,
    demoEmail: 'director.pgrc@aicte-india.org',
    colorScheme: {
      border: 'hover:border-blue-400 group-hover:border-blue-400',
      bgHover: 'hover:bg-blue-50/30',
      iconBg: 'bg-blue-50 border-blue-200',
      iconText: 'text-blue-700',
      buttonBg: 'bg-[#003366] hover:bg-blue-900',
      badgeBg: 'bg-blue-50 border-blue-200',
      badgeText: 'text-blue-700',
    },
    highlights: [
      'Comprehensive 1,482 Central Cases Oversight',
      'Cross-Bureau Overlap Alerts (PGRC ⟷ RB)',
      'Statutory 45-Day SLA Escalation Tracking',
    ],
  },
  {
    id: 'pgrc',
    name: 'PGRC Official',
    badge: 'Public Grievance Redressal',
    description:
      'Monitor grievances, complaint statuses, and coordination activities.',
    route: '/pgrc-dashboard',
    icon: Users,
    demoEmail: 'pgrc.scrutiny@aicte-india.org',
    colorScheme: {
      border: 'hover:border-indigo-400 group-hover:border-indigo-400',
      bgHover: 'hover:bg-indigo-50/30',
      iconBg: 'bg-indigo-50 border-indigo-200',
      iconText: 'text-indigo-700',
      buttonBg: 'bg-indigo-600 hover:bg-indigo-700',
      badgeBg: 'bg-indigo-50 border-indigo-200',
      badgeText: 'text-indigo-700',
    },
    highlights: [
      'Student, Faculty, & Guardian Grievance Docket',
      'Case Status Tracking & Inquiry Panels',
      'Inter-Bureau Coordination Stream',
    ],
  },
  {
    id: 'regulation',
    name: 'Regulation Bureau Official',
    badge: 'Statutory Bureau',
    description:
      'Monitor regulatory cases, actions, and related complaints.',
    route: '/regulation-dashboard',
    icon: Scale,
    demoEmail: 'regulation.bureau@aicte-india.org',
    colorScheme: {
      border: 'hover:border-amber-400 group-hover:border-amber-400',
      bgHover: 'hover:bg-amber-50/30',
      iconBg: 'bg-amber-50 border-amber-200',
      iconText: 'text-amber-700',
      buttonBg: 'bg-amber-600 hover:bg-amber-700',
      badgeBg: 'bg-amber-50 border-amber-200',
      badgeText: 'text-amber-800',
    },
    highlights: [
      'Capitation Fee & Sanctioned Intake Audits',
      'Faculty Cadre Ratio & Infrastructure Compliance',
      'Regulatory Notices & Inspection Reports',
    ],
  },
  {
    id: 'institution',
    name: 'Institution',
    badge: 'Approved Campus',
    description:
      'View its own complaints, track progress, and manage responses.',
    route: '/institution-dashboard',
    icon: Building2,
    demoEmail: 'principal@apextech.edu.in',
    colorScheme: {
      border: 'hover:border-emerald-400 group-hover:border-emerald-400',
      bgHover: 'hover:bg-emerald-50/30',
      iconBg: 'bg-emerald-50 border-emerald-200',
      iconText: 'text-emerald-700',
      buttonBg: 'bg-emerald-700 hover:bg-emerald-800',
      badgeBg: 'bg-emerald-50 border-emerald-200',
      badgeText: 'text-emerald-800',
    },
    highlights: [
      'Inward Institutional Grievance Notices',
      'Compliance Clarification & Document Uploads',
      'AICTE Committee Hearing Action Tracker',
    ],
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RoleConfig | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenLogin = (role: RoleConfig) => {
    setSelectedRole(role);
    setEmail(role.demoEmail);
    setPassword('demopass123');
    setError('');
    setIsLoginOpen(true);
  };

  const handleDirectNavigate = (route: string) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      router.push(route);
    } catch {
      setError('Navigation failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid official email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      if (selectedRole) {
        router.push(selectedRole.route);
        return;
      }
      setError('No role selected. Please choose a role and try again.');
    } catch {
      setError('Sign in failed. Please try again or use Direct Launch / Demo Bypass.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      {/* Top Government Navbar */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 px-4 sm:px-8 py-3.5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#003366] text-white shadow-md">
              <ShieldCheck className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-base tracking-tight">
                  CaseConnect
                </span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                  AICTE Central
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                AICTE Integrated Institution Complaint Monitoring and Status Dashboard
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Integrated Grievance Gateway Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Hero & Role Selection Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-14 space-y-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 shadow-2xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>AICTE National Technical Education Redressal Framework</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="font-extrabold text-3xl sm:text-5xl text-slate-900 tracking-tight leading-tight"
          >
            Unified Complaint Monitoring <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#003366] via-blue-700 to-indigo-800">
              & Coordination
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto"
          >
            The national integrated portal bridging the <strong>Public Grievance Redressal Cell (PGRC)</strong> and
            the <strong>Regulation Bureau (RB)</strong> to prevent duplicate inquiries, enforce statutory
            disposal SLAs, and accelerate transparent grievance redressing across AICTE-approved institutions.
          </motion.p>

          {/* Quick Metrics Bar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-6 text-xs text-slate-600 font-medium"
          >
            <span className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200/90 px-3 py-1.5 shadow-2xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              1,482 Central Complaints
            </span>
            <span className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200/90 px-3 py-1.5 shadow-2xs">
              <Layers className="h-4 w-4 text-blue-600" />
              45-Day Statutory SLA Tracking
            </span>
            <span className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200/90 px-3 py-1.5 shadow-2xs">
              <Sparkles className="h-4 w-4 text-purple-600" />
              Automated Overlap Detection
            </span>
          </motion.div>
        </div>

        {/* Section Heading */}
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-slate-900">
            Select Your Administrative Role
          </h2>
          <p className="text-xs text-slate-500">
            Choose your role to access the tailored monitoring console or perform compliance tasks
          </p>
        </div>

        {/* 4 Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {ROLES.map((role, idx) => {
            const Icon = role.icon;
            return (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
                whileHover={{ y: -4, transition: { duration: 0.15 } }}
                className={`group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all duration-200 hover:shadow-lg ${role.colorScheme.border} ${role.colorScheme.bgHover}`}
              >
                <div>
                  {/* Top Row: Icon + Badge */}
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl border ${role.colorScheme.iconBg} ${role.colorScheme.iconText} transition-transform group-hover:scale-105`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${role.colorScheme.badgeBg} ${role.colorScheme.badgeText}`}
                    >
                      {role.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="mt-4 font-bold text-lg text-slate-900 group-hover:text-blue-900 transition-colors">
                    {role.name}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {role.description}
                  </p>

                  {/* Highlights */}
                  <div className="mt-4 border-t border-slate-100 pt-3 space-y-1.5">
                    {role.highlights.map((item, hIdx) => (
                      <div
                        key={hIdx}
                        className="flex items-start gap-1.5 text-[11px] text-slate-600 font-medium"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />
                        <span className="line-clamp-1">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="mt-6 pt-4 border-t border-slate-100/90 space-y-2">
                  <button
                    onClick={() => handleOpenLogin(role)}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-xs text-white shadow-xs transition-all ${role.colorScheme.buttonBg}`}
                  >
                    <span>Continue as {role.name}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                  <button
                    onClick={() => handleDirectNavigate(role.route)}
                    className="w-full text-center text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Direct Launch →
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Login Dialog Modal */}
      <AnimatePresence>
        {isLoginOpen && selectedRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isLoading && setIsLoginOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            />

            {/* Modal Dialog */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="login-dialog-title"
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              onKeyDown={(e) => {
                if (e.key === 'Escape' && !isLoading) {
                  setIsLoginOpen(false);
                }
              }}
              tabIndex={-1}
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border ${selectedRole.colorScheme.iconBg} ${selectedRole.colorScheme.iconText}`}
                  >
                    <selectedRole.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 id="login-dialog-title" className="font-bold text-base text-slate-900">
                      Sign In as {selectedRole.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Demonstration role access portal
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => !isLoading && setIsLoginOpen(false)}
                  disabled={isLoading}
                  aria-label="Close login dialog"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Demo Notice */}
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-xs text-blue-900">
                <div className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span>Demonstration Flow</span>
                </div>
                <p className="mt-1 text-[11px] text-blue-800/90 leading-relaxed">
                  Pre-configured credentials have been loaded for <strong>{selectedRole.name}</strong>.
                  Click below to immediately enter this role&apos;s console.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSignIn} className="mt-4 space-y-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 font-medium">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Email input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Email ID
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@aicte-india.org"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Password input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Access Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-10 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit & Quick Launch */}
                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-xs text-white shadow-xs transition-colors ${selectedRole.colorScheme.buttonBg}`}
                  >
                    <span>{isLoading ? 'Accessing Console...' : `Sign In as ${selectedRole.name}`}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDirectNavigate(selectedRole.route)}
                    disabled={isLoading}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 font-semibold text-xs text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    1-Click Demo Bypass (Skip Login)
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white px-4 sm:px-8 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-slate-700">CaseConnect v1.0.4</span>
            <span>•</span>
            <span>All India Council for Technical Education (AICTE)</span>
          </div>

          <div className="text-[11px] text-slate-400">
            Statutory Oversight • Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070
          </div>
        </div>
      </footer>
    </div>
  );
}
