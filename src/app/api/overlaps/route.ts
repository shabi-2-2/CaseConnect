import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { rowToOverlap } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const supabase = getSupabaseServerClient();
    let query = supabase.from('overlap_alerts').select('*').order('detected_date', { ascending: false });

    if (status) {
      query = query.eq('review_status', status);
    }

    const { data: rows, error } = await query;
    if (error) {
      console.error('Supabase fetch overlaps error:', error.message);
      return NextResponse.json({ error: 'Failed to fetch overlap alerts' }, { status: 500 });
    }

    const overlaps = (rows || []).map((r) => rowToOverlap(r));
    return NextResponse.json({ overlaps }, { status: 200 });
  } catch (error) {
    console.error('Error fetching overlaps:', error);
    return NextResponse.json({ error: 'Failed to fetch overlap alerts' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.id) {
      return NextResponse.json({ error: 'Missing alert ID' }, { status: 400 });
    }

    const { id, reviewStatus, reviewedBy, reviewNotes } = body;
    const supabase = getSupabaseServerClient();

    const { data: existing, error: fetchErr } = await supabase
      .from('overlap_alerts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) {
      console.error('Supabase fetch existing overlap error:', fetchErr.message);
      return NextResponse.json({ error: 'Failed to update overlap alert' }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ error: 'Overlap alert not found' }, { status: 404 });
    }

    const reviewedAt = new Date().toISOString().split('T')[0];
    const reviewer = reviewedBy || 'Senior Management Officer';

    const { data: updated, error: updateErr } = await supabase
      .from('overlap_alerts')
      .update({
        review_status: reviewStatus,
        reviewed_by: reviewer,
        reviewed_at: reviewedAt,
        review_notes: reviewNotes || '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      console.error('Supabase update overlap error:', updateErr.message);
      return NextResponse.json({ error: 'Failed to update overlap alert' }, { status: 500 });
    }

    // If decision was Confirmed Related or Duplicate, mark complaints or log history
    try {
      if (reviewStatus === 'Confirmed Related' || reviewStatus === 'Confirmed Duplicate') {
        await supabase
          .from('complaints')
          .update({ has_overlap_alert: true })
          .in('id', [existing.case1_id, existing.case2_id]);
      }

      // Also log to case history for both cases
      const actionText = `Overlap review: ${reviewStatus}`;
      const now = new Date().toISOString();
      await supabase.from('case_history').insert([
        {
          id: `hist-ovr-${Date.now()}-1`,
          case_id: existing.case1_id,
          case_number: existing.case1_number,
          action: actionText,
          previous_status: existing.case1_status,
          new_status: existing.case1_status,
          actor_name: reviewer,
          actor_role: 'Senior Management',
          remarks: `Linked with ${existing.case2_number}. Note: ${reviewNotes || 'Confirmed by senior management review.'}`,
          created_at: now,
        },
        {
          id: `hist-ovr-${Date.now()}-2`,
          case_id: existing.case2_id,
          case_number: existing.case2_number,
          action: actionText,
          previous_status: existing.case2_status,
          new_status: existing.case2_status,
          actor_name: reviewer,
          actor_role: 'Senior Management',
          remarks: `Linked with ${existing.case1_number}. Note: ${reviewNotes || 'Confirmed by senior management review.'}`,
          created_at: now,
        },
      ]);
    } catch (e) {
      console.error('Failed to log overlap decision in case history', e);
    }

    return NextResponse.json({ overlap: rowToOverlap(updated) }, { status: 200 });
  } catch (error) {
    console.error('Error updating overlap alert:', error);
    return NextResponse.json({ error: 'Failed to update overlap alert' }, { status: 500 });
  }
}
