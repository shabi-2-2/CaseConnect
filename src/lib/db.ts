import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { SAMPLE_CASES, SAMPLE_OVERLAPS } from '@/data/mockData';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'caseconnect.db');

let db: Database.Database | null = null;

function ensureDbDir() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

function initSchema(database: Database.Database) {
  database.pragma('journal_mode = WAL');
  database.pragma('foreign_keys = ON');
  database.pragma('busy_timeout = 5000');

  database.exec(`
    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      case_number TEXT,
      institution_name TEXT,
      institution_code TEXT,
      location TEXT,
      region TEXT,
      bureau TEXT,
      category TEXT,
      subject TEXT,
      complainant_type TEXT,
      submission_date TEXT,
      expected_disposal_date TEXT,
      status TEXT,
      priority TEXT,
      has_overlap_alert INTEGER DEFAULT 0,
      overlap_case_id TEXT,
      overlap_bureau TEXT,
      overlap_match_score INTEGER,
      overlap_reason TEXT,
      assigned_officer TEXT,
      last_updated TEXT,
      summary TEXT,
      raw_json TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  try { database.exec(`ALTER TABLE complaints ADD COLUMN management_flagged INTEGER DEFAULT 0;`); } catch {}
  try { database.exec(`ALTER TABLE complaints ADD COLUMN follow_up_json TEXT;`); } catch {}
  try { database.exec(`ALTER TABLE complaints ADD COLUMN notes_json TEXT;`); } catch {}

  database.exec(`
    CREATE TABLE IF NOT EXISTS overlap_alerts (
      id TEXT PRIMARY KEY,
      alert_number TEXT,
      institution_name TEXT,
      institution_code TEXT,
      region TEXT,
      case1_id TEXT,
      case1_number TEXT,
      case1_bureau TEXT,
      case1_category TEXT,
      case1_subject TEXT,
      case1_status TEXT,
      case1_submission_date TEXT,
      case1_complainant_type TEXT,
      case1_summary TEXT,
      case2_id TEXT,
      case2_number TEXT,
      case2_bureau TEXT,
      case2_category TEXT,
      case2_subject TEXT,
      case2_status TEXT,
      case2_submission_date TEXT,
      case2_complainant_type TEXT,
      case2_summary TEXT,
      similarity_score INTEGER,
      priority TEXT,
      detected_date TEXT,
      matching_reasons TEXT,
      rule_matches TEXT,
      review_status TEXT DEFAULT 'Awaiting Review',
      reviewed_by TEXT,
      reviewed_at TEXT,
      review_notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS case_history (
      id TEXT PRIMARY KEY,
      case_id TEXT,
      case_number TEXT,
      action TEXT,
      previous_status TEXT,
      new_status TEXT,
      actor_name TEXT,
      actor_role TEXT,
      remarks TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  database.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_institution_name ON complaints(institution_name);`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_submission_date ON complaints(submission_date);`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_bureau ON complaints(bureau);`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_overlaps_review_status ON overlap_alerts(review_status);`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_case_history_case_id ON case_history(case_id);`);
}

function seedFromMock(database: Database.Database) {
  const insert = database.prepare(`
    INSERT OR IGNORE INTO complaints (
      id, case_number, institution_name, institution_code, location, region, bureau, category, subject,
      complainant_type, submission_date, expected_disposal_date, status, priority, has_overlap_alert,
      overlap_case_id, overlap_bureau, overlap_match_score, overlap_reason, assigned_officer, last_updated, summary, raw_json
    ) VALUES (
      @id, @case_number, @institution_name, @institution_code, @location, @region, @bureau, @category, @subject,
      @complainant_type, @submission_date, @expected_disposal_date, @status, @priority, @has_overlap_alert,
      @overlap_case_id, @overlap_bureau, @overlap_match_score, @overlap_reason, @assigned_officer, @last_updated, @summary, @raw_json
    )
  `);

  const tx = database.transaction((items: typeof SAMPLE_CASES) => {
    for (const c of items) {
      insert.run({
        id: c.id,
        case_number: c.caseNumber,
        institution_name: c.institutionName,
        institution_code: c.institutionCode,
        location: c.location,
        region: c.region,
        bureau: c.bureau,
        category: c.category,
        subject: c.subject,
        complainant_type: c.complainantType,
        submission_date: c.submissionDate,
        expected_disposal_date: c.expectedDisposalDate,
        status: c.status,
        priority: c.priority,
        has_overlap_alert: c.hasOverlapAlert ? 1 : 0,
        overlap_case_id: c.overlapDetails?.overlapCaseId || null,
        overlap_bureau: c.overlapDetails?.overlapBureau || null,
        overlap_match_score: c.overlapDetails?.matchScore || null,
        overlap_reason: c.overlapDetails?.reason || null,
        assigned_officer: c.assignedOfficer,
        last_updated: c.lastUpdated,
        summary: c.summary,
        raw_json: JSON.stringify(c),
      });
    }
  });

  tx(SAMPLE_CASES);

  // Seed overlap_alerts if empty
  const countOverlaps = database.prepare('SELECT COUNT(*) as count FROM overlap_alerts').get() as { count: number };
  if (countOverlaps.count === 0 && SAMPLE_OVERLAPS && SAMPLE_OVERLAPS.length > 0) {
    const insertOverlap = database.prepare(`
      INSERT OR IGNORE INTO overlap_alerts (
        id, alert_number, institution_name, institution_code, region,
        case1_id, case1_number, case1_bureau, case1_category, case1_subject, case1_status, case1_submission_date, case1_complainant_type, case1_summary,
        case2_id, case2_number, case2_bureau, case2_category, case2_subject, case2_status, case2_submission_date, case2_complainant_type, case2_summary,
        similarity_score, priority, detected_date, matching_reasons, rule_matches, review_status, reviewed_by, reviewed_at, review_notes
      ) VALUES (
        @id, @alert_number, @institution_name, @institution_code, @region,
        @case1_id, @case1_number, @case1_bureau, @case1_category, @case1_subject, @case1_status, @case1_submission_date, @case1_complainant_type, @case1_summary,
        @case2_id, @case2_number, @case2_bureau, @case2_category, @case2_subject, @case2_status, @case2_submission_date, @case2_complainant_type, @case2_summary,
        @similarity_score, @priority, @detected_date, @matching_reasons, @rule_matches, @review_status, @reviewed_by, @reviewed_at, @review_notes
      )
    `);

    const overlapTx = database.transaction((items: typeof SAMPLE_OVERLAPS) => {
      for (const ovr of items) {
        insertOverlap.run({
          id: ovr.id,
          alert_number: ovr.alertNumber,
          institution_name: ovr.institutionName,
          institution_code: ovr.institutionCode,
          region: ovr.region || 'Northern',
          case1_id: ovr.case1.id,
          case1_number: ovr.case1.caseNumber,
          case1_bureau: ovr.case1.bureau,
          case1_category: ovr.case1.category,
          case1_subject: ovr.case1.subject,
          case1_status: ovr.case1.status,
          case1_submission_date: ovr.case1.submissionDate,
          case1_complainant_type: ovr.case1.complainantType,
          case1_summary: ovr.case1.summary,
          case2_id: ovr.case2.id,
          case2_number: ovr.case2.caseNumber,
          case2_bureau: ovr.case2.bureau,
          case2_category: ovr.case2.category,
          case2_subject: ovr.case2.subject,
          case2_status: ovr.case2.status,
          case2_submission_date: ovr.case2.submissionDate,
          case2_complainant_type: ovr.case2.complainantType,
          case2_summary: ovr.case2.summary,
          similarity_score: ovr.similarityScore,
          priority: ovr.priority,
          detected_date: ovr.detectedDate,
          matching_reasons: JSON.stringify(ovr.matchingReasons),
          rule_matches: JSON.stringify(ovr.ruleMatches),
          review_status: ovr.reviewStatus || 'Awaiting Review',
          reviewed_by: ovr.reviewedBy || null,
          reviewed_at: ovr.reviewedAt || null,
          review_notes: ovr.reviewNotes || null,
        });
      }
    });

    overlapTx(SAMPLE_OVERLAPS);
  }

  // Seed initial case history if empty
  const countHistory = database.prepare('SELECT COUNT(*) as count FROM case_history').get() as { count: number };
  if (countHistory.count === 0) {
    const insertHistory = database.prepare(`
      INSERT INTO case_history (id, case_id, case_number, action, previous_status, new_status, actor_name, actor_role, remarks, created_at)
      VALUES (@id, @case_id, @case_number, @action, @previous_status, @new_status, @actor_name, @actor_role, @remarks, @created_at)
    `);

    const historyTx = database.transaction((cases: typeof SAMPLE_CASES) => {
      for (const c of cases.slice(0, 15)) {
        insertHistory.run({
          id: `hist-reg-${c.id}`,
          case_id: c.id,
          case_number: c.caseNumber,
          action: 'Complaint Registered',
          previous_status: null,
          new_status: 'Pending',
          actor_name: 'AICTE Grievance Portal',
          actor_role: 'System',
          remarks: `Grievance registered under ${c.bureau} for ${c.category}`,
          created_at: `${c.submissionDate} 10:00:00`,
        });

        if (c.status !== 'Pending') {
          insertHistory.run({
            id: `hist-stat-${c.id}`,
            case_id: c.id,
            case_number: c.caseNumber,
            action: `Status Updated to ${c.status}`,
            previous_status: 'Pending',
            new_status: c.status,
            actor_name: c.assignedOfficer || 'Scrutiny Officer',
            actor_role: c.bureau === 'PGRC' ? 'PGRC Official' : 'Regulation Official',
            remarks: `Official inquiry progressed. Assigned to ${c.assignedOfficer}`,
            created_at: `${c.lastUpdated} 14:30:00`,
          });
        }
      }
    });

    historyTx(SAMPLE_CASES);
  }
}

export function getDb() {
  if (db) return db;
  ensureDbDir();
  db = new Database(DB_PATH);
  initSchema(db);
  seedFromMock(db);
  return db;
}

interface ComplaintRow {
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
  has_overlap_alert: number;
  overlap_case_id: string | null;
  overlap_bureau: string | null;
  overlap_match_score: number | null;
  overlap_reason: string | null;
  assigned_officer: string;
  last_updated: string;
  summary: string;
  management_flagged?: number;
  follow_up_json?: string | null;
  notes_json?: string | null;
}

export function rowToComplaint(row: ComplaintRow) {
  let notes = [];
  if (row.notes_json) {
    try {
      notes = JSON.parse(row.notes_json);
    } catch {}
  }

  let followUp = undefined;
  if (row.follow_up_json) {
    try {
      followUp = JSON.parse(row.follow_up_json);
    } catch {}
  }

  return {
    id: row.id,
    caseNumber: row.case_number,
    institutionName: row.institution_name,
    institutionCode: row.institution_code,
    location: row.location,
    region: row.region,
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
    matchingReasons = row.matching_reasons ? JSON.parse(row.matching_reasons) : [];
  } catch {}

  let ruleMatches = {
    institutionMatch: true,
    categoryMatch: true,
    keywordsMatched: [],
    timeframeMatch: true,
  };
  try {
    if (row.rule_matches) ruleMatches = JSON.parse(row.rule_matches);
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
