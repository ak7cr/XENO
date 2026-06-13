'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [customers, setCustomers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSeeding, setShowSeeding] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [customersRes, campaignsRes, segmentsRes] = await Promise.all([
        fetch('/api/customers?limit=5'),
        fetch('/api/campaigns?limit=5'),
        fetch('/api/segments?limit=5'),
      ]);

      if (customersRes.ok) {
        const data = await customersRes.json();
        setCustomers(data.data || []);
      }
      if (campaignsRes.ok) {
        const data = await campaignsRes.json();
        setCampaigns(data.data || []);
      }
      if (segmentsRes.ok) {
        const data = await segmentsRes.json();
        setSegments(data.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const seedData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      if (res.ok) {
        setShowSeeding(false);
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Error seeding data:', error);
    }
    setLoading(false);
  };

  if (showSeeding && customers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">XENO Mini CRM</h1>
            <p className="text-xl text-gray-600 mb-8">AI-Native Customer Engagement Platform</p>
            <div className="bg-white rounded-lg shadow-lg p-12 mb-8">
              <p className="text-gray-700 mb-6 text-lg">Get started with demo data</p>
              <button
                onClick={seedData}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Creating Demo Data...' : 'Create Demo Data'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">XENO CRM Dashboard</h1>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-8">
            {['dashboard', 'customers', 'campaigns', 'segments'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 font-medium text-sm border-b-2 ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && <DashboardView customers={customers} campaigns={campaigns} segments={segments} />}
        {activeTab === 'customers' && <CustomersView />}
        {activeTab === 'campaigns' && <CampaignsView />}
        {activeTab === 'segments' && <SegmentsView />}
      </div>
    </div>
  );
}

function DashboardView({ customers, campaigns, segments }: any) {
  const totalCampaigns = campaigns.length;
  const totalCustomers = customers.length;
  const totalSegments = segments.length;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalCustomers}</p>
            </div>
            <div className="text-4xl text-blue-500">👥</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Campaigns</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalCampaigns}</p>
            </div>
            <div className="text-4xl text-green-500">📨</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Segments</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalSegments}</p>
            </div>
            <div className="text-4xl text-purple-500">🎯</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Recent Customers</h3>
          <div className="space-y-3">
            {customers.slice(0, 5).map((customer: any) => (
              <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-900">{customer.name}</p>
                  <p className="text-sm text-gray-600">{customer.email}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  customer.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                  customer.tier === 'silver' ? 'bg-gray-100 text-gray-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {customer.tier.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Segments Overview</h3>
          <div className="space-y-3">
            {segments.slice(0, 5).map((segment: any) => (
              <div key={segment.id} className="p-3 bg-gray-50 rounded">
                <p className="font-medium text-gray-900">{segment.name}</p>
                <p className="text-sm text-gray-600">{segment.customer_count} customers</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomersView() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers?limit=100');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const handleAddCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {showForm ? 'Cancel' : 'Add Customer'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded"
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded"
            >
              Create Customer
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total Spend</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.map((customer: any) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{customer.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{customer.email}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    customer.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                    customer.tier === 'silver' ? 'bg-gray-100 text-gray-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {customer.tier.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">${customer.total_spend.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CampaignsView() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    segment_id: '',
    name: '',
    message_template: '',
    channel: 'email',
  });

  useEffect(() => {
    loadCampaigns();
    loadSegments();
  }, []);

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

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newCampaign, send_now: true }),
      });

      if (res.ok) {
        setShowForm(false);
        setNewCampaign({ segment_id: '', name: '', message_template: '', channel: 'email' });
        await loadCampaigns();
      }
    } catch (error) {
      console.error('Error:', error);
    }

    setLoading(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Campaigns</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {showForm ? 'Cancel' : 'Create Campaign'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <form onSubmit={handleCreateCampaign} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Campaign Name</label>
              <input
                type="text"
                value={newCampaign.name}
                onChange={e => setNewCampaign({...newCampaign, name: e.target.value})}
                placeholder="e.g., Spring Launch"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Select Segment</label>
              <select
                value={newCampaign.segment_id}
                onChange={e => setNewCampaign({...newCampaign, segment_id: e.target.value})}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded"
              >
                <option value="">Choose a segment...</option>
                {segments.map(seg => (
                  <option key={seg.id} value={seg.id}>
                    {seg.name} ({seg.customer_count} customers)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Message Template</label>
              <textarea
                value={newCampaign.message_template}
                onChange={e => setNewCampaign({...newCampaign, message_template: e.target.value})}
                placeholder="Use {name} for personalization. E.g., Hi {name}! Check out our new products..."
                required
                className="w-full px-4 py-2 border border-gray-300 rounded h-24"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Channel</label>
              <select
                value={newCampaign.channel}
                onChange={e => setNewCampaign({...newCampaign, channel: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="rcs">RCS</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Creating & Sending...' : 'Create & Send Campaign'}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {campaigns.map((campaign: any) => (
          <div key={campaign.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                <p className="text-sm text-gray-600">{campaign.channel.toUpperCase()} • {campaign.status}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                campaign.status === 'sent' ? 'bg-green-100 text-green-800' :
                campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {campaign.status}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Sent</p>
                <p className="text-xl font-bold text-gray-900">{campaign.stats?.total_sent || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-xl font-bold text-green-600">{campaign.stats?.delivered || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Opened</p>
                <p className="text-xl font-bold text-blue-600">{campaign.stats?.opened || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Clicked</p>
                <p className="text-xl font-bold text-purple-600">{campaign.stats?.clicked || 0}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SegmentsView() {
  const [segments, setSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newSegment, setNewSegment] = useState({
    name: '',
    criteria: {
      tier: [] as string[],
    },
  });

  useEffect(() => {
    loadSegments();
  }, []);

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

  const handleCreateSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSegment),
      });

      if (res.ok) {
        setShowForm(false);
        setNewSegment({ name: '', criteria: { tier: [] } });
        await loadSegments();
      }
    } catch (error) {
      console.error('Error:', error);
    }

    setLoading(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Segments</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {showForm ? 'Cancel' : 'Create Segment'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <form onSubmit={handleCreateSegment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Segment Name</label>
              <input
                type="text"
                value={newSegment.name}
                onChange={e => setNewSegment({...newSegment, name: e.target.value})}
                placeholder="e.g., High-Value Inactive"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Customer Tier</label>
              <div className="space-y-2">
                {['bronze', 'silver', 'gold'].map(tier => (
                  <label key={tier} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newSegment.criteria.tier.includes(tier)}
                      onChange={e => {
                        const tierList = e.target.checked
                          ? [...newSegment.criteria.tier, tier]
                          : newSegment.criteria.tier.filter(t => t !== tier);
                        setNewSegment({
                          ...newSegment,
                          criteria: { ...newSegment.criteria, tier: tierList },
                        });
                      }}
                      className="mr-2"
                    />
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Segment'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {segments.map((segment: any) => (
          <div key={segment.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{segment.name}</h3>
            <p className="text-2xl font-bold text-blue-600 mb-4">{segment.customer_count}</p>
            <p className="text-sm text-gray-600">customers in segment</p>
          </div>
        ))}
      </div>
    </div>
  );
}
