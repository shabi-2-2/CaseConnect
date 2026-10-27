import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { rowToComplaint } from '@/lib/db';
import { Database } from '@/lib/supabase/types';

function validateStatus(s: unknown) {
  const allowed = ['Pending', 'Under Process', 'Disposed', 'Overdue'];
  return typeof s === 'string' && allowed.includes(s);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServerClient();
    const { data: row, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Supabase fetch complaint error:', error.message);
      return NextResponse.json({ error: 'Failed to fetch complaint' }, { status: 500 });
    }

    if (!row) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    return NextResponse.json({ complaint: rowToComplaint(row) }, { status: 200 });
  } catch (err: any) {
    console.error('Complaint GET by ID error:', err);
    return NextResponse.json({ error: 'Failed to fetch complaint' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data: existing, error: fetchErr } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) {
      console.error('Supabase fetch existing complaint error:', fetchErr.message);
      return NextResponse.json({ error: 'Failed to fetch complaint' }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    const updates: Database['public']['Tables']['complaints']['Update'] = {};

    if (body.status !== undefined) {
      if (!validateStatus(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updates.status = body.status;
    }
    if (body.assignedOfficer !== undefined) {
      updates.assigned_officer = body.assignedOfficer;
    }
    if (body.summary !== undefined) {
      updates.summary = body.summary;
    }
    if (body.priority !== undefined) {
      updates.priority = body.priority;
    }
    if (body.expectedDisposalDate !== undefined) {
      updates.expected_disposal_date = body.expectedDisposalDate;
    }
    if (body.hasOverlapAlert !== undefined) {
      updates.has_overlap_alert = Boolean(body.hasOverlapAlert);
    }
    if (body.managementFlagged !== undefined) {
      updates.management_flagged = Boolean(body.managementFlagged);
    }
    if (body.followUp !== undefined) {
      updates.follow_up_json = body.followUp ? JSON.stringify(body.followUp) : null;
    }
    if (body.managementNotes !== undefined) {
      updates.notes_json = JSON.stringify(body.managementNotes);
    }

    updates.last_updated = new Date().toISOString().split('T')[0];
    updates.updated_at = new Date().toISOString();

    const { data: updated, error: updateErr } = await supabase
      .from('complaints')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      console.error('Supabase update complaint error:', updateErr.message);
      return NextResponse.json({ error: 'Failed to update complaint' }, { status: 400 });
    }

    // If status changed, record in case_history
    if (body.status !== undefined && body.status !== existing.status) {
      try {
        const histId = `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        await supabase.from('case_history').insert({
          id: histId,
          case_id: existing.id,
          case_number: existing.case_number,
          action: `Status changed to ${body.status}`,
          previous_status: existing.status,
          new_status: body.status,
          actor_name: body.actorName || body.assignedOfficer || 'Authorized Official',
          actor_role: body.actorRole || 'Official',
          remarks: body.remarks || `Status transitioned from ${existing.status} to ${body.status}`,
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to log history', err);
      }
    }

    return NextResponse.json({ complaint: rowToComplaint(updated) }, { status: 200 });
  } catch (err: any) {
    console.error('Complaint PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update complaint' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServerClient();
    const { data: existing, error: fetchErr } = await supabase
      .from('complaints')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    const { error: delErr } = await supabase.from('complaints').delete().eq('id', id);
    if (delErr) {
      console.error('Supabase delete complaint error:', delErr.message);
      return NextResponse.json({ error: 'Failed to delete complaint' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('Complaint DELETE error:', err);
    return NextResponse.json({ error: 'Failed to delete complaint' }, { status: 500 });
  }
}
