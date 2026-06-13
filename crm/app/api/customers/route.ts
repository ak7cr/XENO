import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Customer } from '@/lib/types';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const customers = db
      .prepare('SELECT * FROM customers ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(limit, offset) as Customer[];

    const countResult = db.prepare('SELECT COUNT(*) as count FROM customers').get() as { count: number };

    return NextResponse.json({
      data: customers,
      total: countResult.count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, name, tier = 'bronze' } = body;

    if (!email || !phone || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: email, phone, name' },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO customers (id, email, phone, name, tier, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, email, phone, name, tier, now);

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as Customer;

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'Customer with this email or phone already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
