import { NextRequest, NextResponse } from 'next/server';
import { getDb, rowToInstitutionResponse } from '@/lib/db';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionCode = searchParams.get('institutionCode');
    const caseId = searchParams.get('caseId');
    const noticeId = searchParams.get('noticeId');

    const db = getDb();
    let query = 'SELECT * FROM institution_responses WHERE 1=1';
    const params: any[] = [];

    if (institutionCode) {
      query += ' AND institution_code = ?';
      params.push(institutionCode);
    }
    if (caseId) {
      query += ' AND (case_id = ? OR case_number = ?)';
      params.push(caseId, caseId);
    }
    if (noticeId) {
      query += ' AND (notice_id = ? OR notice_number = ?)';
      params.push(noticeId, noticeId);
    }

    query += ' ORDER BY created_at DESC';

    const rows = db.prepare(query).all(...params);
    const responses = rows.map(rowToInstitutionResponse);

    return NextResponse.json({
      success: true,
      count: responses.length,
      responses,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      caseId,
      caseNumber,
      noticeId,
      noticeNumber,
      institutionCode,
      institutionName,
      bureau = 'PGRC',
      subject,
      responseText,
      supportingDocuments = [],
      submittedByName = 'Institution Principal',
      submittedByDesignation = 'Head of Institution',
      isDraft = false,
    } = body;

    if (!institutionCode || !responseText || !subject) {
      return NextResponse.json(
        { success: false, error: 'Institution code, subject, and response text are required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Generate IDs
    const id = `resp-${crypto.randomUUID()}`;
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const responseNumber = `RESP-2026-${randSuffix}`;
    const status = isDraft ? 'Draft' : 'Submitted';
    const submissionDate = new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO institution_responses (
        id, response_number, case_id, case_number, notice_id, notice_number,
        institution_code, institution_name, bureau, subject, response_text,
        supporting_documents_json, submitted_by_name, submitted_by_designation,
        submission_date, status, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, datetime('now'), datetime('now')
      )
    `).run(
      id,
      responseNumber,
      caseId || null,
      caseNumber || null,
      noticeId || null,
      noticeNumber || null,
      institutionCode,
      institutionName || 'Apex Institute of Technology & Engineering',
      bureau,
      subject,
      responseText,
      JSON.stringify(supportingDocuments),
      submittedByName,
      submittedByDesignation,
      submissionDate,
      status
    );

    // If caseId or caseNumber is present, also log this into the shared case_history table!
    if (caseId || caseNumber) {
      const historyId = `hist-${crypto.randomUUID()}`;
      try {
        db.prepare(`
          INSERT INTO case_history (
            id, case_id, case_number, action, details, actor_name, actor_role, timestamp, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).run(
          historyId,
          caseId || caseNumber,
          caseNumber || caseId,
          isDraft ? 'Compliance Rebuttal Draft Saved' : 'Compliance Response Submitted',
          `Institutional response ${responseNumber} filed: "${subject}". Documents attached: ${supportingDocuments.length}. Submitter: ${submittedByName} (${submittedByDesignation}).`,
          submittedByName,
          'Institution'
        );
      } catch (histErr) {
        console.error('Failed to log case_history for institution response:', histErr);
      }

      // Also update complaints last_updated
      try {
        db.prepare(`
          UPDATE complaints
          SET last_updated = datetime('now'), updated_at = datetime('now')
          WHERE id = ? OR case_number = ?
        `).run(caseId || caseNumber, caseNumber || caseId);
      } catch {}
    }

    const createdRow = db.prepare('SELECT * FROM institution_responses WHERE id = ?').get(id);

    return NextResponse.json({
      success: true,
      response: rowToInstitutionResponse(createdRow),
      message: isDraft
        ? 'Draft saved successfully'
        : 'Official compliance response submitted successfully and synced to AICTE Case Audit Ledger.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, bureauFeedback, responseText, supportingDocuments } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Response ID required' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT * FROM institution_responses WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Response not found' }, { status: 404 });
    }

    db.prepare(`
      UPDATE institution_responses
      SET
        status = COALESCE(?, status),
        bureau_feedback = COALESCE(?, bureau_feedback),
        response_text = COALESCE(?, response_text),
        supporting_documents_json = COALESCE(?, supporting_documents_json),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      status,
      bureauFeedback,
      responseText,
      supportingDocuments ? JSON.stringify(supportingDocuments) : null,
      id
    );

    const updated = db.prepare('SELECT * FROM institution_responses WHERE id = ?').get(id);

    return NextResponse.json({
      success: true,
      response: rowToInstitutionResponse(updated),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
