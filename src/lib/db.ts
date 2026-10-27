import { getSupabaseServerClient } from '@/lib/supabase/server';

export { getSupabaseServerClient };

export interface ComplaintRow {
  id: string;
  case_number: string;
  institution_name: string;
  institution_code: string;
  location: string;
  region: string;
  bureau: string;
  category: string;
  subject: string;
  complainant_type: string;
  submission_date: string;
  expected_disposal_date: string;
  status: string;
  priority: string;
  has_overlap_alert: boolean | number;
  overlap_case_id: string | null;
  overlap_bureau: string | null;
  overlap_match_score: number | null;
  overlap_reason: string | null;
  assigned_officer: string;
  last_updated: string;
  summary: string;
  management_flagged?: boolean | number;
  follow_up_json?: string | null;
  notes_json?: string | null;
}

export function rowToComplaint(row: any) {
  let notes = [];
  if (row.notes_json) {
    try {
      notes = typeof row.notes_json === 'string' ? JSON.parse(row.notes_json) : row.notes_json;
    } catch {}
  }

  let followUp = undefined;
  if (row.follow_up_json) {
    try {
      followUp = typeof row.follow_up_json === 'string' ? JSON.parse(row.follow_up_json) : row.follow_up_json;
    } catch {}
  }

  return {
    id: row.id,
    caseNumber: row.case_number,
    institutionName: row.institution_name,
    institutionCode: row.institution_code,
    location: row.location || '',
    region: row.region || '',
    bureau: row.bureau,
    category: row.category,
    subject: row.subject,
    complainantType: row.complainant_type,
    submissionDate: row.submission_date,
    expectedDisposalDate: row.expected_disposal_date,
    status: row.status,
    priority: row.priority,
    hasOverlapAlert: !!row.has_overlap_alert,
    overlapDetails: row.overlap_case_id
      ? {
          overlapCaseId: row.overlap_case_id,
          overlapBureau: row.overlap_bureau,
          matchScore: row.overlap_match_score,
          reason: row.overlap_reason,
        }
      : undefined,
    assignedOfficer: row.assigned_officer,
    lastUpdated: row.last_updated,
    summary: row.summary,
    managementFlagged: !!row.management_flagged,
    followUp,
    managementNotes: notes,
  };
}

export function rowToOverlap(row: any) {
  let matchingReasons: string[] = [];
  try {
    if (row.matching_reasons) {
      matchingReasons = typeof row.matching_reasons === 'string' ? JSON.parse(row.matching_reasons) : row.matching_reasons;
    }
  } catch {}

  let ruleMatches = {
    institutionMatch: true,
    categoryMatch: true,
    keywordsMatched: [],
    timeframeMatch: true,
  };
  try {
    if (row.rule_matches) {
      ruleMatches = typeof row.rule_matches === 'string' ? JSON.parse(row.rule_matches) : row.rule_matches;
    }
  } catch {}

  return {
    id: row.id,
    alertNumber: row.alert_number,
    institutionName: row.institution_name,
    institutionCode: row.institution_code,
    region: row.region,
    case1: {
      id: row.case1_id,
      caseNumber: row.case1_number,
      bureau: row.case1_bureau,
      category: row.case1_category,
      subject: row.case1_subject,
      status: row.case1_status,
      submissionDate: row.case1_submission_date,
      complainantType: row.case1_complainant_type,
      summary: row.case1_summary,
    },
    case2: {
      id: row.case2_id,
      caseNumber: row.case2_number,
      bureau: row.case2_bureau,
      category: row.case2_category,
      subject: row.case2_subject,
      status: row.case2_status,
      submissionDate: row.case2_submission_date,
      complainantType: row.case2_complainant_type,
      summary: row.case2_summary,
    },
    similarityScore: row.similarity_score,
    priority: row.priority,
    detectedDate: row.detected_date,
    matchingReasons,
    ruleMatches,
    reviewStatus: row.review_status,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewNotes: row.review_notes,
  };
}

export function rowToCoordinationRequest(row: any) {
  let remarks = [];
  try {
    if (row.remarks_json) {
      remarks = typeof row.remarks_json === 'string' ? JSON.parse(row.remarks_json) : row.remarks_json;
    }
  } catch {}

  return {
    id: row.id,
    requestNumber: row.request_number,
    linkedCaseId: row.linked_case_id,
    linkedCaseNumber: row.linked_case_number,
    institutionName: row.institution_name,
    institutionCode: row.institution_code,
    requestingBureau: row.requesting_bureau,
    targetBureau: row.target_bureau,
    title: row.title,
    description: row.description,
    priority: row.priority,
    assignedOwner: row.assigned_owner,
    status: row.status,
    followUpDeadline: row.follow_up_deadline,
    remarks,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToNotice(row: any) {
  return {
    id: row.id,
    noticeNumber: row.notice_number,
    caseId: row.case_id,
    caseNumber: row.case_number,
    institutionName: row.institution_name,
    institutionCode: row.institution_code,
    noticeType: row.notice_type,
    reason: row.reason,
    noticeDate: row.notice_date,
    responseDeadline: row.response_deadline,
    remarks: row.remarks,
    supportingDocs: row.supporting_docs,
    issuedBy: row.issued_by,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function rowToInstitutionResponse(row: any) {
  let supportingDocuments = [];
  try {
    if (row.supporting_documents_json) {
      supportingDocuments = typeof row.supporting_documents_json === 'string' ? JSON.parse(row.supporting_documents_json) : row.supporting_documents_json;
    }
  } catch {}

  return {
    id: row.id,
    responseNumber: row.response_number,
    caseId: row.case_id,
    caseNumber: row.case_number,
    noticeId: row.notice_id,
    noticeNumber: row.notice_number,
    institutionCode: row.institution_code,
    institutionName: row.institution_name,
    bureau: row.bureau,
    subject: row.subject,
    responseText: row.response_text,
    supportingDocuments,
    submittedByName: row.submitted_by_name,
    submittedByDesignation: row.submitted_by_designation,
    submissionDate: row.submission_date,
    status: row.status,
    bureauFeedback: row.bureau_feedback,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToInstitutionProfile(row: any) {
  return {
    code: row.code,
    name: row.name,
    type: row.type,
    state: row.state,
    district: row.district,
    region: row.region,
    address: row.address,
    principalName: row.principal_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    nodalOfficerName: row.nodal_officer_name,
    nodalOfficerEmail: row.nodal_officer_email,
    nodalOfficerPhone: row.nodal_officer_phone,
    website: row.website,
    updatedAt: row.updated_at,
  };
}
