export type BureauType = 'PGRC' | 'Regulation Bureau';

export type CaseStatus = 'Pending' | 'Under Process' | 'Disposed' | 'Overdue';

export type CasePriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type InstitutionType =
  | 'Engineering & Technology'
  | 'Management (MBA/PGDM)'
  | 'Polytechnic / Diploma'
  | 'Pharmacy'
  | 'Architecture & Planning'
  | 'Applied Arts & Crafts';

export interface CaseItem {
  id: string;
  caseNumber: string;
  institutionName: string;
  institutionCode: string;
  location: string;
  state: string;
  district: string;
  region: string;
  bureau: BureauType;
  category: string;
  subject: string;
  complainantType: 'Student' | 'Faculty' | 'Parent' | 'Management' | 'Anonymous';
  submissionDate: string;
  expectedDisposalDate: string;
  status: CaseStatus;
  priority: CasePriority;
  hasOverlapAlert?: boolean;
  overlapDetails?: {
    overlapCaseId: string;
    overlapBureau: BureauType;
    matchScore: number;
    reason: string;
    reviewStatus?: OverlapReviewStatus;
  };
  assignedOfficer: string;
  lastUpdated: string;
  summary: string;
  managementFlagged?: boolean;
  managementNotes?: ManagementNote[];
  followUp?: FollowUpDetails;
}

export interface ManagementNote {
  id: string;
  author: string;
  authorRole: string;
  timestamp: string;
  content: string;
}

export interface FollowUpDetails {
  owner: string;
  deadline: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  instructions?: string;
  assignedAt: string;
}

export interface InstitutionItem {
  id: string;
  name: string;
  code: string;
  type: InstitutionType;
  state: string;
  district: string;
  region: string;
  address: string;
  principalName: string;
  contactEmail: string;
  contactPhone: string;
  approvalStatus: 'Approved' | 'Under Scrutiny' | 'Show Cause Issued' | 'Compliance Verified';
  totalCases: number;
  pendingCases: number;
  underProcessCases: number;
  disposedCases: number;
  overdueCases: number;
  pgrcCasesCount: number;
  regulationCasesCount: number;
  hasActiveOverlap: boolean;
  nirfRank?: string;
  accreditation: string;
  recentActivity?: string;
}

export type OverlapReviewStatus =
  | 'Awaiting Review'
  | 'Confirmed Related'
  | 'Confirmed Duplicate'
  | 'Separate Matters'
  | 'Requires Further Investigation';

export interface OverlapAlertItem {
  id: string;
  alertNumber: string;
  institutionName: string;
  institutionCode: string;
  region: string;
  case1: {
    id: string;
    caseNumber: string;
    bureau: BureauType;
    category: string;
    subject: string;
    status: CaseStatus;
    submissionDate: string;
    complainantType: string;
    summary: string;
  };
  case2: {
    id: string;
    caseNumber: string;
    bureau: BureauType;
    category: string;
    subject: string;
    status: CaseStatus;
    submissionDate: string;
    complainantType: string;
    summary: string;
  };
  similarityScore: number;
  priority: CasePriority;
  detectedDate: string;
  matchingReasons: string[];
  ruleMatches: {
    institutionMatch: boolean;
    categoryMatch: boolean;
    keywordsMatched: string[];
    timeframeMatch: boolean;
  };
  reviewStatus: OverlapReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface KpiMetric {
  id: string;
  title: string;
  value: number;
  changePercent?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtext: string;
  iconName: string;
  accentColor: string;
  badgeText?: string;
}

export interface ActivityItem {
  id: string;
  type: 'submission' | 'status_change' | 'overlap_alert' | 'escalation' | 'closure';
  title: string;
  description: string;
  timestamp: string;
  caseId: string;
  bureau: BureauType;
  priority?: CasePriority;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  unread: boolean;
  type: 'alert' | 'warning' | 'info' | 'success';
  caseId?: string;
  institutionId?: string;
  overlapId?: string;
}

export interface StatusDistribution {
  status: CaseStatus;
  count: number;
  color: string;
  percentage: number;
}

export interface BureauWorkload {
  category: string;
  pgrc: number;
  regulationBureau: number;
}

export interface RegionDistribution {
  region: string;
  shortName: string;
  activeCases: number;
  disposedCases: number;
  total: number;
}

export interface ChartTooltipPayloadItem {
  name?: string;
  value?: number;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
  color?: string;
}

export interface CustomChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipPayloadItem[];
  label?: string;
}

export interface NoticeItem {
  id: string;
  noticeNumber: string;
  caseId: string;
  caseNumber: string;
  institutionName: string;
  institutionCode: string;
  noticeType: string;
  reason: string;
  noticeDate: string;
  responseDeadline: string;
  remarks: string;
  supportingDocs?: string;
  issuedBy: string;
  status: string;
  createdAt?: string;
}
