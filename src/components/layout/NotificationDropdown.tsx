'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  AlertCircle,
  Check,
  ChevronRight,
} from 'lucide-react';
import { SAMPLE_NOTIFICATIONS } from '@/data/mockData';
import { NotificationItem } from '@/types/dashboard';

interface NotificationDropdownProps {
  onSelectCase?: (caseId: string) => void;
}

export function NotificationDropdown({ onSelectCase }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(SAMPLE_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
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

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  const markAsRead = (id: string, caseId?: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unread: false } : item))
    );
    if (caseId && onSelectCase) {
      onSelectCase(caseId);
      setIsOpen(false);
    }
  };

  const displayedNotifications = notifications.filter((item) => {
    if (filter === 'unread') return item.unread;
    return true;
  });

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'alert':
        return <AlertCircle className="h-4 w-4 text-purple-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getBadgeBg = (type: NotificationItem['type']) => {
    switch (type) {
      case 'alert':
        return 'bg-purple-100 border-purple-200';
      case 'warning':
        return 'bg-amber-100 border-amber-200';
      case 'success':
        return 'bg-emerald-100 border-emerald-200';
      case 'info':
      default:
        return 'bg-blue-100 border-blue-200';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 font-semibold text-[10px] text-white ring-2 ring-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 z-50 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
                <p className="text-[11px] text-slate-500">
                  {unreadCount} unread administrative alert{unreadCount !== 1 ? 's' : ''}
                </p>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Check className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50/70 px-4 py-1.5 gap-2 text-xs">
              <button
                onClick={() => setFilter('all')}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {displayedNotifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No notifications to show.
                </div>
              ) : (
                displayedNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id, notif.caseId)}
                    className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-slate-50 ${
                      notif.unread ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${getBadgeBg(
                        notif.type
                      )}`}
                    >
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-medium text-slate-900 text-xs truncate">
                          {notif.title}
                        </span>
                        {notif.unread && (
                          <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{notif.timestamp}</span>
                        {notif.caseId && (
                          <span className="flex items-center text-blue-600 hover:underline">
                            View case <ChevronRight className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 bg-slate-50/70 p-2 text-center">
              <span className="text-[11px] text-slate-500">
                PGRC & RB Central Alert Stream • Real-time
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
