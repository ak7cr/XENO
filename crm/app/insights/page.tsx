'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button, Card, ChannelBadge, EmptyState, PageHeader, StatCard, StatusBadge } from '@/components/ui';
import { ChartIcon, MailIcon, SendIcon, TargetIcon } from '@/components/icons';

interface CampaignRow {
  id: string;
  name: string;
  channel: string;
  segment_id: string;
  stats: {
    total_sent: number;
    delivered: number;
    failed: number;
    opened: number;
    clicked: number;
    delivery_rate: number | string;
    open_rate: number | string;
    click_rate: number | string;
  };
}

interface SegmentRow {
  id: string;
  name: string;
}

interface CommunicationRow {
  id: string;
  campaign_id: string;
  message: string;
  channel: string;
  status: string;
  sent_at: string | null;
}

function pct(num: number, den: number) {
  return den > 0 ? ((num / den) * 100).toFixed(1) : '0.0';
}

export default function InsightsPage() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [segments, setSegments] = useState<SegmentRow[]>([]);
  const [communications, setCommunications] = useState<CommunicationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [campaignsRes, segmentsRes, commsRes] = await Promise.all([
        fetch('/api/campaigns?limit=100'),
        fetch('/api/segments?limit=100'),
        fetch('/api/communications?limit=25'),
      ]);
      if (campaignsRes.ok) setCampaigns((await campaignsRes.json()).data || []);
      if (segmentsRes.ok) setSegments((await segmentsRes.json()).data || []);
      if (commsRes.ok) setCommunications((await commsRes.json()).data || []);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-side fetch on mount + poll
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [load]);

  const segmentName = (id: string) => segments.find(s => s.id === id)?.name || 'Unknown audience';

  const totals = campaigns.reduce(
    (acc, c) => ({
      sent: acc.sent + (c.stats?.total_sent || 0),
      delivered: acc.delivered + (c.stats?.delivered || 0),
      failed: acc.failed + (c.stats?.failed || 0),
      opened: acc.opened + (c.stats?.opened || 0),
      clicked: acc.clicked + (c.stats?.clicked || 0),
    }),
    { sent: 0, delivered: 0, failed: 0, opened: 0, clicked: 0 }
  );

  // Audience (segment) level rollup across all campaigns sent to that segment
  const bySegment = new Map<string, { sent: number; delivered: number; opened: number; clicked: number; campaigns: number }>();
  campaigns.forEach(c => {
    const entry = bySegment.get(c.segment_id) || { sent: 0, delivered: 0, opened: 0, clicked: 0, campaigns: 0 };
    entry.sent += c.stats?.total_sent || 0;
    entry.delivered += c.stats?.delivered || 0;
    entry.opened += c.stats?.opened || 0;
    entry.clicked += c.stats?.clicked || 0;
    entry.campaigns += 1;
    bySegment.set(c.segment_id, entry);
  });

  if (loading) {
    return <div className="text-sm text-slate-500 dark:text-slate-400">Loading insights…</div>;
  }

  if (campaigns.length === 0) {
    return (
      <div>
        <PageHeader title="Insights" description="Communication performance across campaigns and audiences." />
        <EmptyState title="No campaigns yet" description="Send a campaign to start seeing delivery, open and click performance here." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Insights"
        description="Delivery and engagement performance, live from the channel service callback loop."
        action={<Button variant="secondary" size="sm" onClick={load}>Refresh</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Sent" value={totals.sent} icon={<SendIcon />} />
        <StatCard label="Delivery Rate" value={`${pct(totals.delivered, totals.sent)}%`} icon={<MailIcon />} hint={`${totals.delivered} delivered · ${totals.failed} failed`} />
        <StatCard label="Open Rate" value={`${pct(totals.opened, totals.delivered)}%`} icon={<ChartIcon />} hint={`${totals.opened} opened`} />
        <StatCard label="Click Rate" value={`${pct(totals.clicked, totals.delivered)}%`} icon={<TargetIcon />} hint={`${totals.clicked} clicked`} />
      </div>

      <Card className="overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Campaign performance</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/60">
            <tr>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Campaign</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Channel</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Audience</th>
              <th className="px-5 py-2.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Sent</th>
              <th className="px-5 py-2.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Delivered</th>
              <th className="px-5 py-2.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Open Rate</th>
              <th className="px-5 py-2.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Click Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {campaigns.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{c.name}</td>
                <td className="px-5 py-3"><ChannelBadge channel={c.channel} /></td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{segmentName(c.segment_id)}</td>
                <td className="px-5 py-3 text-right text-slate-900 dark:text-slate-100">{c.stats?.total_sent || 0}</td>
                <td className="px-5 py-3 text-right text-slate-900 dark:text-slate-100">{c.stats?.delivered || 0}</td>
                <td className="px-5 py-3 text-right text-slate-900 dark:text-slate-100">{c.stats?.open_rate}%</td>
                <td className="px-5 py-3 text-right text-slate-900 dark:text-slate-100">{c.stats?.click_rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Performance by audience</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/60">
            <tr>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Segment</th>
              <th className="px-5 py-2.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Campaigns</th>
              <th className="px-5 py-2.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Sent</th>
              <th className="px-5 py-2.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Delivery Rate</th>
              <th className="px-5 py-2.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Open Rate</th>
              <th className="px-5 py-2.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Click Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from(bySegment.entries()).map(([segmentId, agg]) => (
              <tr key={segmentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{segmentName(segmentId)}</td>
                <td className="px-5 py-3 text-right text-slate-900 dark:text-slate-100">{agg.campaigns}</td>
                <td className="px-5 py-3 text-right text-slate-900 dark:text-slate-100">{agg.sent}</td>
                <td className="px-5 py-3 text-right text-slate-900 dark:text-slate-100">{pct(agg.delivered, agg.sent)}%</td>
                <td className="px-5 py-3 text-right text-slate-900 dark:text-slate-100">{pct(agg.opened, agg.delivered)}%</td>
                <td className="px-5 py-3 text-right text-slate-900 dark:text-slate-100">{pct(agg.clicked, agg.delivered)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recent communication activity</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Live status from the channel service callback loop · auto-refreshes</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/60">
            <tr>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Message</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Channel</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Sent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {communications.map(comm => (
              <tr key={comm.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-5 py-3 text-slate-700 dark:text-slate-300 max-w-md truncate">{comm.message}</td>
                <td className="px-5 py-3"><ChannelBadge channel={comm.channel} /></td>
                <td className="px-5 py-3"><StatusBadge status={comm.status} /></td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{comm.sent_at ? new Date(comm.sent_at).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
