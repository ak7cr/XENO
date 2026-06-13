import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Customer } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = db
      .prepare('SELECT * FROM customers WHERE id = ?')
      .get(params.id) as Customer | undefined;

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}
