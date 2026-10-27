-- CaseConnect Initial Schema Migration for Supabase PostgreSQL
-- Creates all tables, constraints, indexes, and RLS policies

-- 1. Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  case_number TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  institution_code TEXT NOT NULL,
  location TEXT,
  region TEXT,
  bureau TEXT NOT NULL,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  complainant_type TEXT DEFAULT 'Student',
  submission_date TEXT NOT NULL,
  expected_disposal_date TEXT,
  status TEXT NOT NULL,
  priority TEXT DEFAULT 'Medium',
  has_overlap_alert BOOLEAN DEFAULT FALSE,
  overlap_case_id TEXT,
  overlap_bureau TEXT,
  overlap_match_score INTEGER,
  overlap_reason TEXT,
  assigned_officer TEXT,
  last_updated TEXT,
  summary TEXT,
  raw_json TEXT,
  management_flagged BOOLEAN DEFAULT FALSE,
  follow_up_json TEXT,
  notes_json TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Overlap Alerts Table
CREATE TABLE IF NOT EXISTS overlap_alerts (
  id TEXT PRIMARY KEY,
  alert_number TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  institution_code TEXT NOT NULL,
  region TEXT,
  case1_id TEXT NOT NULL,
  case1_number TEXT NOT NULL,
  case1_bureau TEXT NOT NULL,
  case1_category TEXT,
  case1_subject TEXT,
  case1_status TEXT,
  case1_submission_date TEXT,
  case1_complainant_type TEXT,
  case1_summary TEXT,
  case2_id TEXT NOT NULL,
  case2_number TEXT NOT NULL,
  case2_bureau TEXT NOT NULL,
  case2_category TEXT,
  case2_subject TEXT,
  case2_status TEXT,
  case2_submission_date TEXT,
  case2_complainant_type TEXT,
  case2_summary TEXT,
  similarity_score INTEGER NOT NULL,
  priority TEXT NOT NULL,
  detected_date TEXT NOT NULL,
  matching_reasons TEXT,
  rule_matches TEXT,
  review_status TEXT DEFAULT 'Awaiting Review',
  reviewed_by TEXT,
  reviewed_at TEXT,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Case History Audit Ledger
CREATE TABLE IF NOT EXISTS case_history (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  case_number TEXT NOT NULL,
  action TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  actor_name TEXT,
  actor_role TEXT,
  remarks TEXT,
  details TEXT,
  timestamp TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Coordination Requests Table
CREATE TABLE IF NOT EXISTS coordination_requests (
  id TEXT PRIMARY KEY,
  request_number TEXT NOT NULL,
  linked_case_id TEXT,
  linked_case_number TEXT,
  institution_name TEXT NOT NULL,
  institution_code TEXT,
  requesting_bureau TEXT NOT NULL,
  target_bureau TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'Medium',
  assigned_owner TEXT,
  status TEXT DEFAULT 'Awaiting RB Response',
  follow_up_deadline TEXT,
  remarks_json TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Regulatory Notices Table
CREATE TABLE IF NOT EXISTS regulatory_notices (
  id TEXT PRIMARY KEY,
  notice_number TEXT NOT NULL,
  case_id TEXT NOT NULL,
  case_number TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  institution_code TEXT,
  notice_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  notice_date TEXT NOT NULL,
  response_deadline TEXT NOT NULL,
  remarks TEXT,
  supporting_docs TEXT,
  issued_by TEXT,
  status TEXT DEFAULT 'Issued',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Institution Responses Table
CREATE TABLE IF NOT EXISTS institution_responses (
  id TEXT PRIMARY KEY,
  response_number TEXT NOT NULL,
  case_id TEXT,
  case_number TEXT,
  notice_id TEXT,
  notice_number TEXT,
  institution_code TEXT NOT NULL,
  institution_name TEXT,
  bureau TEXT DEFAULT 'PGRC',
  subject TEXT NOT NULL,
  response_text TEXT NOT NULL,
  supporting_documents_json TEXT,
  submitted_by_name TEXT,
  submitted_by_designation TEXT,
  submission_date TEXT,
  status TEXT DEFAULT 'Submitted',
  bureau_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Institution Profiles Table
CREATE TABLE IF NOT EXISTS institution_profiles (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_institution_name ON complaints(institution_name);
CREATE INDEX IF NOT EXISTS idx_complaints_institution_code ON complaints(institution_code);
CREATE INDEX IF NOT EXISTS idx_complaints_submission_date ON complaints(submission_date);
CREATE INDEX IF NOT EXISTS idx_complaints_bureau ON complaints(bureau);
CREATE INDEX IF NOT EXISTS idx_overlaps_review_status ON overlap_alerts(review_status);
CREATE INDEX IF NOT EXISTS idx_case_history_case_id ON case_history(case_id);
CREATE INDEX IF NOT EXISTS idx_case_history_case_number ON case_history(case_number);
CREATE INDEX IF NOT EXISTS idx_coordination_status ON coordination_requests(status);
CREATE INDEX IF NOT EXISTS idx_notices_case_id ON regulatory_notices(case_id);
CREATE INDEX IF NOT EXISTS idx_notices_institution ON regulatory_notices(institution_code);
CREATE INDEX IF NOT EXISTS idx_inst_resp_inst ON institution_responses(institution_code);
CREATE INDEX IF NOT EXISTS idx_inst_resp_case ON institution_responses(case_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE overlap_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordination_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_profiles ENABLE ROW LEVEL SECURITY;

-- Configure RLS policies for authenticated and anon roles
CREATE POLICY "Allow complaints select" ON complaints FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow complaints insert" ON complaints FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow complaints update" ON complaints FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow complaints delete" ON complaints FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Allow overlap_alerts select" ON overlap_alerts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow overlap_alerts insert" ON overlap_alerts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow overlap_alerts update" ON overlap_alerts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow case_history select" ON case_history FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow case_history insert" ON case_history FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow case_history update" ON case_history FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow coordination_requests select" ON coordination_requests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow coordination_requests insert" ON coordination_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow coordination_requests update" ON coordination_requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow regulatory_notices select" ON regulatory_notices FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow regulatory_notices insert" ON regulatory_notices FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow regulatory_notices update" ON regulatory_notices FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow institution_responses select" ON institution_responses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow institution_responses insert" ON institution_responses FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow institution_responses update" ON institution_responses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow institution_profiles select" ON institution_profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow institution_profiles insert" ON institution_profiles FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow institution_profiles update" ON institution_profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
