'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Card, EmptyState, PageHeader, StatCard, TierBadge } from '@/components/ui';
import { PackageIcon, SendIcon, SparkleIcon, TargetIcon, UsersIcon } from '@/components/icons';
import { Campaign, Customer, Segment } from '@/lib/types';

interface Stats {
  customers: { total: number; revenue: number; tierBreakdown: { tier: string; count: number }[] };
  orders: { total: number };
  segments: { total: number; recent: Segment[] };
  campaigns: { total: number; recent: Campaign[] };
  communications: { total_sent: number; delivered: number; failed: number; opened: number; clicked: number };
  recentCustomers: Customer[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) setStats(await res.json());
    } catch (error) {
      console.error('Error loading stats:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-side fetch on mount
    load();
  }, []);

  const seedData = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      if (res.ok) await load();
    } catch (error) {
      console.error('Error seeding data:', error);
    }
    setSeeding(false);
  };

  if (loading) {
    return <div className="text-sm text-slate-500 dark:text-slate-400">Loading dashboard…</div>;
  }

  if (!stats || stats.customers.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5">
          <SparkleIcon className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Welcome to Xeno CRM</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md">
          An AI-native mini CRM for segmenting shoppers, sending personalised campaigns and tracking
          delivery performance end to end.
        </p>
        <Button onClick={seedData} disabled={seeding} className="mt-6">
          {seeding ? 'Loading demo data…' : 'Load demo data to get started'}
        </Button>
      </div>
    );
  }

  const { customers, orders, segments, campaigns, communications, recentCustomers } = stats;

  const funnelSteps = [
    { label: 'Sent', value: communications.total_sent, color: 'bg-slate-400 dark:bg-slate-600' },
    { label: 'Delivered', value: communications.delivered, color: 'bg-emerald-500' },
    { label: 'Opened', value: communications.opened, color: 'bg-cyan-500' },
    { label: 'Clicked', value: communications.clicked, color: 'bg-violet-500' },
  ];
  const maxFunnel = Math.max(1, communications.total_sent);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A snapshot of your shopper base, segments and campaign performance."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Customers" value={customers.total} icon={<UsersIcon />} hint={`${orders.total} orders placed`} />
        <StatCard label="Lifetime Revenue" value={`$${customers.revenue.toFixed(2)}`} icon={<PackageIcon />} />
        <StatCard label="Segments" value={segments.total} icon={<TargetIcon />} />
        <StatCard label="Campaigns Sent" value={campaigns.total} icon={<SendIcon />} hint={`${communications.total_sent} communications`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Communication funnel</h2>
            <Link href="/insights" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
              View insights →
            </Link>
          </div>
          {communications.total_sent === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No communications sent yet. Create a campaign to see delivery and engagement stats here.</p>
          ) : (
            <div className="space-y-3">
              {funnelSteps.map(step => (
                <div key={step.label}>
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span>{step.label}</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{step.value}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${step.color}`}
                      style={{ width: `${Math.max(2, (step.value / maxFunnel) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {communications.failed > 0 && (
                <p className="text-xs text-rose-500 pt-1">{communications.failed} failed to send</p>
              )}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-4">Customer tiers</h2>
          <div className="space-y-3">
            {['gold', 'silver', 'bronze'].map(tier => {
              const entry = customers.tierBreakdown.find(t => t.tier === tier);
              const count = entry?.count || 0;
              const pct = customers.total > 0 ? (count / customers.total) * 100 : 0;
              return (
                <div key={tier}>
                  <div className="flex items-center justify-between mb-1">
                    <TierBadge tier={tier} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${tier === 'gold' ? 'bg-amber-400' : tier === 'silver' ? 'bg-slate-400' : 'bg-orange-400'}`}
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Recent customers</h2>
            <Link href="/customers" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {recentCustomers.map((customer) => (
              <div key={customer.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{customer.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{customer.email}</p>
                </div>
                <TierBadge tier={customer.tier} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Segments</h2>
            <Link href="/segments" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
              Manage →
            </Link>
          </div>
          {segments.recent.length === 0 ? (
            <EmptyState title="No segments yet" description="Create one to start targeting shoppers." />
          ) : (
            <div className="space-y-2">
              {segments.recent.map((segment) => (
                <div key={segment.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{segment.name}</p>
                  <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{segment.customer_count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
