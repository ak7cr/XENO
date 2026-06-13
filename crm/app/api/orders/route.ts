import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Order } from '@/lib/types';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customer_id = searchParams.get('customer_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = 'SELECT * FROM orders';
    const params: any[] = [];

    if (customer_id) {
      query += ' WHERE customer_id = ?';
      params.push(customer_id);
    }

    query += ' ORDER BY date DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const orders = db.prepare(query).all(...params) as Order[];

    let countQuery = 'SELECT COUNT(*) as count FROM orders';
    const countParams: any[] = [];
    if (customer_id) {
      countQuery += ' WHERE customer_id = ?';
      countParams.push(customer_id);
    }

    const countResult = db.prepare(countQuery).get(...countParams) as { count: number };

    return NextResponse.json({
      data: orders,
      total: countResult.count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_id, product_name, amount, date } = body;

    if (!customer_id || !product_name || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify customer exists
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const id = randomUUID();
    const orderDate = date || new Date().toISOString();

    db.prepare(
      'INSERT INTO orders (id, customer_id, product_name, amount, date) VALUES (?, ?, ?, ?, ?)'
    ).run(id, customer_id, product_name, amount, orderDate);

    // Update customer's total spend and last purchase date
    db.prepare(
      'UPDATE customers SET total_spend = total_spend + ?, last_purchase_date = ? WHERE id = ?'
    ).run(amount, orderDate, customer_id);

    // Update customer tier based on spend
    const updatedCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
    let tier = 'bronze';
    if ((updatedCustomer as any).total_spend >= 1000) tier = 'gold';
    else if ((updatedCustomer as any).total_spend >= 500) tier = 'silver';

    db.prepare('UPDATE customers SET tier = ? WHERE id = ?').run(tier, customer_id);

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Order;

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
