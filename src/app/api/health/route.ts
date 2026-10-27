import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { count, error } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Health check database query error:', error.message);
      return NextResponse.json({ status: 'error', db: 'unavailable' }, { status: 500 });
    }

    return NextResponse.json(
      { status: 'ok', db: 'connected', count: count ?? 0 },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Health check exception:', err?.message || err);
    return NextResponse.json({ status: 'error', db: 'unavailable' }, { status: 500 });
  }
}
