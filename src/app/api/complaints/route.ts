import { NextRequest, NextResponse } from 'next/server';
import { getDb, rowToComplaint } from '@/lib/db';

function validateStatus(s: unknown) {
  const allowed = ['Pending', 'Under Process', 'Disposed', 'Overdue'];
  return typeof s === 'string' && allowed.includes(s);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const institution = searchParams.get('institution');
    const bureau = searchParams.get('bureau');

    const db = getDb();
    let sql = 'SELECT * FROM complaints WHERE 1=1';
    const params: unknown[] = [];

    if (status && validateStatus(status)) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (institution) {
      sql += ' AND institution_name LIKE ?';
      params.push(`%${institution}%`);
    }
    if (bureau) {
      sql += ' AND bureau = ?';
      params.push(bureau);
    }

    sql += ' ORDER BY submission_date DESC';
    const stmt = db.prepare(sql);
    const rows = params.length ? stmt.all(...(params as string[])) : stmt.all();
    const complaints = rows.map((r: any) => rowToComplaint(r));
    return NextResponse.json({ complaints }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const required = ['caseNumber', 'institutionName', 'bureau', 'status', 'subject'];
    for (const r of required) {
      if (!body[r]) {
        return NextResponse.json({ error: `Missing required field: ${r}` }, { status: 400 });
      }
    }
    if (!validateStatus(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const db = getDb();
    const id = body.id || `case-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const stmt = db.prepare(`
      INSERT INTO complaints (
        id, case_number, institution_name, institution_code, location, region, bureau, category, subject,
        complainant_type, submission_date, expected_disposal_date, status, priority, has_overlap_alert,
        overlap_case_id, overlap_bureau, overlap_match_score, overlap_reason, assigned_officer, last_updated, summary, raw_json
      ) VALUES (
        @id, @case_number, @institution_name, @institution_code, @location, @region, @bureau, @category, @subject,
        @complainant_type, @submission_date, @expected_disposal_date, @status, @priority, @has_overlap_alert,
        @overlap_case_id, @overlap_bureau, @overlap_match_score, @overlap_reason, @assigned_officer, @last_updated, @summary, @raw_json
      )
    `);

    const row: any = {
      id,
      case_number: body.caseNumber,
      institution_name: body.institutionName,
      institution_code: body.institutionCode || '',
      location: body.location || '',
      region: body.region || '',
      bureau: body.bureau,
      category: body.category || '',
      subject: body.subject,
      complainant_type: body.complainantType || 'Student',
      submission_date: body.submissionDate || new Date().toISOString().split('T')[0],
      expected_disposal_date: body.expectedDisposalDate || new Date().toISOString().split('T')[0],
      status: body.status,
      priority: body.priority || 'Medium',
      has_overlap_alert: body.hasOverlapAlert ? 1 : 0,
      overlap_case_id: body.overlapDetails?.overlapCaseId || null,
      overlap_bureau: body.overlapDetails?.overlapBureau || null,
      overlap_match_score: body.overlapDetails?.matchScore || null,
      overlap_reason: body.overlapDetails?.reason || null,
      assigned_officer: body.assignedOfficer || 'TBD',
      last_updated: new Date().toISOString().split('T')[0],
      summary: body.summary || body.subject,
      raw_json: JSON.stringify(body),
    };

    stmt.run(row);
    const created = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
    return NextResponse.json({ complaint: rowToComplaint(created as any) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create complaint' }, { status: 400 });
  }
}
