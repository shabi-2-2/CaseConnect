import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');

    const supabase = getSupabaseServerClient();
    let query = supabase.from('case_history').select('*').order('created_at', { ascending: false });

    if (caseId) {
      query = query.or(`case_id.eq.${caseId},case_number.eq.${caseId}`);
    }

    const { data: rows, error } = await query;
    if (error) {
      console.error('Supabase fetch case history error:', error.message);
      return NextResponse.json({ error: 'Failed to fetch case history' }, { status: 500 });
    }

    const history = (rows || []).map((r) => ({
      id: r.id,
      caseId: r.case_id,
      caseNumber: r.case_number,
      action: r.action,
      previousStatus: r.previous_status,
      newStatus: r.new_status,
      actorName: r.actor_name,
      actorRole: r.actor_role,
      remarks: r.remarks || r.details,
      createdAt: r.created_at,
    }));

    return NextResponse.json({ history }, { status: 200 });
  } catch (error) {
    console.error('Error fetching case history:', error);
    return NextResponse.json({ error: 'Failed to fetch case history' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.caseId || !body.action) {
      return NextResponse.json({ error: 'Missing required history fields' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const id = body.id || `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const newRecord = {
      id,
      case_id: body.caseId,
      case_number: body.caseNumber || body.caseId,
      action: body.action,
      previous_status: body.previousStatus || null,
      new_status: body.newStatus || null,
      actor_name: body.actorName || 'Senior Official',
      actor_role: body.actorRole || 'Senior Management',
      remarks: body.remarks || body.details || '',
      created_at: new Date().toISOString(),
    };

    const { data: inserted, error } = await supabase
      .from('case_history')
      .insert(newRecord)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert case history error:', error.message);
      return NextResponse.json({ error: 'Failed to record case history' }, { status: 500 });
    }

    return NextResponse.json({ historyItem: inserted }, { status: 201 });
  } catch (error) {
    console.error('Error recording case history:', error);
    return NextResponse.json({ error: 'Failed to record case history' }, { status: 500 });
  }
}
