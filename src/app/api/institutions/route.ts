import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { SAMPLE_INSTITUTIONS } from '@/data/mockData';
import { InstitutionItem } from '@/types/dashboard';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data: complaints, error } = await supabase
      .from('complaints')
      .select('institution_code, institution_name, status, bureau, has_overlap_alert');

    if (error) {
      console.error('Supabase fetch complaints for institutions error:', error.message);
      return NextResponse.json({ error: 'Failed to fetch institutions' }, { status: 500 });
    }

    const statsByCode: Record<string, any> = {};
    const statsByName: Record<string, any> = {};

    for (const c of complaints || []) {
      const code = c.institution_code;
      const name = c.institution_name?.toLowerCase();

      const processItem = (targetMap: Record<string, any>, key: string) => {
        if (!targetMap[key]) {
          targetMap[key] = {
            total: 0,
            pending: 0,
            under_process: 0,
            disposed: 0,
            overdue: 0,
            pgrc: 0,
            regulation: 0,
            overlaps: 0,
          };
        }
        const s = targetMap[key];
        s.total += 1;
        if (c.status === 'Pending') s.pending += 1;
        else if (c.status === 'Under Process') s.under_process += 1;
        else if (c.status === 'Disposed') s.disposed += 1;
        else if (c.status === 'Overdue') s.overdue += 1;

        if (c.bureau === 'PGRC') s.pgrc += 1;
        else if (c.bureau === 'Regulation Bureau') s.regulation += 1;

        if (c.has_overlap_alert) s.overlaps += 1;
      };

      if (code) processItem(statsByCode, code);
      if (name) processItem(statsByName, name);
    }

    const institutions: InstitutionItem[] = SAMPLE_INSTITUTIONS.map((inst) => {
      const match = statsByCode[inst.code] || statsByName[inst.name.toLowerCase()];
      if (!match) {
        return {
          ...inst,
          totalCases: 0,
          pendingCases: 0,
          underProcessCases: 0,
          disposedCases: 0,
          overdueCases: 0,
          pgrcCasesCount: 0,
          regulationCasesCount: 0,
          hasActiveOverlap: false,
        };
      }

      return {
        ...inst,
        totalCases: match.total || 0,
        pendingCases: match.pending || 0,
        underProcessCases: match.under_process || 0,
        disposedCases: match.disposed || 0,
        overdueCases: match.overdue || 0,
        pgrcCasesCount: match.pgrc || 0,
        regulationCasesCount: match.regulation || 0,
        hasActiveOverlap: (match.overlaps || 0) > 0,
      };
    });

    return NextResponse.json({ institutions }, { status: 200 });
  } catch (error) {
    console.error('Error fetching institutions:', error);
    return NextResponse.json({ error: 'Failed to fetch institutions' }, { status: 500 });
  }
}
