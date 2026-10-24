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
import { REGION_DISTRIBUTION } from '@/data/mockData';
import { MapPin, Info } from 'lucide-react';
import { formatIndianNumber, useMounted } from '@/lib/utils';
import { CustomChartTooltipProps } from '@/types/dashboard';

function CustomTooltip({ active, payload, label }: CustomChartTooltipProps) {
  if (active && payload && payload.length) {
    const activeCases = Number(payload.find((p) => p.dataKey === 'activeCases')?.value || 0);
    const disposedCases = Number(payload.find((p) => p.dataKey === 'disposedCases')?.value || 0);
    const total = activeCases + disposedCases;

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
        <p className="font-semibold text-xs text-slate-800 border-b border-slate-100 pb-1 mb-2">
          AICTE {label} Regional Office
        </p>
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-blue-700 font-medium">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              Active Grievances:
            </span>
            <span className="font-bold text-slate-900">{formatIndianNumber(activeCases)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Disposed Cases:
            </span>
            <span className="font-bold text-slate-900">{formatIndianNumber(disposedCases)}</span>
          </div>
          <div className="border-t border-slate-100 pt-1.5 flex items-center justify-between font-bold text-slate-800 text-xs">
            <span>Total Volume:</span>
            <span>{formatIndianNumber(total)} cases</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function RegionBarChart() {
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
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <MapPin className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-sm text-slate-900">
              Region-Wise Case Distribution
            </h3>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Active vs disposed case density across AICTE Regional Jurisdictions
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#2563eb]" />
            <span>Active Cases</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#10b981]" />
            <span>Disposed</span>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="my-2 h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={REGION_DISTRIBUTION}
            margin={{ top: 12, right: 12, left: -16, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="shortName"
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <YAxis
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="activeCases"
              name="Active Cases"
              stackId="a"
              fill="#2563eb"
              radius={[0, 0, 0, 0]}
              maxBarSize={38}
            />
            <Bar
              dataKey="disposedCases"
              name="Disposed Cases"
              stackId="a"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              maxBarSize={38}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Insight */}
      <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
        <div className="flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-blue-600" />
          <span>Northern (Kanpur) and Western (Mumbai) offices record the highest case loads</span>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">7 Jurisdictions</span>
      </div>
    </div>
  );
}
