'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BUREAU_WORKLOAD } from '@/data/mockData';
import { Layers, ShieldCheck } from 'lucide-react';
import { useMounted } from '@/lib/utils';
import { CustomChartTooltipProps } from '@/types/dashboard';

function CustomTooltip({ active, payload, label }: CustomChartTooltipProps) {
  if (active && payload && payload.length) {
    const pgrcVal = Number(payload[0]?.value || 0);
    const rbVal = Number(payload[1]?.value || 0);
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
        <p className="font-semibold text-xs text-slate-800 border-b border-slate-100 pb-1 mb-2">
          {label}
        </p>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-blue-700 font-medium">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              PGRC:
            </span>
            <span className="font-bold text-slate-900">{pgrcVal} cases</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-amber-700 font-medium">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Regulation Bureau:
            </span>
            <span className="font-bold text-slate-900">{rbVal} cases</span>
          </div>
          <div className="border-t border-slate-100 pt-1 flex items-center justify-between font-semibold text-slate-700 text-[11px]">
            <span>Combined:</span>
            <span>{pgrcVal + rbVal} cases</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function WorkloadBarChart() {
  const mounted = useMounted();

  if (!mounted) {
    return (
      <div className="flex h-80 w-full items-center justify-center rounded-xl border border-slate-200/80 bg-white p-5">
        <div className="h-48 w-full animate-pulse rounded-lg bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
              <Layers className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-sm text-slate-900">
              Bureau Workload Distribution by Category
            </h3>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Comparative case volumes handled by PGRC vs Regulation Bureau
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#1e40af]" />
            <span>PGRC</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#f59e0b]" />
            <span>Regulation Bureau</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="my-2 h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={BUREAU_WORKLOAD}
            margin={{ top: 12, right: 12, left: -16, bottom: 24 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="category"
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fontSize: 10, fill: '#64748b' }}
              interval={0}
              angle={-14}
              textAnchor="end"
            />
            <YAxis
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="pgrc"
              name="PGRC"
              fill="#1e40af"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey="regulationBureau"
              name="Regulation Bureau"
              fill="#f59e0b"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Insights Note */}
      <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
          <span>Affiliation & Approval queries dominate Regulation Bureau cases</span>
        </div>
        <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
          Data synchronized hourly
        </span>
      </div>
    </div>
  );
}
