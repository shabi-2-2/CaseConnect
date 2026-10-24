export type BureauType = 'PGRC' | 'Regulation Bureau';

export type CaseStatus = 'Pending' | 'Under Process' | 'Disposed' | 'Overdue';

export type CasePriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface CaseItem {
  id: string;
  caseNumber: string;
  institutionName: string;
  institutionCode: string;
  location: string;
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
  };
  assignedOfficer: string;
  lastUpdated: string;
  summary: string;
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
