import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST() {
  try {
    // Clear existing data
    db.exec('DELETE FROM communications; DELETE FROM campaigns; DELETE FROM segments; DELETE FROM orders; DELETE FROM customers;');

    // Create demo customers for a coffee chain
    const customers = [
      { name: 'Alice Johnson', email: 'alice@example.com', phone: '+1234567890' },
      { name: 'Bob Smith', email: 'bob@example.com', phone: '+1234567891' },
      { name: 'Carol Davis', email: 'carol@example.com', phone: '+1234567892' },
      { name: 'David Lee', email: 'david@example.com', phone: '+1234567893' },
      { name: 'Emma Wilson', email: 'emma@example.com', phone: '+1234567894' },
      { name: 'Frank Brown', email: 'frank@example.com', phone: '+1234567895' },
      { name: 'Grace Martinez', email: 'grace@example.com', phone: '+1234567896' },
      { name: 'Henry Taylor', email: 'henry@example.com', phone: '+1234567897' },
      { name: 'Iris Anderson', email: 'iris@example.com', phone: '+1234567898' },
      { name: 'Jack Thomas', email: 'jack@example.com', phone: '+1234567899' },
    ];

    const customerIds: string[] = [];
    const now = new Date();

    customers.forEach((customer, index) => {
      const id = randomUUID();
      customerIds.push(id);

      const tier = index % 3 === 0 ? 'gold' : index % 3 === 1 ? 'silver' : 'bronze';
      const createdAt = new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString();

      db.prepare(
        'INSERT INTO customers (id, email, phone, name, tier, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(id, customer.email, customer.phone, customer.name, tier, createdAt);
    });

    // Create demo orders
    const products = ['Espresso', 'Latte', 'Cappuccino', 'Americano', 'Macchiato', 'Mocha'];
    customerIds.forEach((customerId) => {
      const orderCount = Math.floor(Math.random() * 10) + 1;
      let totalSpend = 0;
      let lastPurchaseDate = '';

      for (let j = 0; j < orderCount; j++) {
        const orderId = randomUUID();
        const product = products[Math.floor(Math.random() * products.length)];
        const amount = Math.floor(Math.random() * 15) + 2;
        const orderDate = new Date(now.getTime() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString();

        db.prepare(
          'INSERT INTO orders (id, customer_id, product_name, amount, date) VALUES (?, ?, ?, ?, ?)'
        ).run(orderId, customerId, product, amount, orderDate);

        totalSpend += amount;
        if (!lastPurchaseDate || orderDate > lastPurchaseDate) {
          lastPurchaseDate = orderDate;
        }
      }

      // Update customer
      let tier = 'bronze';
      if (totalSpend >= 200) tier = 'gold';
      else if (totalSpend >= 100) tier = 'silver';

      db.prepare(
        'UPDATE customers SET total_spend = ?, last_purchase_date = ?, tier = ? WHERE id = ?'
      ).run(totalSpend, lastPurchaseDate, tier, customerId);
    });

    // Create demo segments
    const segments = [
      {
        name: 'High-Value Customers',
        criteria: { tier: ['gold'], minSpend: 200 },
      },
      {
        name: 'Inactive High-Value',
        criteria: { tier: ['gold', 'silver'], daysSinceLastPurchase: 14 },
      },
      {
        name: 'All Active Users',
        criteria: { active: true },
      },
    ];

    const segmentIds: string[] = [];
    segments.forEach(seg => {
      const id = randomUUID();
      segmentIds.push(id);
      db.prepare(
        'INSERT INTO segments (id, name, criteria, customer_count, created_at) VALUES (?, ?, ?, ?, ?)'
      ).run(id, seg.name, JSON.stringify(seg.criteria), 0, new Date().toISOString());
    });

    return NextResponse.json({
      success: true,
      message: 'Demo data created successfully',
      stats: {
        customers: customers.length,
        orders: customerIds.length * 5,
        segments: segments.length,
      },
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}
