'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { STATUS_DISTRIBUTION } from '@/data/mockData';
import { formatIndianNumber, useMounted } from '@/lib/utils';
import { PieChart as PieIcon } from 'lucide-react';
import { CustomChartTooltipProps } from '@/types/dashboard';

function CustomTooltip({ active, payload }: CustomChartTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as { status: string; color: string; count: number; percentage: number };
    if (!data) return null;
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-lg">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <span className="font-semibold text-xs text-slate-800">{data.status}</span>
        </div>
        <div className="mt-1 text-slate-900 font-bold text-sm">
          {formatIndianNumber(data.count)}{' '}
          <span className="text-slate-500 font-normal text-xs">cases ({data.percentage}%)</span>
        </div>
      </div>
    );
  }
  return null;
}

export function StatusDonutChart() {
  const mounted = useMounted();
  const totalCases = STATUS_DISTRIBUTION.reduce((acc, curr) => acc + curr.count, 0);

  if (!mounted) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-xl border border-slate-200/80 bg-white p-5">
        <div className="h-40 w-40 animate-pulse rounded-full border-4 border-slate-100" />
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
      {/* Card Header */}
      <div className="flex items-start justify-between border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <PieIcon className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-sm text-slate-900">Cases by Disposal Status</h3>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Resolution breakdown across PGRC and Regulation Bureau
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
          Total: {formatIndianNumber(totalCases)}
        </span>
      </div>

      {/* Donut Chart with Centered Metric */}
      <div className="relative my-2 flex h-60 items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={STATUS_DISTRIBUTION}
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={95}
              paddingAngle={4}
              dataKey="count"
            >
              {STATUS_DISTRIBUTION.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="#ffffff"
                  strokeWidth={2}
                  className="transition-opacity duration-200 hover:opacity-85 cursor-pointer"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Resolution
          </span>
          <span className="font-extrabold text-2xl text-slate-900 tracking-tight">
            42.0%
          </span>
          <span className="text-[10px] font-medium text-emerald-600">Disposal Rate</span>
        </div>
      </div>

      {/* Custom Legend */}
      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
        {STATUS_DISTRIBUTION.map((item) => (
          <div
            key={item.status}
            className="flex flex-col items-center rounded-lg bg-slate-50/80 p-2 text-center"
          >
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[11px] font-medium text-slate-700 truncate">
                {item.status}
              </span>
            </div>
            <span className="mt-0.5 font-bold text-xs text-slate-900">
              {formatIndianNumber(item.count)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
