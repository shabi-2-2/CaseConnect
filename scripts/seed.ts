import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import {
  SAMPLE_CASES,
  SAMPLE_OVERLAPS,
  SAMPLE_INSTITUTIONS,
} from '../src/data/mockData';

// Load .env.local if present
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing SUPABASE_URL or Supabase API key.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

export async function seedDatabase() {
  console.log(`Starting deterministic seeding on ${supabaseUrl}...`);

  // 1. Complaints
  const complaintRows = SAMPLE_CASES.map((c) => ({
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
    has_overlap_alert: Boolean(c.hasOverlapAlert),
    overlap_case_id: c.overlapDetails?.overlapCaseId || null,
    overlap_bureau: c.overlapDetails?.overlapBureau || null,
    overlap_match_score: c.overlapDetails?.matchScore || null,
    overlap_reason: c.overlapDetails?.reason || null,
    assigned_officer: c.assignedOfficer,
    last_updated: c.lastUpdated,
    summary: c.summary,
    raw_json: JSON.stringify(c),
    management_flagged: Boolean(c.managementFlagged),
    follow_up_json: c.followUp ? JSON.stringify(c.followUp) : null,
    notes_json: c.managementNotes ? JSON.stringify(c.managementNotes) : null,
  }));

  const { error: compErr } = await supabase
    .from('complaints')
    .upsert(complaintRows, { onConflict: 'id' });
  if (compErr) throw new Error(`Complaints seed failed: ${compErr.message}`);
  console.log(`✓ Seeded ${complaintRows.length} complaints.`);

  // 2. Overlap Alerts
  const overlapRows = SAMPLE_OVERLAPS.map((ovr) => ({
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
  }));

  const { error: ovrErr } = await supabase
    .from('overlap_alerts')
    .upsert(overlapRows, { onConflict: 'id' });
  if (ovrErr) throw new Error(`Overlap alerts seed failed: ${ovrErr.message}`);
  console.log(`✓ Seeded ${overlapRows.length} overlap alerts.`);

  // 3. Case History
  const historyRows: any[] = [];
  for (const c of SAMPLE_CASES.slice(0, 15)) {
    historyRows.push({
      id: `hist-reg-${c.id}`,
      case_id: c.id,
      case_number: c.caseNumber,
      action: 'Complaint Registered',
      previous_status: null,
      new_status: 'Pending',
      actor_name: 'AICTE Grievance Portal',
      actor_role: 'System',
      remarks: `Grievance registered under ${c.bureau} for ${c.category}`,
      created_at: `${c.submissionDate}T10:00:00Z`,
    });

    if (c.status !== 'Pending') {
      historyRows.push({
        id: `hist-stat-${c.id}`,
        case_id: c.id,
        case_number: c.caseNumber,
        action: `Status Updated to ${c.status}`,
        previous_status: 'Pending',
        new_status: c.status,
        actor_name: c.assignedOfficer || 'Scrutiny Officer',
        actor_role: c.bureau === 'PGRC' ? 'PGRC Official' : 'Regulation Official',
        remarks: `Official inquiry progressed. Assigned to ${c.assignedOfficer}`,
        created_at: `${c.lastUpdated}T14:30:00Z`,
      });
    }
  }

  const { error: histErr } = await supabase
    .from('case_history')
    .upsert(historyRows, { onConflict: 'id' });
  if (histErr) throw new Error(`Case history seed failed: ${histErr.message}`);
  console.log(`✓ Seeded ${historyRows.length} case history logs.`);

  // 4. Coordination Requests
  const coordinationRows = [
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
      description:
        'PGRC received student complaints regarding withholding degrees for capitation charges. Requesting RB inspection report on approved fee structures.',
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
      created_at: '2026-10-22T11:30:00Z',
      updated_at: '2026-10-22T11:30:00Z',
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
      description:
        'Verify if the 4-year technical approval conditions were satisfied prior to addressing faculty termination grievance.',
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
      created_at: '2026-10-20T14:00:00Z',
      updated_at: '2026-10-24T16:15:00Z',
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
      description:
        'Regulation Bureau issued compliance notice. Confirm if the student grievants have received certified RTGS refund credits.',
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
      created_at: '2026-10-23T09:45:00Z',
      updated_at: '2026-10-23T09:45:00Z',
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
      description:
        'Student safety grievance regarding workshop machinery. Reconciled with state fire & factory inspectorate certification.',
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
      created_at: '2026-10-10T10:00:00Z',
      updated_at: '2026-10-20T17:00:00Z',
    },
  ];

  const { error: coordErr } = await supabase
    .from('coordination_requests')
    .upsert(coordinationRows, { onConflict: 'id' });
  if (coordErr) throw new Error(`Coordination requests seed failed: ${coordErr.message}`);
  console.log(`✓ Seeded ${coordinationRows.length} coordination requests.`);

  // 5. Regulatory Notices
  const noticeRows = [
    {
      id: 'not-001',
      notice_number: 'RN-2026-041',
      case_id: 'case-002',
      case_number: 'AICTE/REG/2026/0412',
      institution_name: 'Metro City College of Engineering',
      institution_code: '1-2098471625',
      notice_type: 'Show Cause Notice',
      reason:
        'Unapproved AI & Data Science intake expansion and unauthorized section creation in violation of AICTE Approval Process Handbook (APH) 2026-27.',
      notice_date: '2026-10-18',
      response_deadline: '2026-11-02',
      remarks:
        'Hearing scheduled before Scrutiny Committee. Institution directed to produce council sanction and faculty register.',
      supporting_docs: 'Inspection Report RB/IR/2026/09; GIS Geo-tag photos',
      issued_by: 'Er. Sandeep Mukherjee, Director (Regulation)',
      status: 'Issued',
      created_at: '2026-10-18T11:00:00Z',
    },
    {
      id: 'not-002',
      notice_number: 'RN-2026-042',
      case_id: 'case-005',
      case_number: 'AICTE/REG/2026/1102',
      institution_name: 'National Technical Academy',
      institution_code: '1-9874102938',
      notice_type: 'Compliance Directive',
      reason:
        'Severe faculty cadre ratio deficiency (1:35 against mandatory 1:20 norm) in Mechanical and Civil Engineering disciplines.',
      notice_date: '2026-10-12',
      response_deadline: '2026-10-27',
      remarks:
        'Mandatory rectification deadline set. Non-compliance shall attract intake curtailment for AY 2027-28.',
      supporting_docs: 'Annual Faculty Return (AFR) audit summary; EPF contribution ledger',
      issued_by: 'Dr. Anita Desai, Joint Director',
      status: 'Issued',
      created_at: '2026-10-12T14:30:00Z',
    },
  ];

  const { error: notErr } = await supabase
    .from('regulatory_notices')
    .upsert(noticeRows, { onConflict: 'id' });
  if (notErr) throw new Error(`Regulatory notices seed failed: ${notErr.message}`);
  console.log(`✓ Seeded ${noticeRows.length} regulatory notices.`);

  // 6. Institution Profiles
  const profileRows = SAMPLE_INSTITUTIONS.map((inst) => ({
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
  }));

  const { error: profErr } = await supabase
    .from('institution_profiles')
    .upsert(profileRows, { onConflict: 'code' });
  if (profErr) throw new Error(`Institution profiles seed failed: ${profErr.message}`);
  console.log(`✓ Seeded ${profileRows.length} institution profiles.`);

  // 7. Institution Responses
  const responseRows = [
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
      response_text:
        'In reference to inquiry AICTE/PGRC/2026/8841, the institution clarifies that all original mark sheets and migration certificates have been dispatched to the concerned candidates via registered post. Bank statements verifying zero additional fee levy attached.',
      supporting_documents_json: JSON.stringify([
        {
          name: 'Postal_Receipts_Certificate_Dispatch.pdf',
          size: '2.4 MB',
          type: 'application/pdf',
          uploadDate: '2026-10-23',
        },
        {
          name: 'Fee_Audit_Chartered_Accountant_Attestation.pdf',
          size: '1.8 MB',
          type: 'application/pdf',
          uploadDate: '2026-10-23',
        },
      ]),
      submitted_by_name: 'Dr. Ramesh Chandra Gupta',
      submitted_by_designation: 'Principal / Authorized Representative',
      submission_date: '2026-10-23',
      status: 'Under Review',
      bureau_feedback: 'Documentary receipts under scrutiny by AICTE regional standing panel.',
      created_at: '2026-10-23T15:30:00Z',
      updated_at: '2026-10-23T15:30:00Z',
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
      response_text:
        'The institution has submitted an application for regularisation of AI & Data Science intake prior to the commencement of the academic session. Affiliation resolution and laboratory expenditure vouchers are submitted for council verification.',
      supporting_documents_json: JSON.stringify([
        {
          name: 'University_Affiliation_Resolution_2026.pdf',
          size: '3.1 MB',
          type: 'application/pdf',
          uploadDate: '2026-10-24',
        },
        {
          name: 'AI_Lab_Hardware_Invoices.pdf',
          size: '4.5 MB',
          type: 'application/pdf',
          uploadDate: '2026-10-24',
        },
      ]),
      submitted_by_name: 'Dr. Vikram Malhotra',
      submitted_by_designation: 'Dean (Academic Affairs)',
      submission_date: '2026-10-24',
      status: 'Submitted',
      bureau_feedback: 'Listed for hearing before Scrutiny Committee.',
      created_at: '2026-10-24T11:15:00Z',
      updated_at: '2026-10-24T11:15:00Z',
    },
  ];

  const { error: respErr } = await supabase
    .from('institution_responses')
    .upsert(responseRows, { onConflict: 'id' });
  if (respErr) throw new Error(`Institution responses seed failed: ${respErr.message}`);
  console.log(`✓ Seeded ${responseRows.length} institution responses.`);

  console.log('🎉 Deterministic seeding successfully completed.');
}

if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase().catch((err) => {
    console.error('Fatal seed error:', err);
    process.exit(1);
  });
}
