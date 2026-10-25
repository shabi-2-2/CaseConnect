import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');

    const db = getDb();
    let sql = 'SELECT * FROM case_history WHERE 1=1';
    const params: unknown[] = [];

    if (caseId) {
      sql += ' AND (case_id = ? OR case_number = ?)';
      params.push(caseId, caseId);
    }

    sql += ' ORDER BY created_at DESC';
    const stmt = db.prepare(sql);
    const rows = params.length ? stmt.all(...(params as string[])) : stmt.all();

    const history = rows.map((r: any) => ({
      id: r.id,
      caseId: r.case_id,
      caseNumber: r.case_number,
      action: r.action,
      previousStatus: r.previous_status,
      newStatus: r.new_status,
      actorName: r.actor_name,
      actorRole: r.actor_role,
      remarks: r.remarks,
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

    const db = getDb();
    const id = body.id || `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const stmt = db.prepare(`
      INSERT INTO case_history (id, case_id, case_number, action, previous_status, new_status, actor_name, actor_role, remarks, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(
      id,
      body.caseId,
      body.caseNumber || body.caseId,
      body.action,
      body.previousStatus || null,
      body.newStatus || null,
      body.actorName || 'Senior Official',
      body.actorRole || 'Senior Management',
      body.remarks || '',
    );

    const inserted = db.prepare('SELECT * FROM case_history WHERE id = ?').get(id);
    return NextResponse.json({ historyItem: inserted }, { status: 201 });
  } catch (error) {
    console.error('Error recording case history:', error);
    return NextResponse.json({ error: 'Failed to record case history' }, { status: 500 });
  }
}
