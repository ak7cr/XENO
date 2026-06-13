// Database types for the CRM
export interface Customer {
  id: string;
  email: string;
  phone: string;
  name: string;
  tier: 'bronze' | 'silver' | 'gold';
  created_at: string;
  last_purchase_date: string | null;
  total_spend: number;
}

export interface Order {
  id: string;
  customer_id: string;
  product_name: string;
  amount: number;
  date: string;
}

export interface Segment {
  id: string;
  name: string;
  criteria: Record<string, any>;
  customer_count: number;
  created_at: string;
}

export interface Campaign {
  id: string;
  segment_id: string;
  name: string;
  message_template: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'rcs';
  status: 'draft' | 'scheduled' | 'sent' | 'completed';
  created_at: string;
  sent_at: string | null;
}

export interface Communication {
  id: string;
  campaign_id: string;
  customer_id: string;
  message: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'rcs';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'opened' | 'read' | 'clicked';
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  read_at: string | null;
  clicked_at: string | null;
}

export interface CampaignStats {
  campaign_id: string;
  total_sent: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
}
