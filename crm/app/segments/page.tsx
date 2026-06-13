'use client';

import { useEffect, useState } from 'react';
import { Button, Card, EmptyState, Input, Label, PageHeader } from '@/components/ui';
import { PlusIcon, SparkleIcon, TargetIcon } from '@/components/icons';

interface Criteria {
  tier: string[];
  minSpend?: number;
  maxSpend?: number;
  daysSinceLastPurchase?: number;
  neverPurchased?: boolean;
  active?: boolean;
}

interface SegmentRow {
  id: string;
  name: string;
  criteria: Criteria;
  customer_count: number;
  created_at: string;
}

const EMPTY_CRITERIA: Criteria = { tier: [] };

const AI_GOALS = [
  { value: 're-engagement', label: 'Win back inactive shoppers' },
  { value: 'growth', label: 'Turn casual buyers into regulars' },
  { value: 'retention', label: 'Reward the most loyal customers' },
  { value: 'churn-prevention', label: 'Catch at-risk high-value customers early' },
  { value: 'launch', label: 'Reach everyone for a new launch' },
];

function criteriaSummary(criteria: Criteria) {
  const parts: string[] = [];
  if (criteria.tier?.length) parts.push(`Tier: ${criteria.tier.join(', ')}`);
  if (criteria.minSpend !== undefined) parts.push(`Spend ≥ $${criteria.minSpend}`);
  if (criteria.maxSpend !== undefined) parts.push(`Spend ≤ $${criteria.maxSpend}`);
  if (criteria.daysSinceLastPurchase !== undefined) parts.push(`Inactive ${criteria.daysSinceLastPurchase}+ days`);
  if (criteria.neverPurchased) parts.push('Never purchased');
  if (criteria.active) parts.push('Active in last 30 days');
  return parts.length ? parts : ['All customers'];
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<SegmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [criteria, setCriteria] = useState<Criteria>(EMPTY_CRITERIA);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [aiGoal, setAiGoal] = useState(AI_GOALS[0].value);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNote, setAiNote] = useState('');

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
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-side fetch on mount
    loadSegments();
  }, []);

  // Live preview of how many customers match the current criteria, debounced.
  useEffect(() => {
    if (!showForm) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- debounced fetch triggered by criteria changes
    setPreviewLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/segments/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ criteria }),
        });
        if (res.ok) {
          const data = await res.json();
          setPreviewCount(data.count);
        }
      } catch (error) {
        console.error('Error:', error);
      }
      setPreviewLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [criteria, showForm]);

  const toggleTier = (tier: string) => {
    setCriteria(prev => ({
      ...prev,
      tier: prev.tier.includes(tier) ? prev.tier.filter(t => t !== tier) : [...prev.tier, tier],
    }));
  };

  const askAi = async () => {
    setAiLoading(true);
    setAiNote('');
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'segment', context: { goal: aiGoal } }),
      });
      if (res.ok) {
        const data = await res.json();
        const suggestion = data.suggestions;
        setShowForm(true);
        setName(suggestion.name);
        setCriteria({ tier: [], ...suggestion.criteria });
        setAiNote(`AI suggested "${suggestion.name}" for this goal — tweak the criteria below if needed.`);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setAiLoading(false);
  };

  const handleCreateSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, criteria }),
      });

      if (res.ok) {
        setShowForm(false);
        setName('');
        setCriteria(EMPTY_CRITERIA);
        setAiNote('');
        await loadSegments();
      } else {
        const data = await res.json();
        setFormError(data.error || 'Failed to create segment');
      }
    } catch (error) {
      console.error('Error:', error);
      setFormError('Failed to create segment');
    }
    setSubmitting(false);
  };

  return (
    <div>
      <PageHeader
        title="Segments"
        description="Carve out audiences from your shopper base based on behaviour and attributes."
        action={
          <Button onClick={() => setShowForm(v => !v)}>
            <PlusIcon className="w-4 h-4" />
            {showForm ? 'Cancel' : 'New Segment'}
          </Button>
        }
      />

      <Card className="p-5 mb-6 border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-500/5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <SparkleIcon className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">AI segment assistant</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3">
              Tell it your marketing goal and it will draft a segment with sensible criteria — review and tweak before saving.
            </p>
            <div className="flex flex-wrap gap-2">
              {AI_GOALS.map(goal => (
                <button
                  key={goal.value}
                  onClick={() => setAiGoal(goal.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    aiGoal === goal.value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                  }`}
                >
                  {goal.label}
                </button>
              ))}
            </div>
            <Button size="sm" className="mt-3" onClick={askAi} disabled={aiLoading}>
              <SparkleIcon className="w-3.5 h-3.5" />
              {aiLoading ? 'Thinking…' : 'Suggest a segment'}
            </Button>
          </div>
        </div>
      </Card>

      {showForm && (
        <Card className="p-6 mb-6">
          {aiNote && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs flex items-center gap-2">
              <SparkleIcon className="w-3.5 h-3.5" /> {aiNote}
            </div>
          )}
          <form onSubmit={handleCreateSegment} className="space-y-5">
            <div>
              <Label>Segment Name</Label>
              <Input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Inactive Gold Customers"
                required
              />
            </div>

            <div>
              <Label>Customer Tier</Label>
              <div className="flex gap-2">
                {['bronze', 'silver', 'gold'].map(tier => (
                  <button
                    type="button"
                    key={tier}
                    onClick={() => toggleTier(tier)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors capitalize ${
                      criteria.tier.includes(tier)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Min. lifetime spend ($)</Label>
                <Input
                  type="number"
                  min={0}
                  value={criteria.minSpend ?? ''}
                  onChange={e => setCriteria(prev => ({ ...prev, minSpend: e.target.value === '' ? undefined : Number(e.target.value) }))}
                  placeholder="e.g., 200"
                />
              </div>
              <div>
                <Label>Max. lifetime spend ($)</Label>
                <Input
                  type="number"
                  min={0}
                  value={criteria.maxSpend ?? ''}
                  onChange={e => setCriteria(prev => ({ ...prev, maxSpend: e.target.value === '' ? undefined : Number(e.target.value) }))}
                  placeholder="e.g., 1000"
                />
              </div>
              <div>
                <Label>Inactive for (days)</Label>
                <Input
                  type="number"
                  min={0}
                  value={criteria.daysSinceLastPurchase ?? ''}
                  onChange={e => setCriteria(prev => ({ ...prev, daysSinceLastPurchase: e.target.value === '' ? undefined : Number(e.target.value) }))}
                  placeholder="e.g., 30"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={!!criteria.active}
                  onChange={e => setCriteria(prev => ({ ...prev, active: e.target.checked }))}
                  className="rounded border-slate-300"
                />
                Active in last 30 days
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={!!criteria.neverPurchased}
                  onChange={e => setCriteria(prev => ({ ...prev, neverPurchased: e.target.checked }))}
                  className="rounded border-slate-300"
                />
                Never purchased
              </label>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {previewLoading ? 'Calculating…' : (
                  <>Matches <span className="font-semibold text-slate-900 dark:text-slate-100">{previewCount ?? '—'}</span> customer{previewCount === 1 ? '' : 's'}</>
                )}
              </p>
              {formError && <p className="text-sm text-rose-500">{formError}</p>}
              <Button type="submit" disabled={submitting || previewCount === 0}>
                {submitting ? 'Creating…' : 'Create Segment'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading segments…</p>
      ) : segments.length === 0 ? (
        <EmptyState title="No segments yet" description="Use the AI assistant above or create one manually." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map(segment => (
            <Card key={segment.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <TargetIcon className="w-4.5 h-4.5" />
                </div>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{segment.customer_count}</p>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{segment.name}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">customers in segment</p>
              <div className="flex flex-wrap gap-1.5">
                {criteriaSummary(segment.criteria).map((part, i) => (
                  <span key={i} className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs">
                    {part}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
