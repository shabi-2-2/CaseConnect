'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  ShieldCheck,
  Settings,
  FileText,
  LogOut,
  Building2,
  ChevronDown,
} from 'lucide-react';

export function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-1.5 pr-3 transition-colors hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        aria-expanded={isOpen}
        aria-label="User profile menu"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#003366] font-semibold text-xs text-white shadow-xs">
          RS
        </div>
        <div className="hidden text-left sm:block">
          <div className="font-medium text-slate-900 text-xs leading-none">Dr. R. K. Sharma</div>
          <div className="mt-0.5 text-[10px] text-slate-500 font-normal">Sr. Director • PGRC / RB</div>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
          >
            {/* Header info */}
            <div className="border-b border-slate-100 p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#003366] font-semibold text-sm text-white">
                  RS
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Dr. R. K. Sharma</h4>
                  <p className="text-slate-500 text-xs">director.pgrc@aicte-india.org</p>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 font-medium text-[10px] text-blue-700">
                    <ShieldCheck className="h-3 w-3 text-blue-600" />
                    AICTE Apex Oversight Officer
                  </span>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-slate-50 p-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <Building2 className="h-3.5 w-3.5 text-slate-500" />
                  AICTE Central Headquarters
                </div>
                <div className="mt-0.5 text-slate-500 pl-5">Nelson Mandela Marg, Vasant Kunj, New Delhi</div>
              </div>
            </div>

            {/* Menu Links */}
            <div className="py-1">
              <button
                onClick={() => {
                  alert('Officer Profile & Assigned Bureaus: Dr. R. K. Sharma (Senior Director overseeing PGRC and Regulation Bureau coordination).');
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <User className="h-4 w-4 text-slate-400" />
                Officer Profile & Bureau Assignment
              </button>

              <button
                onClick={() => {
                  alert('SLA Configuration: Standard statutory resolution timeframe is set to 45 calendar days under AICTE Grievance Regulations.');
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                SLA & Escalation Rules
              </button>

              <button
                onClick={() => {
                  alert('Audit Log: 14 recent administrative actions logged for Session Oct 2026.');
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <FileText className="h-4 w-4 text-slate-400" />
                Management Audit Logs
              </button>
            </div>

            <div className="border-t border-slate-100 pt-1">
              <button
                onClick={() => {
                  alert('Session secured. (Simulation: AICTE Single Sign-On / Parichay)');
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="h-4 w-4 text-rose-500" />
                Sign Out (AICTE SSO)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
