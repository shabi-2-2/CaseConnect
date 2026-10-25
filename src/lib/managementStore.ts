'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CaseItem,
  InstitutionItem,
  OverlapAlertItem,
  NotificationItem,
  OverlapReviewStatus,
  ManagementNote,
  FollowUpDetails,
} from '@/types/dashboard';
import {
  SAMPLE_CASES,
  SAMPLE_INSTITUTIONS,
  SAMPLE_OVERLAPS,
  SAMPLE_NOTIFICATIONS,
} from '@/data/mockData';
import { fetchComplaints, updateComplaint } from '@/lib/complaints-api';

const STORAGE_KEYS = {
  NOTIFICATIONS: 'caseconnect_mgmt_notifications_v1',
};

export function getInitialNotifications(): NotificationItem[] {
  if (typeof window === 'undefined') return SAMPLE_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading notifications from localStorage', e);
  }
  return SAMPLE_NOTIFICATIONS;
}

export function useManagementData() {
  const [cases, setCases] = useState<CaseItem[]>(SAMPLE_CASES);
  const [overlaps, setOverlaps] = useState<OverlapAlertItem[]>(SAMPLE_OVERLAPS);
  const [institutions, setInstitutions] = useState<InstitutionItem[]>(SAMPLE_INSTITUTIONS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => getInitialNotifications());
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);

  // Fetch from SQLite APIs
  const refreshData = useCallback(async () => {
    try {
      const [casesRes, overlapsRes, institutionsRes] = await Promise.allSettled([
        fetchComplaints(),
        fetch('/api/overlaps', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/institutions', { cache: 'no-store' }).then((r) => r.json()),
      ]);

      if (!isMountedRef.current) return;

      if (casesRes.status === 'fulfilled' && Array.isArray(casesRes.value) && casesRes.value.length > 0) {
        setCases(casesRes.value);
      }

      if (overlapsRes.status === 'fulfilled' && Array.isArray(overlapsRes.value?.overlaps)) {
        setOverlaps(overlapsRes.value.overlaps);
      }

      if (institutionsRes.status === 'fulfilled' && Array.isArray(institutionsRes.value?.institutions)) {
        setInstitutions(institutionsRes.value.institutions);
      }
    } catch (err) {
      console.error('Failed to sync management data with SQLite backend', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoaded(true);
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    refreshData();

    // Polling every 8 seconds to synchronize across all dashboards
    const interval = setInterval(() => {
      refreshData();
    }, 8000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [refreshData]);

  const saveNotifications = (updated: NotificationItem[]) => {
    setNotifications(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // 1. Toggle Case Attention Flag - persists in SQLite
  const toggleCaseFlag = async (caseId: string) => {
    const target = cases.find((c) => c.id === caseId || c.caseNumber === caseId);
    if (!target) return;

    const nextFlag = !target.managementFlagged;
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId || c.caseNumber === caseId
          ? { ...c, managementFlagged: nextFlag }
          : c
      )
    );

    try {
      await updateComplaint(target.id, { managementFlagged: nextFlag });
    } catch (e) {
      console.error('Failed to save flag to SQLite', e);
    }
  };

  // 2. Add Management Note - persists in SQLite
  const addManagementNote = async (caseId: string, content: string) => {
    const target = cases.find((c) => c.id === caseId || c.caseNumber === caseId);
    if (!target) return;

    const newNote: ManagementNote = {
      id: `note-${Date.now()}`,
      author: 'Dr. R. K. Sharma',
      authorRole: 'Sr. Director (Grievance & Regulation)',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      content,
    };

    const nextNotes = [newNote, ...(target.managementNotes || [])];

    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId || c.caseNumber === caseId
          ? { ...c, managementNotes: nextNotes }
          : c
      )
    );

    try {
      await updateComplaint(target.id, { managementNotes: nextNotes });
    } catch (e) {
      console.error('Failed to save management note to SQLite', e);
    }
  };

  // 3. Set Case Follow-up Details - persists in SQLite
  const setCaseFollowUp = async (
    caseId: string,
    details: { owner: string; deadline: string; instructions?: string }
  ) => {
    const target = cases.find((c) => c.id === caseId || c.caseNumber === caseId);
    if (!target) return;

    const followUp: FollowUpDetails = {
      owner: details.owner,
      deadline: details.deadline,
      instructions: details.instructions,
      status: 'Pending',
      assignedAt: new Date().toISOString().substring(0, 10),
    };

    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId || c.caseNumber === caseId ? { ...c, followUp } : c
      )
    );

    try {
      await updateComplaint(target.id, { followUp });
    } catch (e) {
      console.error('Failed to save follow-up to SQLite', e);
    }
  };

  // 4. Update Overlap Review Status - persists in SQLite overlap_alerts table
  const updateOverlapStatus = async (
    overlapId: string,
    newStatus: OverlapReviewStatus,
    reviewNotes?: string
  ) => {
    const reviewer = 'Dr. R. K. Sharma (Sr. Director)';
    const reviewedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // Optimistic UI update
    setOverlaps((prev) =>
      prev.map((ovr) => {
        if (ovr.id === overlapId || ovr.alertNumber === overlapId) {
          return {
            ...ovr,
            reviewStatus: newStatus,
            reviewedBy: reviewer,
            reviewedAt,
            reviewNotes: reviewNotes || ovr.reviewNotes,
          };
        }
        return ovr;
      })
    );

    try {
      const res = await fetch('/api/overlaps', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: overlapId,
          reviewStatus: newStatus,
          reviewedBy: reviewer,
          reviewNotes,
        }),
      });
      if (!res.ok) throw new Error('Failed to update overlap status');
      // Refresh to ensure full synchronization with complaints and institutions
      refreshData();
    } catch (e) {
      console.error('Failed to update overlap status in SQLite', e);
    }
  };

  // 5. Notifications
  const markNotificationAsRead = (id: string) => {
    const next = notifications.map((n) => (n.id === id ? { ...n, unread: false } : n));
    saveNotifications(next);
  };

  const markAllNotificationsAsRead = () => {
    const next = notifications.map((n) => ({ ...n, unread: false }));
    saveNotifications(next);
  };

  return {
    cases,
    institutions,
    overlaps,
    notifications,
    isLoaded,
    isLoading,
    refreshData,
    toggleCaseFlag,
    addManagementNote,
    setCaseFollowUp,
    updateOverlapStatus,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  };
}
