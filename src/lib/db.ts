import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { SAMPLE_CASES, SAMPLE_OVERLAPS, SAMPLE_INSTITUTIONS } from '@/data/mockData';

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

  database.exec(`
    CREATE TABLE IF NOT EXISTS coordination_requests (
      id TEXT PRIMARY KEY,
      request_number TEXT,
      linked_case_id TEXT,
      linked_case_number TEXT,
      institution_name TEXT,
      institution_code TEXT,
      requesting_bureau TEXT,
      target_bureau TEXT,
      title TEXT,
      description TEXT,
      priority TEXT,
      assigned_owner TEXT,
      status TEXT DEFAULT 'Awaiting RB Response',
      follow_up_deadline TEXT,
      remarks_json TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS regulatory_notices (
      id TEXT PRIMARY KEY,
      notice_number TEXT,
      case_id TEXT,
      case_number TEXT,
      institution_name TEXT,
      institution_code TEXT,
      notice_type TEXT,
      reason TEXT,
      notice_date TEXT,
      response_deadline TEXT,
      remarks TEXT,
      supporting_docs TEXT,
      issued_by TEXT,
      status TEXT DEFAULT 'Issued',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  database.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_institution_name ON complaints(institution_name);`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_submission_date ON complaints(submission_date);`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_complaints_bureau ON complaints(bureau);`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_overlaps_review_status ON overlap_alerts(review_status);`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_case_history_case_id ON case_history(case_id);`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_coordination_status ON coordination_requests(status);`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_notices_case_id ON regulatory_notices(case_id);`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_notices_institution ON regulatory_notices(institution_code);`);

  database.exec(`
    CREATE TABLE IF NOT EXISTS institution_responses (
      id TEXT PRIMARY KEY,
      response_number TEXT,
      case_id TEXT,
      case_number TEXT,
      notice_id TEXT,
      notice_number TEXT,
      institution_code TEXT,
      institution_name TEXT,
      bureau TEXT,
      subject TEXT,
      response_text TEXT,
      supporting_documents_json TEXT,
      submitted_by_name TEXT,
      submitted_by_designation TEXT,
      submission_date TEXT,
      status TEXT DEFAULT 'Submitted',
      bureau_feedback TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_inst_resp_inst ON institution_responses(institution_code);`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_inst_resp_case ON institution_responses(case_id);`);

  database.exec(`
    CREATE TABLE IF NOT EXISTS institution_profiles (
      code TEXT PRIMARY KEY,
      name TEXT,
      type TEXT,
      state TEXT,
      district TEXT,
      region TEXT,
      address TEXT,
      principal_name TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      nodal_officer_name TEXT,
      nodal_officer_email TEXT,
      nodal_officer_phone TEXT,
      website TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
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

  // Seed coordination_requests if empty
  const countCoord = database.prepare('SELECT COUNT(*) as count FROM coordination_requests').get() as { count: number };
  if (countCoord.count === 0) {
    const insertCoord = database.prepare(`
      INSERT INTO coordination_requests (
        id, request_number, linked_case_id, linked_case_number, institution_name, institution_code,
        requesting_bureau, target_bureau, title, description, priority, assigned_owner, status,
        follow_up_deadline, remarks_json, created_at, updated_at
      ) VALUES (
        @id, @request_number, @linked_case_id, @linked_case_number, @institution_name, @institution_code,
        @requesting_bureau, @target_bureau, @title, @description, @priority, @assigned_owner, @status,
        @follow_up_deadline, @remarks_json, @created_at, @updated_at
      )
    `);

    const initialCoords = [
      {
        id: 'cr-001',
        request_number: 'CR-2026-081',
        linked_case_id: 'case-001',
        linked_case_number: 'AICTE/PGRC/2026/8841',
        institution_name: 'Apex Institute of Technology & Engineering',
        institution_code: '1-3329182741',
        requesting_bureau: 'PGRC',
        target_bureau: 'Regulation Bureau',
        title: 'Joint Audit for Capitation Levy & Fee Ledger Verification',
        description: 'PGRC received student complaints regarding withholding degrees for capitation charges. Requesting RB inspection report on approved fee structures.',
        priority: 'Critical',
        assigned_owner: 'Dr. K. S. Rathore',
        status: 'Awaiting RB Response',
        follow_up_deadline: '2026-11-05',
        remarks_json: JSON.stringify([
          {
            id: 'rem-1',
            author: 'PGRC Scrutiny Officer',
            role: 'PGRC Official',
            text: 'Dispatched formal query to Regulation Bureau coordinator citing Section 10(b) inquiry.',
            timestamp: '2026-10-22 11:30',
          },
        ]),
        created_at: '2026-10-22 11:30:00',
        updated_at: '2026-10-22 11:30:00',
      },
      {
        id: 'cr-002',
        request_number: 'CR-2026-082',
        linked_case_id: 'case-003',
        linked_case_number: 'AICTE/PGRC/2026/6612',
        institution_name: 'Kalinga Regional Engineering College',
        institution_code: '1-4491028374',
        requesting_bureau: 'PGRC',
        target_bureau: 'Regulation Bureau',
        title: 'Faculty Cadre Ratio & Sanctioned Intake Scrutiny',
        description: 'Verify if the 4-year technical approval conditions were satisfied prior to addressing faculty termination grievance.',
        priority: 'High',
        assigned_owner: 'Er. Ramesh Verma',
        status: 'In Joint Review',
        follow_up_deadline: '2026-10-30',
        remarks_json: JSON.stringify([
          {
            id: 'rem-2',
            author: 'RB Joint Director',
            role: 'Regulation Bureau Official',
            text: 'Physical audit report dated 14 Sep 2026 attached. Preliminary findings show deficiency in CSE department.',
            timestamp: '2026-10-24 16:15',
          },
        ]),
        created_at: '2026-10-20 14:00:00',
        updated_at: '2026-10-24 16:15:00',
      },
      {
        id: 'cr-003',
        request_number: 'CR-2026-083',
        linked_case_id: 'case-004',
        linked_case_number: 'AICTE/PGRC/2026/7721',
        institution_name: 'Saraswati Global Business School',
        institution_code: '1-2291038472',
        requesting_bureau: 'Regulation Bureau',
        target_bureau: 'PGRC',
        title: 'Fee Refund Directive Compliance Verification',
        description: 'Regulation Bureau issued compliance notice. Confirm if the student grievants have received certified RTGS refund credits.',
        priority: 'Medium',
        assigned_owner: 'Dr. Ananya Sen',
        status: 'Awaiting PGRC Action',
        follow_up_deadline: '2026-11-02',
        remarks_json: JSON.stringify([
          {
            id: 'rem-3',
            author: 'RB Grievance Cell',
            role: 'Regulation Bureau Official',
            text: 'Institution claims full refund processed on 18 Oct. Awaiting complainant confirmation from PGRC.',
            timestamp: '2026-10-23 09:45',
          },
        ]),
        created_at: '2026-10-23 09:45:00',
        updated_at: '2026-10-23 09:45:00',
      },
      {
        id: 'cr-004',
        request_number: 'CR-2026-079',
        linked_case_id: 'case-009',
        linked_case_number: 'AICTE/PGRC/2026/1044',
        institution_name: 'Royal College of Polytechnic & Technology',
        institution_code: '1-4410293810',
        requesting_bureau: 'PGRC',
        target_bureau: 'Regulation Bureau',
        title: 'Mechanical Workshop Safety Certification Reconciliation',
        description: 'Student safety grievance regarding workshop machinery. Reconciled with state fire & factory inspectorate certification.',
        priority: 'Low',
        assigned_owner: 'Dr. Rajeshwar Rao',
        status: 'Resolved',
        follow_up_deadline: '2026-10-20',
        remarks_json: JSON.stringify([
          {
            id: 'rem-4',
            author: 'PGRC Regional Officer',
            role: 'PGRC Official',
            text: 'Institution submitted compliant fitness report and upgraded safety gear. Joint inspection cleared.',
            timestamp: '2026-10-20 17:00',
          },
        ]),
        created_at: '2026-10-10 10:00:00',
        updated_at: '2026-10-20 17:00:00',
      },
    ];

    for (const cr of initialCoords) {
      insertCoord.run(cr);
    }
  }

  // Seed regulatory_notices if empty
  const countNotices = database.prepare('SELECT COUNT(*) as count FROM regulatory_notices').get() as { count: number };
  if (countNotices.count === 0) {
    const insertNotice = database.prepare(`
      INSERT INTO regulatory_notices (
        id, notice_number, case_id, case_number, institution_name, institution_code,
        notice_type, reason, notice_date, response_deadline, remarks, supporting_docs,
        issued_by, status, created_at
      ) VALUES (
        @id, @notice_number, @case_id, @case_number, @institution_name, @institution_code,
        @notice_type, @reason, @notice_date, @response_deadline, @remarks, @supporting_docs,
        @issued_by, @status, @created_at
      )
    `);

    const initialNotices = [
      {
        id: 'not-001',
        notice_number: 'RN-2026-041',
        case_id: 'case-002',
        case_number: 'AICTE/REG/2026/0412',
        institution_name: 'Metro City College of Engineering',
        institution_code: '1-2098471625',
        notice_type: 'Show Cause Notice',
        reason: 'Unapproved AI & Data Science intake expansion and unauthorized section creation in violation of AICTE Approval Process Handbook (APH) 2026-27.',
        notice_date: '2026-10-18',
        response_deadline: '2026-11-02',
        remarks: 'Hearing scheduled before Scrutiny Committee. Institution directed to produce council sanction and faculty register.',
        supporting_docs: 'Inspection Report RB/IR/2026/09; GIS Geo-tag photos',
        issued_by: 'Er. Sandeep Mukherjee, Director (Regulation)',
        status: 'Issued',
        created_at: '2026-10-18 11:00:00',
      },
      {
        id: 'not-002',
        notice_number: 'RN-2026-042',
        case_id: 'case-005',
        case_number: 'AICTE/REG/2026/1102',
        institution_name: 'National Technical Academy',
        institution_code: '1-9874102938',
        notice_type: 'Compliance Directive',
        reason: 'Severe faculty cadre ratio deficiency (1:35 against mandatory 1:20 norm) in Mechanical and Civil Engineering disciplines.',
        notice_date: '2026-10-12',
        response_deadline: '2026-10-27',
        remarks: 'Mandatory rectification deadline set. Non-compliance shall attract intake curtailment for AY 2027-28.',
        supporting_docs: 'Annual Faculty Return (AFR) audit summary; EPF contribution ledger',
        issued_by: 'Dr. Anita Desai, Joint Director',
        status: 'Issued',
        created_at: '2026-10-12 14:30:00',
      },
    ];

    for (const not of initialNotices) {
      insertNotice.run(not);
    }
  }

  // Seed institution_profiles if empty
  const countProfiles = database.prepare('SELECT COUNT(*) as count FROM institution_profiles').get() as { count: number };
  if (countProfiles.count === 0) {
    const insertProfile = database.prepare(`
      INSERT INTO institution_profiles (
        code, name, type, state, district, region, address, principal_name,
        contact_email, contact_phone, nodal_officer_name, nodal_officer_email,
        nodal_officer_phone, website, updated_at
      ) VALUES (
        @code, @name, @type, @state, @district, @region, @address, @principal_name,
        @contact_email, @contact_phone, @nodal_officer_name, @nodal_officer_email,
        @nodal_officer_phone, @website, datetime('now')
      )
    `);

    for (const inst of SAMPLE_INSTITUTIONS) {
      insertProfile.run({
        code: inst.code,
        name: inst.name,
        type: inst.type,
        state: inst.state,
        district: inst.district,
        region: inst.region,
        address: inst.address || `${inst.name}, ${inst.district}, ${inst.state}`,
        principal_name: inst.principalName || 'Dr. Principal In-Charge',
        contact_email: inst.contactEmail || `contact@${inst.code.replace(/[^a-zA-Z0-9]/g, '')}.edu.in`,
        contact_phone: inst.contactPhone || '+91 11 23200000',
        nodal_officer_name: 'Dr. S. K. Narayanan (Grievance Officer)',
        nodal_officer_email: `grievance@${inst.code.replace(/[^a-zA-Z0-9]/g, '')}.edu.in`,
        nodal_officer_phone: '+91 98765 43210',
        website: `https://${inst.code.replace(/[^a-zA-Z0-9]/g, '')}.edu.in`,
      });
    }
  }

  // Seed institution_responses if empty
  const countResponses = database.prepare('SELECT COUNT(*) as count FROM institution_responses').get() as { count: number };
  if (countResponses.count === 0) {
    const insertResponse = database.prepare(`
      INSERT INTO institution_responses (
        id, response_number, case_id, case_number, notice_id, notice_number,
        institution_code, institution_name, bureau, subject, response_text,
        supporting_documents_json, submitted_by_name, submitted_by_designation,
        submission_date, status, bureau_feedback, created_at, updated_at
      ) VALUES (
        @id, @response_number, @case_id, @case_number, @notice_id, @notice_number,
        @institution_code, @institution_name, @bureau, @subject, @response_text,
        @supporting_documents_json, @submitted_by_name, @submitted_by_designation,
        @submission_date, @status, @bureau_feedback, @created_at, @updated_at
      )
    `);

    const initialResponses = [
      {
        id: 'resp-001',
        response_number: 'CR-INST-2026-001',
        case_id: 'case-001',
        case_number: 'AICTE/PGRC/2026/8841',
        notice_id: 'not-001',
        notice_number: 'RN-2026-041',
        institution_code: '1-3329182741',
        institution_name: 'Apex Institute of Technology & Engineering',
        bureau: 'PGRC',
        subject: 'Compliance Clarification regarding Capitation Fee & Degree Release',
        response_text: 'In reference to inquiry AICTE/PGRC/2026/8841, the institution clarifies that all original mark sheets and migration certificates have been dispatched to the concerned candidates via registered post. Bank statements verifying zero additional fee levy attached.',
        supporting_documents_json: JSON.stringify([
          { name: 'Postal_Receipts_Certificate_Dispatch.pdf', size: '2.4 MB', type: 'application/pdf', uploadDate: '2026-10-23' },
          { name: 'Fee_Audit_Chartered_Accountant_Attestation.pdf', size: '1.8 MB', type: 'application/pdf', uploadDate: '2026-10-23' },
        ]),
        submitted_by_name: 'Dr. Ramesh Chandra Gupta',
        submitted_by_designation: 'Principal / Authorized Representative',
        submission_date: '2026-10-23',
        status: 'Under Review',
        bureau_feedback: 'Documentary receipts under scrutiny by AICTE regional standing panel.',
        created_at: '2026-10-23 15:30:00',
        updated_at: '2026-10-23 15:30:00',
      },
      {
        id: 'resp-002',
        response_number: 'CR-INST-2026-002',
        case_id: 'case-002',
        case_number: 'AICTE/REG/2026/0412',
        notice_id: 'not-001',
        notice_number: 'RN-2026-041',
        institution_code: '1-2098471625',
        institution_name: 'Metro City College of Engineering',
        bureau: 'Regulation Bureau',
        subject: 'Written Representation to Show Cause Notice RN-2026-041',
        response_text: 'The institution has submitted an application for regularisation of AI & Data Science intake prior to the commencement of the academic session. Affiliation resolution and laboratory expenditure vouchers are submitted for council verification.',
        supporting_documents_json: JSON.stringify([
          { name: 'University_Affiliation_Resolution_2026.pdf', size: '3.1 MB', type: 'application/pdf', uploadDate: '2026-10-24' },
          { name: 'AI_Lab_Hardware_Invoices.pdf', size: '4.5 MB', type: 'application/pdf', uploadDate: '2026-10-24' },
        ]),
        submitted_by_name: 'Dr. Vikram Malhotra',
        submitted_by_designation: 'Dean (Academic Affairs)',
        submission_date: '2026-10-24',
        status: 'Submitted',
        bureau_feedback: 'Listed for hearing before Scrutiny Committee.',
        created_at: '2026-10-24 11:15:00',
        updated_at: '2026-10-24 11:15:00',
      },
    ];

    for (const r of initialResponses) {
      insertResponse.run(r);
    }
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

export function rowToCoordinationRequest(row: any) {
  let remarks = [];
  try {
    if (row.remarks_json) remarks = JSON.parse(row.remarks_json);
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
      supportingDocuments = JSON.parse(row.supporting_documents_json);
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


