import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { rowToComplaint } from '@/lib/db';

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

    const supabase = getSupabaseServerClient();
    let query = supabase.from('complaints').select('*').order('submission_date', { ascending: false });

    if (status && validateStatus(status)) {
      query = query.eq('status', status);
    }
    if (institution) {
      query = query.ilike('institution_name', `%${institution}%`);
    }
    if (bureau) {
      query = query.eq('bureau', bureau);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error('Supabase query error:', error.message);
      return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
    }

    const complaints = (rows || []).map((r) => rowToComplaint(r));
    return NextResponse.json({ complaints }, { status: 200 });
  } catch (err: any) {
    console.error('Complaints GET error:', err);
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

    const supabase = getSupabaseServerClient();
    const id = body.id || `case-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const row = {
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
      has_overlap_alert: Boolean(body.hasOverlapAlert),
      overlap_case_id: body.overlapDetails?.overlapCaseId || null,
      overlap_bureau: body.overlapDetails?.overlapBureau || null,
      overlap_match_score: body.overlapDetails?.matchScore || null,
      overlap_reason: body.overlapDetails?.reason || null,
      assigned_officer: body.assignedOfficer || 'TBD',
      last_updated: new Date().toISOString().split('T')[0],
      summary: body.summary || body.subject,
      raw_json: JSON.stringify(body),
    };

    const { data: inserted, error } = await supabase
      .from('complaints')
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error.message);
      return NextResponse.json({ error: 'Failed to create complaint' }, { status: 400 });
    }

    return NextResponse.json({ complaint: rowToComplaint(inserted) }, { status: 201 });
  } catch (err: any) {
    console.error('Complaints POST error:', err);
    return NextResponse.json({ error: 'Failed to create complaint' }, { status: 400 });
  }
}
