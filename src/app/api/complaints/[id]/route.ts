import { NextRequest, NextResponse } from 'next/server';
import { getDb, rowToComplaint } from '@/lib/db';

function validateStatus(s: unknown) {
  const allowed = ['Pending', 'Under Process', 'Disposed', 'Overdue'];
  return typeof s === 'string' && allowed.includes(s);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const row = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
    if (!row) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }
    return NextResponse.json({ complaint: rowToComplaint(row as any) }, { status: 200 });
  } catch {
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

    const db = getDb();
    const existing = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any = { id };

    if (body.status !== undefined) {
      if (!validateStatus(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updates.push('status = @status');
      values.status = body.status;
    }
    if (body.assignedOfficer !== undefined) {
      updates.push('assigned_officer = @assigned_officer');
      values.assigned_officer = body.assignedOfficer;
    }
    if (body.summary !== undefined) {
      updates.push('summary = @summary');
      values.summary = body.summary;
    }
    if (body.priority !== undefined) {
      updates.push('priority = @priority');
      values.priority = body.priority;
    }
    if (body.expectedDisposalDate !== undefined) {
      updates.push('expected_disposal_date = @expected_disposal_date');
      values.expected_disposal_date = body.expectedDisposalDate;
    }
    if (body.hasOverlapAlert !== undefined) {
      updates.push('has_overlap_alert = @has_overlap_alert');
      values.has_overlap_alert = body.hasOverlapAlert ? 1 : 0;
    }

    updates.push("last_updated = @last_updated");
    values.last_updated = new Date().toISOString().split('T')[0];
    updates.push("updated_at = datetime('now')");

    if (updates.length === 0) {
      return NextResponse.json({ complaint: rowToComplaint(existing as any) }, { status: 200 });
    }

    const sql = `UPDATE complaints SET ${updates.join(', ')} WHERE id = @id`;
    db.prepare(sql).run(values);
    const updated = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
    return NextResponse.json({ complaint: rowToComplaint(updated as any) }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update complaint' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const existing = db.prepare('SELECT id FROM complaints WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }
    db.prepare('DELETE FROM complaints WHERE id = ?').run(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to delete complaint' }, { status: 500 });
  }
}
