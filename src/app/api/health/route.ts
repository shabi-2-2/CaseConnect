import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    db.prepare('SELECT 1').get();
    const count = db.prepare('SELECT COUNT(*) as c FROM complaints').get() as { c: number };
    return NextResponse.json({ status: 'ok', db: 'connected', count: count.c }, { status: 200 });
  } catch {
    return NextResponse.json({ status: 'error', db: 'unavailable' }, { status: 500 });
  }
}
