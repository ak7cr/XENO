import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildSegmentQuery, SegmentCriteria } from '@/lib/segments';

// Lets the UI show a live "N customers match" count while a marketer is
// still tweaking segment criteria, without creating a segment record.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const criteria = (body.criteria || {}) as SegmentCriteria;

    const { query, params } = buildSegmentQuery(criteria);
    const count = (db.prepare(query).all(...params) as unknown[]).length;

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error previewing segment:', error);
    return NextResponse.json({ error: 'Failed to preview segment' }, { status: 500 });
  }
}
