import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { rowToInstitutionResponse } from '@/lib/db';
import { Database } from '@/lib/supabase/types';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionCode = searchParams.get('institutionCode');
    const caseId = searchParams.get('caseId');
    const noticeId = searchParams.get('noticeId');

    const supabase = getSupabaseServerClient();
    let query = supabase.from('institution_responses').select('*').order('created_at', { ascending: false });

    if (institutionCode) {
      query = query.eq('institution_code', institutionCode);
    }
    if (caseId) {
      query = query.or(`case_id.eq.${caseId},case_number.eq.${caseId}`);
    }
    if (noticeId) {
      query = query.or(`notice_id.eq.${noticeId},notice_number.eq.${noticeId}`);
    }

    const { data: rows, error } = await query;
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const responses = (rows || []).map(rowToInstitutionResponse);

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

    const supabase = getSupabaseServerClient();
    const id = `resp-${crypto.randomUUID()}`;
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const responseNumber = `RESP-2026-${randSuffix}`;
    const status = isDraft ? 'Draft' : 'Submitted';
    const submissionDate = new Date().toISOString().split('T')[0];

    const newResponse = {
      id,
      response_number: responseNumber,
      case_id: caseId || null,
      case_number: caseNumber || null,
      notice_id: noticeId || null,
      notice_number: noticeNumber || null,
      institution_code: institutionCode,
      institution_name: institutionName || 'Apex Institute of Technology & Engineering',
      bureau,
      subject,
      response_text: responseText,
      supporting_documents_json: JSON.stringify(supportingDocuments),
      submitted_by_name: submittedByName,
      submitted_by_designation: submittedByDesignation,
      submission_date: submissionDate,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdRow, error: insertErr } = await supabase
      .from('institution_responses')
      .insert(newResponse)
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json(
        { success: false, error: insertErr.message },
        { status: 500 }
      );
    }

    // If caseId or caseNumber is present, log to case_history and update complaints last_updated
    if (caseId || caseNumber) {
      const historyId = `hist-${crypto.randomUUID()}`;
      try {
        await supabase.from('case_history').insert({
          id: historyId,
          case_id: caseId || caseNumber,
          case_number: caseNumber || caseId,
          action: isDraft ? 'Compliance Rebuttal Draft Saved' : 'Compliance Response Submitted',
          details: `Institutional response ${responseNumber} filed: "${subject}". Documents attached: ${supportingDocuments.length}. Submitter: ${submittedByName} (${submittedByDesignation}).`,
          actor_name: submittedByName,
          actor_role: 'Institution',
          remarks: `Institutional response ${responseNumber} filed: "${subject}". Documents attached: ${supportingDocuments.length}. Submitter: ${submittedByName} (${submittedByDesignation}).`,
          created_at: new Date().toISOString(),
        });
      } catch (histErr) {
        console.error('Failed to log case_history for institution response:', histErr);
      }

      try {
        const now = new Date().toISOString().split('T')[0];
        await supabase
          .from('complaints')
          .update({ last_updated: now, updated_at: new Date().toISOString() })
          .or(`id.eq.${caseId || caseNumber},case_number.eq.${caseNumber || caseId}`);
      } catch {}
    }

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

    const supabase = getSupabaseServerClient();
    const { data: existing, error: fetchErr } = await supabase
      .from('institution_responses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !existing) {
      return NextResponse.json({ success: false, error: 'Response not found' }, { status: 404 });
    }

    const updates: Database['public']['Tables']['institution_responses']['Update'] = {
      updated_at: new Date().toISOString(),
    };
    if (status !== undefined) updates.status = status;
    if (bureauFeedback !== undefined) updates.bureau_feedback = bureauFeedback;
    if (responseText !== undefined) updates.response_text = responseText;
    if (supportingDocuments !== undefined) {
      updates.supporting_documents_json = JSON.stringify(supportingDocuments);
    }

    const { data: updated, error: updateErr } = await supabase
      .from('institution_responses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

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
