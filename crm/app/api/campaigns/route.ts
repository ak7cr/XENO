import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Campaign, Customer, Communication } from '@/lib/types';
import { randomUUID } from 'crypto';
import axios from 'axios';
import { buildSegmentQuery } from '@/lib/segments';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const campaigns = db
      .prepare('SELECT * FROM campaigns ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(limit, offset) as Campaign[];

    const countResult = db.prepare('SELECT COUNT(*) as count FROM campaigns').get() as { count: number };

    // Fetch stats for each campaign
    const campaignsWithStats = campaigns.map(campaign => ({
      ...campaign,
      stats: getCampaignStats(campaign.id),
    }));

    return NextResponse.json({
      data: campaignsWithStats,
      total: countResult.count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { segment_id, name, message_template, channel, send_now = false } = body;

    if (!segment_id || !name || !message_template || !channel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify segment exists
    const segment = db.prepare('SELECT * FROM segments WHERE id = ?').get(segment_id);
    if (!segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    const campaign_id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO campaigns (id, segment_id, name, message_template, channel, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(campaign_id, segment_id, name, message_template, channel, 'draft', now);

    if (send_now) {
      // Send the campaign immediately
      await sendCampaign(campaign_id);
    }

    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaign_id) as Campaign;

    return NextResponse.json(
      {
        ...campaign,
        stats: getCampaignStats(campaign_id),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}

// Send campaign to all customers in segment
async function sendCampaign(campaign_id: string) {
  try {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaign_id) as Campaign;
    const segment = db.prepare('SELECT criteria FROM segments WHERE id = ?').get(campaign.segment_id) as { criteria: string };

    // Get customers in segment
    const { query, params } = buildSegmentQuery(JSON.parse(segment.criteria));
    const customers = db.prepare(query).all(...params) as Customer[];

    // Create communications for each customer
    const now = new Date().toISOString();
    const communications = customers.map(customer => {
      const comm_id = randomUUID();
      const message = campaign.message_template.replace(/\{name\}/g, customer.name);

      db.prepare(
        'INSERT INTO communications (id, campaign_id, customer_id, message, channel, status, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(comm_id, campaign_id, customer.id, message, campaign.channel, 'sent', now);

      return {
        id: comm_id,
        customer_id: customer.id,
        message,
        channel: campaign.channel,
        recipient: campaign.channel === 'email' ? customer.email : customer.phone,
      };
    });

    // Update campaign status
    db.prepare('UPDATE campaigns SET status = ?, sent_at = ? WHERE id = ?').run('sent', now, campaign_id);

    // Send to channel service
    const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || 'http://localhost:3001';
    
    try {
      await axios.post(`${CHANNEL_SERVICE_URL}/api/send`, {
        campaign_id,
        communications,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/communications/callback`,
      });
    } catch (error) {
      console.error('Error calling channel service:', error);
      // Don't fail the entire campaign if channel service is down
    }

    return { campaign_id, communications_count: communications.length };
  } catch (error) {
    console.error('Error sending campaign:', error);
    throw error;
  }
}

function getCampaignStats(campaign_id: string) {
  const comms = db.prepare('SELECT * FROM communications WHERE campaign_id = ?').all(campaign_id) as Communication[];

  const total_sent = comms.length;
  const delivered = comms.filter(c => c.status !== 'failed' && c.status !== 'pending').length;
  const failed = comms.filter(c => c.status === 'failed').length;
  const opened = comms.filter(c => c.opened_at).length;
  const clicked = comms.filter(c => c.clicked_at).length;

  return {
    total_sent,
    delivered,
    failed,
    opened,
    clicked,
    delivery_rate: total_sent > 0 ? ((delivered / total_sent) * 100).toFixed(1) : 0,
    open_rate: delivered > 0 ? ((opened / delivered) * 100).toFixed(1) : 0,
    click_rate: delivered > 0 ? ((clicked / delivered) * 100).toFixed(1) : 0,
  };
}
