'use client';

import React from 'react';
import {
  Sparkles,
  AlertOctagon,
  FilePlus2,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { RECENT_ACTIVITIES } from '@/data/mockData';
import { ActivityItem } from '@/types/dashboard';

interface RecentActivityFeedProps {
  onSelectCase?: (caseId: string) => void;
}

export function RecentActivityFeed({ onSelectCase }: RecentActivityFeedProps) {
  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'overlap_alert':
        return <Sparkles className="h-4 w-4 text-purple-600" />;
      case 'escalation':
        return <AlertOctagon className="h-4 w-4 text-rose-600" />;
      case 'submission':
        return <FilePlus2 className="h-4 w-4 text-blue-600" />;
      case 'closure':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'status_change':
      default:
        return <RefreshCw className="h-4 w-4 text-amber-600" />;
    }
  };

  const getIconWrapper = (type: ActivityItem['type']) => {
    switch (type) {
      case 'overlap_alert':
        return 'bg-purple-50 border-purple-200';
      case 'escalation':
        return 'bg-rose-50 border-rose-200';
      case 'submission':
        return 'bg-blue-50 border-blue-200';
      case 'closure':
        return 'bg-emerald-50 border-emerald-200';
      case 'status_change':
      default:
        return 'bg-amber-50 border-amber-200';
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900">Recent Activity Feed</h3>
            <p className="text-[11px] text-slate-500">Live administrative events & status transitions</p>
          </div>
        </div>

        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Realtime
        </span>
      </div>

      {/* Feed List */}
      <div className="divide-y divide-slate-100 my-1 max-h-[380px] overflow-y-auto">
        {RECENT_ACTIVITIES.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectCase && onSelectCase(item.caseId)}
            className="group flex items-start gap-3 py-3 transition-colors hover:bg-slate-50/80 rounded-lg px-2 cursor-pointer"
          >
            {/* Icon */}
            <div
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${getIconWrapper(
                item.type
              )} transition-transform group-hover:scale-105`}
            >
              {getIcon(item.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="font-semibold text-xs text-slate-900 group-hover:text-blue-900 truncate">
                  {item.title}
                </span>
                <span className="shrink-0 text-[10px] text-slate-400 font-medium">
                  {item.timestamp}
                </span>
              </div>

              <p className="mt-0.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {item.description}
              </p>

              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                    {item.caseId}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-sm ${
                      item.bureau === 'PGRC'
                        ? 'text-blue-700 bg-blue-50'
                        : 'text-amber-700 bg-amber-50'
                    }`}
                  >
                    {item.bureau}
                  </span>
                </div>

                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  View <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 pt-3 text-center">
        <button
          onClick={() => alert('Opening Full Audit Stream (Phase 2 feature)')}
          className="text-xs font-semibold text-blue-700 hover:text-blue-800 transition-colors"
        >
          View Full Activity Log →
        </button>
      </div>
    </div>
  );
}
