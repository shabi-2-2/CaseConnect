import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { rowToCoordinationRequest } from '@/lib/db';
import { Database } from '@/lib/supabase/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const bureau = searchParams.get('bureau');

    const supabase = getSupabaseServerClient();
    let query = supabase.from('coordination_requests').select('*').order('created_at', { ascending: false });

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }
    if (bureau && bureau !== 'ALL') {
      query = query.or(`requesting_bureau.eq.${bureau},target_bureau.eq.${bureau}`);
    }

    const { data: rows, error } = await query;
    if (error) {
      console.error('Supabase fetch coordination error:', error.message);
      return NextResponse.json({ error: 'Failed to fetch coordination requests' }, { status: 500 });
    }

    const requests = (rows || []).map((r) => rowToCoordinationRequest(r));
    return NextResponse.json({ requests }, { status: 200 });
  } catch (error) {
    console.error('Error fetching coordination requests:', error);
    return NextResponse.json({ error: 'Failed to fetch coordination requests' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.title || !body.institutionName) {
      return NextResponse.json({ error: 'Missing required coordination fields' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const id = body.id || `cr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const requestNumber = body.requestNumber || `CR-2026-${randomSeq}`;

    const initialRemarks = body.initialRemark
      ? [
          {
            id: `rem-${Date.now()}`,
            author: body.creatorName || 'PGRC Official',
            role: body.creatorRole || 'PGRC Official',
            text: body.initialRemark,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          },
        ]
      : [];

    const newRequest = {
      id,
      request_number: requestNumber,
      linked_case_id: body.linkedCaseId || '',
      linked_case_number: body.linkedCaseNumber || '',
      institution_name: body.institutionName,
      institution_code: body.institutionCode || '',
      requesting_bureau: body.requestingBureau || 'PGRC',
      target_bureau: body.targetBureau || 'Regulation Bureau',
      title: body.title,
      description: body.description || '',
      priority: body.priority || 'Medium',
      assigned_owner: body.assignedOwner || 'PGRC Coordination Officer',
      status: body.status || 'Awaiting RB Response',
      follow_up_deadline: body.followUpDeadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      remarks_json: JSON.stringify(initialRemarks),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertErr } = await supabase
      .from('coordination_requests')
      .insert(newRequest)
      .select()
      .single();

    if (insertErr) {
      console.error('Supabase create coordination error:', insertErr.message);
      return NextResponse.json({ error: 'Failed to create coordination request' }, { status: 500 });
    }

    // Also log to case_history if linked to a case
    if (body.linkedCaseId) {
      try {
        await supabase.from('case_history').insert({
          id: `hist-coord-${Date.now()}`,
          case_id: body.linkedCaseId,
          case_number: body.linkedCaseNumber || body.linkedCaseId,
          action: `Coordination Request Filed (${requestNumber})`,
          previous_status: null,
          new_status: null,
          actor_name: body.creatorName || 'PGRC Official',
          actor_role: body.creatorRole || 'PGRC Official',
          remarks: `Inter-bureau coordination initiated with ${body.targetBureau || 'Regulation Bureau'}: ${body.title}`,
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to log coordination action to history', err);
      }
    }

    return NextResponse.json({ request: rowToCoordinationRequest(inserted) }, { status: 201 });
  } catch (error) {
    console.error('Error creating coordination request:', error);
    return NextResponse.json({ error: 'Failed to create coordination request' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.id) {
      return NextResponse.json({ error: 'Missing request ID' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data: existing, error: fetchErr } = await supabase
      .from('coordination_requests')
      .select('*')
      .eq('id', body.id)
      .maybeSingle();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Coordination request not found' }, { status: 404 });
    }

    let remarks = [];
    try {
      if (existing.remarks_json) {
        remarks = typeof existing.remarks_json === 'string' ? JSON.parse(existing.remarks_json) : existing.remarks_json;
      }
    } catch {}

    if (body.newRemark && body.newRemark.trim()) {
      remarks.push({
        id: `rem-${Date.now()}`,
        author: body.author || 'PGRC Official',
        role: body.role || 'PGRC Official',
        text: body.newRemark.trim(),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      });
    }

    const updates: Database['public']['Tables']['coordination_requests']['Update'] = {
      remarks_json: JSON.stringify(remarks),
      updated_at: new Date().toISOString(),
    };

    if (body.status !== undefined) updates.status = body.status;
    if (body.assignedOwner !== undefined) updates.assigned_owner = body.assignedOwner;
    if (body.followUpDeadline !== undefined) updates.follow_up_deadline = body.followUpDeadline;
    if (body.priority !== undefined) updates.priority = body.priority;

    const { data: updated, error: updateErr } = await supabase
      .from('coordination_requests')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single();

    if (updateErr) {
      console.error('Supabase update coordination error:', updateErr.message);
      return NextResponse.json({ error: 'Failed to update coordination request' }, { status: 500 });
    }

    // If resolved or status changed, log to case history if case linked
    if (body.status && body.status !== existing.status && existing.linked_case_id) {
      try {
        await supabase.from('case_history').insert({
          id: `hist-coord-${Date.now()}`,
          case_id: existing.linked_case_id,
          case_number: existing.linked_case_number || existing.linked_case_id,
          action: `Coordination Status: ${body.status}`,
          previous_status: null,
          new_status: null,
          actor_name: body.author || 'PGRC Official',
          actor_role: body.role || 'PGRC Official',
          remarks: body.newRemark || `Coordination request ${existing.request_number} updated to ${body.status}`,
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to log coordination update to history', err);
      }
    }

    return NextResponse.json({ request: rowToCoordinationRequest(updated) }, { status: 200 });
  } catch (error) {
    console.error('Error updating coordination request:', error);
    return NextResponse.json({ error: 'Failed to update coordination request' }, { status: 500 });
  }
}
