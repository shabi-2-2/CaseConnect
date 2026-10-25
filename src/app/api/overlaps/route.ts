import { NextRequest, NextResponse } from 'next/server';
import { getDb, rowToOverlap } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const db = getDb();
    let sql = 'SELECT * FROM overlap_alerts WHERE 1=1';
    const params: unknown[] = [];

    if (status) {
      sql += ' AND review_status = ?';
      params.push(status);
    }

    sql += ' ORDER BY detected_date DESC';
    const stmt = db.prepare(sql);
    const rows = params.length ? stmt.all(...(params as string[])) : stmt.all();
    const overlaps = rows.map((r: any) => rowToOverlap(r));
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
    const db = getDb();

    const existing = db.prepare('SELECT * FROM overlap_alerts WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Overlap alert not found' }, { status: 404 });
    }

    const reviewedAt = new Date().toISOString().split('T')[0];
    const reviewer = reviewedBy || 'Senior Management Officer';

    db.prepare(`
      UPDATE overlap_alerts
      SET review_status = ?, reviewed_by = ?, reviewed_at = ?, review_notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(reviewStatus, reviewer, reviewedAt, reviewNotes || '', id);

    // If decision was Confirmed Related or Duplicate, mark complaints or log history
    try {
      const alert = existing as any;
      if (reviewStatus === 'Confirmed Related' || reviewStatus === 'Confirmed Duplicate') {
        db.prepare('UPDATE complaints SET has_overlap_alert = 1 WHERE id IN (?, ?)').run(alert.case1_id, alert.case2_id);
      }
      // Also log to case history for both cases
      const actionText = `Overlap review: ${reviewStatus}`;
      const logStmt = db.prepare(`
        INSERT INTO case_history (id, case_id, case_number, action, previous_status, new_status, actor_name, actor_role, remarks, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);
      logStmt.run(
        `hist-ovr-${Date.now()}-1`,
        alert.case1_id,
        alert.case1_number,
        actionText,
        alert.case1_status,
        alert.case1_status,
        reviewer,
        'Senior Management',
        `Linked with ${alert.case2_number}. Note: ${reviewNotes || 'Confirmed by senior management review.'}`
      );
      logStmt.run(
        `hist-ovr-${Date.now()}-2`,
        alert.case2_id,
        alert.case2_number,
        actionText,
        alert.case2_status,
        alert.case2_status,
        reviewer,
        'Senior Management',
        `Linked with ${alert.case1_number}. Note: ${reviewNotes || 'Confirmed by senior management review.'}`
      );
    } catch (e) {
      console.error('Failed to log overlap decision in case history', e);
    }

    const updated = db.prepare('SELECT * FROM overlap_alerts WHERE id = ?').get(id);
    return NextResponse.json({ overlap: rowToOverlap(updated as any) }, { status: 200 });
  } catch (error) {
    console.error('Error updating overlap alert:', error);
    return NextResponse.json({ error: 'Failed to update overlap alert' }, { status: 500 });
  }
}
