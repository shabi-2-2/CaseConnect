'use client';

import { useState } from 'react';
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

const STORAGE_KEYS = {
  CASES: 'caseconnect_mgmt_cases_v1',
  OVERLAPS: 'caseconnect_mgmt_overlaps_v1',
  NOTIFICATIONS: 'caseconnect_mgmt_notifications_v1',
};

export function getInitialCases(): CaseItem[] {
  if (typeof window === 'undefined') return SAMPLE_CASES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CASES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading cases from localStorage', e);
  }
  return SAMPLE_CASES;
}

export function getInitialOverlaps(): OverlapAlertItem[] {
  if (typeof window === 'undefined') return SAMPLE_OVERLAPS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OVERLAPS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading overlaps from localStorage', e);
  }
  return SAMPLE_OVERLAPS;
}

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
  const [cases, setCases] = useState<CaseItem[]>(() => getInitialCases());
  const [overlaps, setOverlaps] = useState<OverlapAlertItem[]>(() => getInitialOverlaps());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => getInitialNotifications());
  const [institutions] = useState<InstitutionItem[]>(SAMPLE_INSTITUTIONS);
  const [isLoaded] = useState(true);

  // Save changes to localStorage
  const saveCases = (updated: CaseItem[]) => {
    setCases(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const saveOverlaps = (updated: OverlapAlertItem[]) => {
    setOverlaps(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.OVERLAPS, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const saveNotifications = (updated: NotificationItem[]) => {
    setNotifications(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // 1. Toggle Case Attention Flag
  const toggleCaseFlag = (caseId: string) => {
    const next = cases.map((c) =>
      c.id === caseId || c.caseNumber === caseId
        ? { ...c, managementFlagged: !c.managementFlagged }
        : c
    );
    saveCases(next);
  };

  // 2. Add Management Note
  const addManagementNote = (caseId: string, content: string) => {
    const newNote: ManagementNote = {
      id: `note-${Date.now()}`,
      author: 'Dr. R. K. Sharma',
      authorRole: 'Sr. Director (Grievance & Regulation)',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      content,
    };

    const next = cases.map((c) => {
      if (c.id === caseId || c.caseNumber === caseId) {
        return {
          ...c,
          managementNotes: [newNote, ...(c.managementNotes || [])],
        };
      }
      return c;
    });
    saveCases(next);
  };

  // 3. Set Case Follow-up Details
  const setCaseFollowUp = (
    caseId: string,
    details: { owner: string; deadline: string; instructions?: string }
  ) => {
    const followUp: FollowUpDetails = {
      owner: details.owner,
      deadline: details.deadline,
      instructions: details.instructions,
      status: 'Pending',
      assignedAt: new Date().toISOString().substring(0, 10),
    };

    const next = cases.map((c) =>
      c.id === caseId || c.caseNumber === caseId ? { ...c, followUp } : c
    );
    saveCases(next);
  };

  // 4. Update Overlap Review Status
  const updateOverlapStatus = (
    overlapId: string,
    newStatus: OverlapReviewStatus,
    reviewNotes?: string
  ) => {
    const reviewer = 'Dr. R. K. Sharma (Sr. Director)';
    const reviewedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const nextOverlaps = overlaps.map((ovr) => {
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
    });
    saveOverlaps(nextOverlaps);

    // Also reflect into related cases' overlapDetails.reviewStatus
    const targetOverlap = overlaps.find(
      (o) => o.id === overlapId || o.alertNumber === overlapId
    );
    if (targetOverlap) {
      const nextCases = cases.map((c) => {
        if (
          c.caseNumber === targetOverlap.case1.caseNumber ||
          c.caseNumber === targetOverlap.case2.caseNumber
        ) {
          return {
            ...c,
            overlapDetails: c.overlapDetails
              ? { ...c.overlapDetails, reviewStatus: newStatus }
              : undefined,
          };
        }
        return c;
      });
      saveCases(nextCases);
    }
  };

  // 5. Mark Notification As Read / All As Read
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
    toggleCaseFlag,
    addManagementNote,
    setCaseFollowUp,
    updateOverlapStatus,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  };
}
