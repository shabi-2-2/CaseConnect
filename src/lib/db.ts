import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { SAMPLE_CASES } from '@/data/mockData';

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

  database.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_institution_name ON complaints(institution_name);`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_submission_date ON complaints(submission_date);`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_bureau ON complaints(bureau);`);
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
}

export function rowToComplaint(row: ComplaintRow) {
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
  };
}
