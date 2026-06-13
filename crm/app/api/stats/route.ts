import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Campaign, Customer, Segment } from '@/lib/types';

// Aggregate counters for the dashboard — kept as a single endpoint so the
// UI doesn't need to pull full customer/communication tables to compute totals.
export async function GET() {
  try {
    const customerStats = db
      .prepare('SELECT COUNT(*) as total, COALESCE(SUM(total_spend), 0) as revenue FROM customers')
      .get() as { total: number; revenue: number };

    const tierBreakdown = db
      .prepare('SELECT tier, COUNT(*) as count FROM customers GROUP BY tier')
      .all() as { tier: string; count: number }[];

    const totalOrders = (db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number }).count;
    const totalSegments = (db.prepare('SELECT COUNT(*) as count FROM segments').get() as { count: number }).count;
    const totalCampaigns = (db.prepare('SELECT COUNT(*) as count FROM campaigns').get() as { count: number }).count;

    const commStats = db
      .prepare(
        `SELECT
          COUNT(*) as total_sent,
          SUM(CASE WHEN status != 'failed' AND status != 'pending' THEN 1 ELSE 0 END) as delivered,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) as opened,
          SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) as clicked
        FROM communications`
      )
      .get() as { total_sent: number; delivered: number; failed: number; opened: number; clicked: number };

    const recentCustomers = db
      .prepare('SELECT * FROM customers ORDER BY created_at DESC LIMIT 5')
      .all() as Customer[];

    const recentCampaigns = db
      .prepare('SELECT * FROM campaigns ORDER BY created_at DESC LIMIT 5')
      .all() as Campaign[];

    const segments = db
      .prepare('SELECT * FROM segments ORDER BY created_at DESC LIMIT 5')
      .all() as Segment[];

    return NextResponse.json({
      customers: { total: customerStats.total, revenue: customerStats.revenue, tierBreakdown },
      orders: { total: totalOrders },
      segments: { total: totalSegments, recent: segments },
      campaigns: { total: totalCampaigns, recent: recentCampaigns },
      communications: {
        total_sent: commStats.total_sent || 0,
        delivered: commStats.delivered || 0,
        failed: commStats.failed || 0,
        opened: commStats.opened || 0,
        clicked: commStats.clicked || 0,
      },
      recentCustomers,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
