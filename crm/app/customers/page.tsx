'use client';

import { Fragment, useEffect, useState } from 'react';
import { Button, Card, EmptyState, Input, Label, PageHeader, TierBadge } from '@/components/ui';
import { PlusIcon } from '@/components/icons';

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: string;
  total_spend: number;
  last_purchase_date: string | null;
  created_at: string;
}

interface OrderRow {
  id: string;
  product_name: string;
  amount: number;
  date: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [orders, setOrders] = useState<Record<string, OrderRow[]>>({});
  const [ordersLoading, setOrdersLoading] = useState<string | null>(null);

  const loadCustomers = async () => {
    try {
      const res = await fetch('/api/customers?limit=200');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-side fetch on mount
    loadCustomers();
  }, []);

  const toggleExpand = async (customerId: string) => {
    if (expanded === customerId) {
      setExpanded(null);
      return;
    }
    setExpanded(customerId);
    if (!orders[customerId]) {
      setOrdersLoading(customerId);
      try {
        const res = await fetch(`/api/orders?customer_id=${customerId}&limit=20`);
        if (res.ok) {
          const data = await res.json();
          setOrders(prev => ({ ...prev, [customerId]: data.data || [] }));
        }
      } catch (error) {
        console.error('Error:', error);
      }
      setOrdersLoading(null);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData)),
      });

      if (res.ok) {
        setShowForm(false);
        await loadCustomers();
      } else {
        const data = await res.json();
        setFormError(data.error || 'Failed to create customer');
      }
    } catch (error) {
      console.error('Error:', error);
      setFormError('Failed to create customer');
    }
    setSubmitting(false);
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Your shopper base — purchase history and tiering drive segmentation."
        action={
          <Button onClick={() => setShowForm(v => !v)}>
            <PlusIcon className="w-4 h-4" />
            {showForm ? 'Cancel' : 'Add Customer'}
          </Button>
        }
      />

      {showForm && (
        <Card className="p-6 mb-6">
          <form onSubmit={handleAddCustomer} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Name</Label>
              <Input type="text" name="name" placeholder="Jane Doe" required />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" name="email" placeholder="jane@example.com" required />
            </div>
            <div>
              <Label>Phone</Label>
              <Input type="tel" name="phone" placeholder="+1234567890" required />
            </div>
            {formError && <p className="sm:col-span-3 text-sm text-rose-500">{formError}</p>}
            <div className="sm:col-span-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Customer'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading customers…</p>
      ) : customers.length === 0 ? (
        <EmptyState title="No customers yet" description="Add a customer or load demo data from the dashboard." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Contact</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tier</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Spend</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Last Purchase</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {customers.map(customer => (
                <Fragment key={customer.id}>
                  <tr
                    onClick={() => toggleExpand(customer.id)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                  >
                    <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-slate-100">{customer.name}</td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                      <div>{customer.email}</div>
                      <div className="text-xs">{customer.phone}</div>
                    </td>
                    <td className="px-5 py-3.5"><TierBadge tier={customer.tier} /></td>
                    <td className="px-5 py-3.5 text-slate-900 dark:text-slate-100">${customer.total_spend.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                      {customer.last_purchase_date ? new Date(customer.last_purchase_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-indigo-600 dark:text-indigo-400">
                      {expanded === customer.id ? 'Hide orders' : 'View orders'}
                    </td>
                  </tr>
                  {expanded === customer.id && (
                    <tr className="bg-slate-50 dark:bg-slate-800/30">
                      <td colSpan={6} className="px-5 py-4">
                        {ordersLoading === customer.id ? (
                          <p className="text-xs text-slate-500 dark:text-slate-400">Loading orders…</p>
                        ) : (orders[customer.id]?.length ?? 0) === 0 ? (
                          <p className="text-xs text-slate-500 dark:text-slate-400">No orders yet.</p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {orders[customer.id].map(order => (
                              <div key={order.id} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2">
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{order.product_name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">${order.amount.toFixed(2)} · {new Date(order.date).toLocaleDateString()}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
