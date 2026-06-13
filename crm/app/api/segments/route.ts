import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Segment } from '@/lib/types';
import { randomUUID } from 'crypto';
import { buildSegmentQuery } from '@/lib/segments';

// AI-powered segment creation based on criteria
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const segments = db
      .prepare('SELECT * FROM segments ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(limit, offset) as Segment[];

    const countResult = db.prepare('SELECT COUNT(*) as count FROM segments').get() as { count: number };

    return NextResponse.json({
      data: segments.map(s => {
        const criteria = typeof s.criteria === 'string' ? JSON.parse(s.criteria) : s.criteria;
        return {
          ...s,
          criteria,
          // Recompute on every read so counts stay accurate as customers/orders change
          customer_count: countMatchingCustomers(criteria),
        };
      }),
      total: countResult.count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching segments:', error);
    return NextResponse.json({ error: 'Failed to fetch segments' }, { status: 500 });
  }
}

function countMatchingCustomers(criteria: ReturnType<typeof JSON.parse>) {
  const { query, params } = buildSegmentQuery(criteria);
  return (db.prepare(query).all(...params) as unknown[]).length;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, criteria } = body;

    if (!name || !criteria) {
      return NextResponse.json(
        { error: 'Missing required fields: name, criteria' },
        { status: 400 }
      );
    }

    // Build SQL query based on criteria
    const { query, params } = buildSegmentQuery(criteria);

    // Count matching customers
    const countResult = db.prepare(query).all(...params) as unknown[];
    const customer_count = countResult.length;

    if (customer_count === 0) {
      return NextResponse.json(
        { error: 'Segment criteria matches no customers' },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO segments (id, name, criteria, customer_count, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, name, JSON.stringify(criteria), customer_count, now);

    const segment = db.prepare('SELECT * FROM segments WHERE id = ?').get(id) as Segment;

    return NextResponse.json(
      {
        ...segment,
        criteria: JSON.parse(segment.criteria as unknown as string),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating segment:', error);
    return NextResponse.json({ error: 'Failed to create segment' }, { status: 500 });
  }
}
