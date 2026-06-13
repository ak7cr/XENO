import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Receive callbacks from channel service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { communication_id, status, delivered_at, opened_at, read_at, clicked_at } = body;

    if (!communication_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update communication status
    const updates: string[] = ['status = ?'];
    const params: any[] = [status];

    if (delivered_at) {
      updates.push('delivered_at = ?');
      params.push(delivered_at);
    }
    if (opened_at) {
      updates.push('opened_at = ?');
      params.push(opened_at);
    }
    if (read_at) {
      updates.push('read_at = ?');
      params.push(read_at);
    }
    if (clicked_at) {
      updates.push('clicked_at = ?');
      params.push(clicked_at);
    }

    params.push(communication_id);

    db.prepare(`UPDATE communications SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating communication:', error);
    return NextResponse.json({ error: 'Failed to update communication' }, { status: 500 });
  }
}
