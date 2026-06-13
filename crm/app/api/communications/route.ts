import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Communication } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const campaign_id = searchParams.get('campaign_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = 'SELECT * FROM communications WHERE 1=1';
    const params: (string | number)[] = [];

    if (campaign_id) {
      query += ' AND campaign_id = ?';
      params.push(campaign_id);
    }

    query += ' ORDER BY sent_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const communications = db.prepare(query).all(...params) as Communication[];

    let countQuery = 'SELECT COUNT(*) as count FROM communications WHERE 1=1';
    const countParams: string[] = [];
    if (campaign_id) {
      countQuery += ' AND campaign_id = ?';
      countParams.push(campaign_id);
    }

    const countResult = db.prepare(countQuery).get(...countParams) as { count: number };

    return NextResponse.json({
      data: communications,
      total: countResult.count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching communications:', error);
    return NextResponse.json({ error: 'Failed to fetch communications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { communications } = body;

    if (!Array.isArray(communications)) {
      return NextResponse.json(
        { error: 'Invalid body format' },
        { status: 400 }
      );
    }

    // Create communications
    for (const comm of communications) {
      const { id, campaign_id, customer_id, message, channel } = comm;
      const now = new Date().toISOString();

      db.prepare(
        'INSERT INTO communications (id, campaign_id, customer_id, message, channel, status, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(id, campaign_id, customer_id, message, channel, 'sent', now);
    }

    return NextResponse.json({ success: true, count: communications.length }, { status: 201 });
  } catch (error) {
    console.error('Error creating communications:', error);
    return NextResponse.json({ error: 'Failed to create communications' }, { status: 500 });
  }
}
