import { NextRequest, NextResponse } from 'next/server';
import { getDb, rowToCoordinationRequest } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const bureau = searchParams.get('bureau');

    const db = getDb();
    let sql = 'SELECT * FROM coordination_requests WHERE 1=1';
    const params: unknown[] = [];

    if (status && status !== 'ALL') {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (bureau && bureau !== 'ALL') {
      sql += ' AND (requesting_bureau = ? OR target_bureau = ?)';
      params.push(bureau, bureau);
    }

    sql += ' ORDER BY created_at DESC';
    const stmt = db.prepare(sql);
    const rows = params.length ? stmt.all(...(params as string[])) : stmt.all();
    const requests = rows.map((r: any) => rowToCoordinationRequest(r));
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

    const db = getDb();
    const id = body.id || `cr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const requestNumber = body.requestNumber || `CR-2026-${randomSeq}`;

    const initialRemarks = body.initialRemark ? [
      {
        id: `rem-${Date.now()}`,
        author: body.creatorName || 'PGRC Official',
        role: body.creatorRole || 'PGRC Official',
        text: body.initialRemark,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      }
    ] : [];

    const stmt = db.prepare(`
      INSERT INTO coordination_requests (
        id, request_number, linked_case_id, linked_case_number, institution_name, institution_code,
        requesting_bureau, target_bureau, title, description, priority, assigned_owner, status,
        follow_up_deadline, remarks_json, created_at, updated_at
      ) VALUES (
        @id, @request_number, @linked_case_id, @linked_case_number, @institution_name, @institution_code,
        @requesting_bureau, @target_bureau, @title, @description, @priority, @assigned_owner, @status,
        @follow_up_deadline, @remarks_json, datetime('now'), datetime('now')
      )
    `);

    stmt.run({
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
    });

    // Also log to case_history if linked to a case
    if (body.linkedCaseId) {
      try {
        db.prepare(`
          INSERT INTO case_history (id, case_id, case_number, action, previous_status, new_status, actor_name, actor_role, remarks, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).run(
          `hist-coord-${Date.now()}`,
          body.linkedCaseId,
          body.linkedCaseNumber || body.linkedCaseId,
          `Coordination Request Filed (${requestNumber})`,
          null,
          null,
          body.creatorName || 'PGRC Official',
          body.creatorRole || 'PGRC Official',
          `Inter-bureau coordination initiated with ${body.targetBureau || 'Regulation Bureau'}: ${body.title}`
        );
      } catch (err) {
        console.error('Failed to log coordination action to history', err);
      }
    }

    const inserted = db.prepare('SELECT * FROM coordination_requests WHERE id = ?').get(id);
    return NextResponse.json({ request: rowToCoordinationRequest(inserted as any) }, { status: 201 });
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

    const db = getDb();
    const existing = db.prepare('SELECT * FROM coordination_requests WHERE id = ?').get(body.id) as any;
    if (!existing) {
      return NextResponse.json({ error: 'Coordination request not found' }, { status: 404 });
    }

    let remarks = [];
    try {
      if (existing.remarks_json) remarks = JSON.parse(existing.remarks_json);
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

    const updates: string[] = ['remarks_json = @remarks_json', "updated_at = datetime('now')"];
    const values: any = {
      id: body.id,
      remarks_json: JSON.stringify(remarks),
    };

    if (body.status !== undefined) {
      updates.push('status = @status');
      values.status = body.status;
    }
    if (body.assignedOwner !== undefined) {
      updates.push('assigned_owner = @assigned_owner');
      values.assigned_owner = body.assignedOwner;
    }
    if (body.followUpDeadline !== undefined) {
      updates.push('follow_up_deadline = @follow_up_deadline');
      values.follow_up_deadline = body.followUpDeadline;
    }
    if (body.priority !== undefined) {
      updates.push('priority = @priority');
      values.priority = body.priority;
    }

    const sql = `UPDATE coordination_requests SET ${updates.join(', ')} WHERE id = @id`;
    db.prepare(sql).run(values);

    // If resolved or status changed, log to case history if case linked
    if (body.status && body.status !== existing.status && existing.linked_case_id) {
      try {
        db.prepare(`
          INSERT INTO case_history (id, case_id, case_number, action, previous_status, new_status, actor_name, actor_role, remarks, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).run(
          `hist-coord-${Date.now()}`,
          existing.linked_case_id,
          existing.linked_case_number || existing.linked_case_id,
          `Coordination Status: ${body.status}`,
          null,
          null,
          body.author || 'PGRC Official',
          body.role || 'PGRC Official',
          body.newRemark || `Coordination request ${existing.request_number} updated to ${body.status}`
        );
      } catch (err) {
        console.error('Failed to log coordination update to history', err);
      }
    }

    const updated = db.prepare('SELECT * FROM coordination_requests WHERE id = ?').get(body.id);
    return NextResponse.json({ request: rowToCoordinationRequest(updated as any) }, { status: 200 });
  } catch (error) {
    console.error('Error updating coordination request:', error);
    return NextResponse.json({ error: 'Failed to update coordination request' }, { status: 500 });
  }
}
