import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { SAMPLE_INSTITUTIONS } from '@/data/mockData';
import { InstitutionItem } from '@/types/dashboard';

export async function GET() {
  try {
    const db = getDb();

    // Query aggregates per institution from SQLite complaints
    const countStmt = db.prepare(`
      SELECT
        institution_code,
        institution_name,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'Under Process' THEN 1 ELSE 0 END) as under_process,
        SUM(CASE WHEN status = 'Disposed' THEN 1 ELSE 0 END) as disposed,
        SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END) as overdue,
        SUM(CASE WHEN bureau = 'PGRC' THEN 1 ELSE 0 END) as pgrc,
        SUM(CASE WHEN bureau = 'Regulation Bureau' THEN 1 ELSE 0 END) as regulation,
        SUM(CASE WHEN has_overlap_alert = 1 THEN 1 ELSE 0 END) as overlaps
      FROM complaints
      GROUP BY institution_code
    `);

    const dbStats = countStmt.all() as any[];
    const statsByCode: Record<string, any> = {};
    const statsByName: Record<string, any> = {};

    for (const s of dbStats) {
      if (s.institution_code) statsByCode[s.institution_code] = s;
      if (s.institution_name) statsByName[s.institution_name.toLowerCase()] = s;
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
