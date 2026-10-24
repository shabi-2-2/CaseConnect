'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  CopyCheck,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from 'lucide-react';
import { KpiMetric } from '@/types/dashboard';
import { formatIndianNumber } from '@/lib/utils';

interface KpiCardProps {
  metric: KpiMetric;
  index: number;
  onClick?: () => void;
}

export function KpiCard({ metric, index, onClick }: KpiCardProps) {
  const getIcon = () => {
    switch (metric.iconName) {
      case 'FolderKanban':
        return <FolderKanban className="h-5 w-5 text-blue-600" />;
      case 'Clock':
        return <Clock className="h-5 w-5 text-amber-600" />;
      case 'Activity':
        return <Activity className="h-5 w-5 text-indigo-600" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      case 'AlertTriangle':
        return <AlertTriangle className="h-5 w-5 text-rose-600" />;
      case 'CopyCheck':
      default:
        return <CopyCheck className="h-5 w-5 text-purple-600" />;
    }
  };

  const getColorStyles = () => {
    switch (metric.accentColor) {
      case 'blue':
        return {
          iconBg: 'bg-blue-50 border-blue-100',
          borderHover: 'hover:border-blue-300',
          accentPill: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'amber':
        return {
          iconBg: 'bg-amber-50 border-amber-100',
          borderHover: 'hover:border-amber-300',
          accentPill: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'indigo':
        return {
          iconBg: 'bg-indigo-50 border-indigo-100',
          borderHover: 'hover:border-indigo-300',
          accentPill: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
      case 'emerald':
        return {
          iconBg: 'bg-emerald-50 border-emerald-100',
          borderHover: 'hover:border-emerald-300',
          accentPill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'rose':
        return {
          iconBg: 'bg-rose-50 border-rose-100',
          borderHover: 'hover:border-rose-300',
          accentPill: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'purple':
      default:
        return {
          iconBg: 'bg-purple-50 border-purple-100',
          borderHover: 'hover:border-purple-300',
          accentPill: 'bg-purple-50 text-purple-700 border-purple-200',
        };
    }
  };

  const styles = getColorStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
        ease: 'easeOut',
      }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className={`group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 cursor-pointer ${styles.borderHover} hover:shadow-md`}
    >
      {/* Top row: Icon + optional badge/trend */}
      <div className="flex items-center justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl border ${styles.iconBg} transition-transform duration-200 group-hover:scale-105`}
        >
          {getIcon()}
        </div>

        <div className="flex items-center gap-1.5">
          {metric.badgeText && (
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${styles.accentPill}`}
            >
              {metric.badgeText}
            </span>
          )}

          {metric.changePercent !== undefined && (
            <div
              className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                metric.changeType === 'positive'
                  ? 'bg-emerald-50 text-emerald-700'
                  : metric.changeType === 'negative'
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {metric.changePercent > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>
                {metric.changePercent > 0 ? `+${metric.changePercent}%` : `${metric.changePercent}%`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Metric Value and Label */}
      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-2xl sm:text-3xl tracking-tight text-slate-900">
            {formatIndianNumber(metric.value)}
          </span>
        </div>
        <h3 className="mt-1 font-semibold text-xs sm:text-sm text-slate-700">{metric.title}</h3>
      </div>

      {/* Subtext info */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
        <span className="truncate pr-2">{metric.subtext}</span>
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </motion.div>
  );
}
