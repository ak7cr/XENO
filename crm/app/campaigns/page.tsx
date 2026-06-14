'use client';

import { useEffect, useState } from 'react';
import { AiModeBadge, Button, Card, ChannelBadge, EmptyState, Input, Label, PageHeader, Select, StatusBadge, Textarea } from '@/components/ui';
import { PlusIcon, SparkleIcon } from '@/components/icons';
import { SegmentCriteria } from '@/lib/segments';

interface SegmentOption {
  id: string;
  name: string;
  customer_count: number;
  criteria: SegmentCriteria;
}

interface CampaignRow {
  id: string;
  name: string;
  channel: string;
  status: string;
  segment_id: string;
  message_template: string;
  created_at: string;
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

const CHANNELS = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'rcs', label: 'RCS' },
];

function inferSegmentType(criteria: SegmentCriteria): string {
  if (criteria?.neverPurchased) return 'new-customers';
  if (criteria?.tier?.includes('gold') && criteria?.minSpend) return 'loyal-customers';
  if (criteria?.daysSinceLastPurchase) return 'high-value-inactive';
  return 'new-customers';
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [segments, setSegments] = useState<SegmentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState<'message' | 'channel' | null>(null);
  const [aiSource, setAiSource] = useState<'ai' | 'heuristic' | null>(null);
  const [channelSource, setChannelSource] = useState<'ai' | 'heuristic' | null>(null);
  const [form, setForm] = useState({ segment_id: '', name: '', message_template: '', channel: 'email' });

  const loadCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns?limit=100');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const loadSegments = async () => {
    try {
      const res = await fetch('/api/segments?limit=100');
      if (res.ok) {
        const data = await res.json();
        setSegments(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-side fetch on mount
    loadCampaigns();
    loadSegments();
  }, []);

  const selectedSegment = segments.find(s => s.id === form.segment_id);

  const generateMessages = async () => {
    setAiLoading('message');
    setAiSuggestions([]);
    try {
      const segmentType = selectedSegment ? inferSegmentType(selectedSegment.criteria) : 'new-customers';
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'message',
          context: { segment_name: segmentType, brand_name: 'Xeno', product: 'your favourites' },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const filled = (data.suggestions as string[]).map(s =>
          s.replace(/\{brand\}/g, 'Xeno').replace(/\{product\}/g, 'your favourites')
        );
        setAiSuggestions(filled);
        setAiSource(data.source);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setAiLoading(null);
  };

  const suggestChannel = async () => {
    setAiLoading('channel');
    try {
      const length = form.message_template.length;
      const audience_type = length > 120 ? 'long-message' : 'short-message';
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'channel', context: { audience_type, message_length: length } }),
      });
      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({ ...prev, channel: data.recommendation }));
        setChannelSource(data.source);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setAiLoading(null);
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, send_now: true }),
      });

      if (res.ok) {
        setShowForm(false);
        setForm({ segment_id: '', name: '', message_template: '', channel: 'email' });
        setAiSuggestions([]);
        await loadCampaigns();
      } else {
        const data = await res.json();
        setFormError(data.error || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Error:', error);
      setFormError('Failed to create campaign');
    }
    setSubmitting(false);
  };

  return (
    <div>
      <PageHeader
        title="Campaigns"
        description="Send personalised messages to a segment and watch delivery roll in."
        action={
          <Button onClick={() => setShowForm(v => !v)}>
            <PlusIcon className="w-4 h-4" />
            {showForm ? 'Cancel' : 'Create Campaign'}
          </Button>
        }
      />

      {showForm && (
        <Card className="p-6 mb-6">
          {segments.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              You need at least one segment before creating a campaign. Head to the Segments page first.
            </p>
          ) : (
            <form onSubmit={handleCreateCampaign} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Campaign Name</Label>
                  <Input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Spring Re-engagement"
                    required
                  />
                </div>
                <div>
                  <Label>Audience</Label>
                  <Select
                    value={form.segment_id}
                    onChange={e => setForm({ ...form, segment_id: e.target.value })}
                    required
                  >
                    <option value="">Choose a segment…</option>
                    {segments.map(seg => (
                      <option key={seg.id} value={seg.id}>
                        {seg.name} ({seg.customer_count} customers)
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label>Message Template</Label>
                  <button
                    type="button"
                    onClick={generateMessages}
                    disabled={aiLoading === 'message'}
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    <SparkleIcon className="w-3.5 h-3.5" />
                    {aiLoading === 'message' ? 'Generating…' : 'Generate with AI'}
                  </button>
                </div>
                <Textarea
                  value={form.message_template}
                  onChange={e => setForm({ ...form, message_template: e.target.value })}
                  placeholder="Use {name} for personalisation. E.g., Hi {name}! Here's 20% off your next order."
                  required
                  className="h-24"
                />
                {aiSuggestions.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {aiSource && (
                      <div className="flex justify-end">
                        <AiModeBadge source={aiSource} />
                      </div>
                    )}
                    {aiSuggestions.map((s, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setForm(prev => ({ ...prev, message_template: s }))}
                        className="block w-full text-left text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-indigo-300 dark:hover:border-indigo-500/50 text-slate-600 dark:text-slate-300"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label>Channel</Label>
                    {channelSource && <AiModeBadge source={channelSource} />}
                  </div>
                  <Select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}>
                    {CHANNELS.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </Select>
                </div>
                <Button type="button" variant="secondary" onClick={suggestChannel} disabled={aiLoading === 'channel' || !form.message_template}>
                  <SparkleIcon className="w-3.5 h-3.5" />
                  {aiLoading === 'channel' ? 'Thinking…' : 'Suggest channel'}
                </Button>
              </div>

              {formError && <p className="text-sm text-rose-500">{formError}</p>}
              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? 'Creating & sending…' : 'Create & Send Campaign'}
              </Button>
            </form>
          )}
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading campaigns…</p>
      ) : campaigns.length === 0 ? (
        <EmptyState title="No campaigns yet" description="Create your first campaign to start reaching shoppers." />
      ) : (
        <div className="space-y-4">
          {campaigns.map(campaign => (
            <Card key={campaign.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{campaign.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 max-w-md">{campaign.message_template}</p>
                </div>
                <div className="flex items-center gap-2">
                  <ChannelBadge channel={campaign.channel} />
                  <StatusBadge status={campaign.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <Metric label="Sent" value={campaign.stats?.total_sent || 0} />
                <Metric label="Delivered" value={campaign.stats?.delivered || 0} color="text-emerald-600 dark:text-emerald-400" />
                <Metric label="Opened" value={campaign.stats?.opened || 0} color="text-cyan-600 dark:text-cyan-400" />
                <Metric label="Clicked" value={campaign.stats?.clicked || 0} color="text-violet-600 dark:text-violet-400" />
                <Metric label="Failed" value={campaign.stats?.failed || 0} color="text-rose-600 dark:text-rose-400" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, color = 'text-slate-900 dark:text-slate-100' }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 py-2.5">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`text-lg font-semibold ${color}`}>{value}</p>
    </div>
  );
}
