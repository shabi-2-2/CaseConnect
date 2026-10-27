import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { rowToNotice } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');
    const institutionCode = searchParams.get('institutionCode');

    const supabase = getSupabaseServerClient();
    let query = supabase.from('regulatory_notices').select('*').order('created_at', { ascending: false });

    if (caseId) {
      query = query.or(`case_id.eq.${caseId},case_number.eq.${caseId}`);
    }
    if (institutionCode) {
      query = query.eq('institution_code', institutionCode);
    }

    const { data: rows, error } = await query;
    if (error) {
      console.error('Supabase fetch notices error:', error.message);
      return NextResponse.json({ error: 'Failed to fetch regulatory notices' }, { status: 500 });
    }

    const notices = (rows || []).map((r) => rowToNotice(r));
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

    const supabase = getSupabaseServerClient();
    const id = `not-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const noticeNumber = body.noticeNumber || `RN-2026-${randomSeq}`;
    const finalNoticeDate = noticeDate || new Date().toISOString().split('T')[0];
    const finalIssuedBy = issuedBy || 'Regulation Bureau Official';

    const newNotice = {
      id,
      notice_number: noticeNumber,
      case_id: caseId,
      case_number: caseNumber || caseId,
      institution_name: institutionName,
      institution_code: institutionCode || '',
      notice_type: noticeType,
      reason,
      notice_date: finalNoticeDate,
      response_deadline: responseDeadline,
      remarks: remarks || '',
      supporting_docs: supportingDocs || '',
      issued_by: finalIssuedBy,
      status: 'Issued',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdRow, error: insertErr } = await supabase
      .from('regulatory_notices')
      .insert(newNotice)
      .select()
      .single();

    if (insertErr) {
      console.error('Supabase create notice error:', insertErr.message);
      return NextResponse.json({ error: 'Failed to create regulatory notice' }, { status: 500 });
    }

    // Record in case_history audit ledger
    try {
      const histId = `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await supabase.from('case_history').insert({
        id: histId,
        case_id: caseId,
        case_number: caseNumber || caseId,
        action: 'Regulatory Notice Issued',
        previous_status: 'Under Process',
        new_status: 'Under Process',
        actor_name: finalIssuedBy,
        actor_role: 'Regulation Bureau',
        remarks: `Issued ${noticeType} (${noticeNumber}). Reason: ${reason}. Response Deadline: ${responseDeadline}. Remarks: ${remarks || 'None'}`,
        created_at: new Date().toISOString(),
      });
    } catch (hErr) {
      console.error('Failed to log notice to history', hErr);
    }

    return NextResponse.json({ success: true, notice: rowToNotice(createdRow) }, { status: 201 });
  } catch (error) {
    console.error('Error creating regulatory notice:', error);
    return NextResponse.json({ error: 'Failed to create regulatory notice' }, { status: 500 });
  }
}
