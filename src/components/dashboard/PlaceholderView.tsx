'use client';

import React from 'react';
import {
  Building2,
  FolderKanban,
  CopyCheck,
  BarChart3,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { NavTab } from '../layout/Sidebar';

interface PlaceholderViewProps {
  tab: NavTab;
  onBackToOverview: () => void;
}

export function PlaceholderView({ tab, onBackToOverview }: PlaceholderViewProps) {
  const getTabConfig = () => {
    switch (tab) {
      case 'institutions':
        return {
          title: 'Institution Directory',
          icon: Building2,
          iconColor: 'text-blue-600 bg-blue-50 border-blue-200',
          badge: 'Phase 2 Module',
          description:
            'Comprehensive directory of AICTE-approved polytechnics, engineering colleges, and management universities with real-time grievance history, NIRF ranks, and accreditation records.',
          features: [
            'Search & profile lookup across 10,000+ AICTE approved institutions',
            'Historical compliance audit trail & past show-cause notices',
            'Cross-indexing with NAAC / NBA accreditation status',
            'Direct regional officer communication link',
          ],
        };
      case 'cases':
        return {
          title: 'All Grievance Cases Repository',
          icon: FolderKanban,
          iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
          badge: 'Phase 2 Module',
          description:
            'Centralized master repository containing all 1,482 grievances handled by the Public Grievance Redressal Cell (PGRC) and Regulation Bureau (RB).',
          features: [
            'Full-text Boolean search & advanced multi-parameter filtration',
            'Bulk case disposition workflows and PDF notice generator',
            'Statutory SLA timer tracking and auto-escalation matrix',
            'Cross-bureau case transfer and joint inquiry management',
          ],
        };
      case 'overlaps':
        return {
          title: 'Cross-Bureau Overlap Detection Centre',
          icon: CopyCheck,
          iconColor: 'text-purple-600 bg-purple-50 border-purple-200',
          badge: 'Phase 2 AI Engine',
          description:
            'AI-assisted duplicate and correlation detection engine linking parallel complaints submitted to both PGRC and Regulation Bureau.',
          features: [
            'Semantic text comparison between student and regulatory petitions',
            '18 Active cross-bureau overlap alerts flagged for executive review',
            'Automatic duplicate case clustering to avoid redundant inspections',
            'Unified hearing recommendations for senior management',
          ],
        };
      case 'reports':
      default:
        return {
          title: 'Reports & Executive Analytics',
          icon: BarChart3,
          iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
          badge: 'Phase 3 Module',
          description:
            'AICTE apex executive reporting suite with exportable compliance summaries, regional heatmaps, and quarterly grievance redressal scorecards.',
          features: [
            'Exportable PDF & Excel reports for Ministry of Education (MoE)',
            'Average resolution turnaround trends by state and bureau',
            'Institutional repeat-offender risk scoring & red-flag matrix',
            'Automated monthly briefing generation for AICTE Chairman',
          ],
        };
    }
  };

  const config = getTabConfig();
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Top Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border shadow-xs mb-4">
          <Icon className="h-8 w-8 text-blue-700" />
        </div>

        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 font-semibold text-xs text-blue-700 border border-blue-200 mb-3">
          <Sparkles className="h-3.5 w-3.5" />
          {config.badge}
        </span>

        {/* Title */}
        <h2 className="font-bold text-2xl text-slate-900 tracking-tight">
          {config.title}
        </h2>

        {/* Description */}
        <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
          {config.description}
        </p>

        {/* Key Planned Capabilities */}
        <div className="mt-8 rounded-xl border border-slate-200/80 bg-slate-50/70 p-5 text-left">
          <span className="font-semibold text-xs uppercase tracking-wider text-slate-400">
            Roadmap Capabilities
          </span>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {config.features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={onBackToOverview}
            className="flex items-center gap-2 rounded-xl bg-[#003366] px-5 py-2.5 font-semibold text-xs text-white shadow-sm hover:bg-blue-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard Overview</span>
          </button>
        </div>
      </div>
    </div>
  );
}
