import { NextRequest, NextResponse } from 'next/server';
import { getDb, rowToNotice } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');
    const institutionCode = searchParams.get('institutionCode');

    const db = getDb();
    let sql = 'SELECT * FROM regulatory_notices WHERE 1=1';
    const params: unknown[] = [];

    if (caseId) {
      sql += ' AND (case_id = ? OR case_number = ?)';
      params.push(caseId, caseId);
    }
    if (institutionCode) {
      sql += ' AND institution_code = ?';
      params.push(institutionCode);
    }

    sql += ' ORDER BY created_at DESC';
    const stmt = db.prepare(sql);
    const rows = params.length ? stmt.all(...(params as string[])) : stmt.all();

    const notices = rows.map((r: any) => rowToNotice(r));
    return NextResponse.json({ notices }, { status: 200 });
  } catch (error) {
    console.error('Error fetching regulatory notices:', error);
    return NextResponse.json({ error: 'Failed to fetch regulatory notices' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      caseId,
      caseNumber,
      institutionName,
      institutionCode,
      noticeType,
      reason,
      noticeDate,
      responseDeadline,
      remarks,
      supportingDocs,
      issuedBy,
    } = body;

    if (!caseId || !institutionName || !noticeType || !reason || !responseDeadline) {
      return NextResponse.json(
        { error: 'Missing required fields: caseId, institutionName, noticeType, reason, responseDeadline' },
        { status: 400 }
      );
    }

    const db = getDb();
    const id = `not-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const noticeNumber = body.noticeNumber || `RN-2026-${randomSeq}`;
    const finalNoticeDate = noticeDate || new Date().toISOString().split('T')[0];
    const finalIssuedBy = issuedBy || 'Regulation Bureau Official';

    const insertNotice = db.prepare(`
      INSERT INTO regulatory_notices (
        id, notice_number, case_id, case_number, institution_name, institution_code,
        notice_type, reason, notice_date, response_deadline, remarks, supporting_docs,
        issued_by, status, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, 'Issued', datetime('now')
      )
    `);

    insertNotice.run(
      id,
      noticeNumber,
      caseId,
      caseNumber || caseId,
      institutionName,
      institutionCode || '',
      noticeType,
      reason,
      finalNoticeDate,
      responseDeadline,
      remarks || '',
      supportingDocs || '',
      finalIssuedBy
    );

    // Record in case_history audit ledger
    const histId = `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const insertHistory = db.prepare(`
      INSERT INTO case_history (
        id, case_id, case_number, action, previous_status, new_status, actor_name, actor_role, remarks, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    insertHistory.run(
      histId,
      caseId,
      caseNumber || caseId,
      'Regulatory Notice Issued',
      'Under Process',
      'Under Process',
      finalIssuedBy,
      'Regulation Bureau',
      `Issued ${noticeType} (${noticeNumber}). Reason: ${reason}. Response Deadline: ${responseDeadline}. Remarks: ${remarks || 'None'}`
    );

    const createdRow = db.prepare('SELECT * FROM regulatory_notices WHERE id = ?').get(id);
    const notice = rowToNotice(createdRow);

    return NextResponse.json({ success: true, notice }, { status: 201 });
  } catch (error) {
    console.error('Error creating regulatory notice:', error);
    return NextResponse.json({ error: 'Failed to create regulatory notice' }, { status: 500 });
  }
}
