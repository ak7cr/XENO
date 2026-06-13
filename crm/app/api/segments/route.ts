import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Segment, Customer } from '@/lib/types';
import { randomUUID } from 'crypto';

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
      data: segments.map(s => ({
        ...s,
        criteria: typeof s.criteria === 'string' ? JSON.parse(s.criteria) : s.criteria,
      })),
      total: countResult.count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching segments:', error);
    return NextResponse.json({ error: 'Failed to fetch segments' }, { status: 500 });
  }
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
    const countResult = db.prepare(query).all(...params) as any[];
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
        criteria: JSON.parse(segment.criteria),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating segment:', error);
    return NextResponse.json({ error: 'Failed to create segment' }, { status: 500 });
  }
}

// Helper function to build SQL query from criteria
function buildSegmentQuery(criteria: any) {
  let query = 'SELECT * FROM customers WHERE 1=1';
  const params: any[] = [];

  // Tier filter
  if (criteria.tier && criteria.tier.length > 0) {
    const placeholders = criteria.tier.map(() => '?').join(',');
    query += ` AND tier IN (${placeholders})`;
    params.push(...criteria.tier);
  }

  // Minimum spend filter
  if (criteria.minSpend !== undefined) {
    query += ' AND total_spend >= ?';
    params.push(criteria.minSpend);
  }

  // Maximum spend filter
  if (criteria.maxSpend !== undefined) {
    query += ' AND total_spend <= ?';
    params.push(criteria.maxSpend);
  }

  // Days since last purchase
  if (criteria.daysSinceLastPurchase !== undefined) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - criteria.daysSinceLastPurchase);
    query += ' AND last_purchase_date < ?';
    params.push(cutoffDate.toISOString());
  }

  // Never purchased (inactive)
  if (criteria.neverPurchased === true) {
    query += ' AND last_purchase_date IS NULL';
  }

  // Active (purchased recently)
  if (criteria.active === true) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    query += ' AND last_purchase_date >= ?';
    params.push(cutoffDate.toISOString());
  }

  return { query, params };
}
