import { NextRequest, NextResponse } from 'next/server';

// AI endpoint for generating messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, context } = body;

    if (!type || !context) {
      return NextResponse.json(
        { error: 'Missing required fields: type, context' },
        { status: 400 }
      );
    }

    // For demo purposes, return intelligent suggestions without calling OpenAI
    // In production, this would call OpenAI API

    if (type === 'message') {
      const { segment_name, brand_name, product } = context;
      const suggestions = generateMessageSuggestions(segment_name, brand_name, product);
      return NextResponse.json({ suggestions });
    }

    if (type === 'channel') {
      const { audience_type, message_length } = context;
      const recommendation = recommendChannel(audience_type, message_length);
      return NextResponse.json({ recommendation });
    }

    if (type === 'segment') {
      const { goal } = context;
      const suggestions = sugmentSuggestions(goal);
      return NextResponse.json({ suggestions });
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
  } catch (error) {
    console.error('Error in AI endpoint:', error);
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 });
  }
}

function generateMessageSuggestions(segment: string, brand: string, product: string) {
  const suggestions: Record<string, string[]> = {
    'high-value-inactive': [
      `Hey {name}! ☕ We miss you! Enjoy 20% off your next {product} order. Use code: COMEBACK20`,
      `{name}, your favorite {brand} {product} is on sale! Come back and shop 15% off.`,
      `Welcome back to {brand}! As a valued customer, here's 25% off {product}.`,
    ],
    'new-customers': [
      `Welcome to {brand}! 🎉 Here's 15% off your first order on {product}.`,
      `{name}, thanks for choosing {brand}! Start with 20% off {product}.`,
      `Get started with {brand}: exclusive first-time buyer discount of 15% on {product}`,
    ],
    'loyal-customers': [
      `{name}, you're amazing! Unlock exclusive VIP access to new {product} launches.`,
      `Our best customer {name}! Here's an exclusive gift with your next purchase of {product}.`,
      `{name}, your loyalty matters! Enjoy free shipping on all {product} orders this week.`,
    ],
    'browse-no-buy': [
      `{name}, ready to complete your purchase? Use code: READY10 for 10% off {product}`,
      `You were looking at {product}! {name}, here's 15% off to make your decision easier.`,
      `{name}, finish what you started. Here's 20% off the {product} you were eyeing.`,
    ],
  };

  return suggestions[segment] || suggestions['new-customers'];
}

function recommendChannel(audienceType: string, messageLength: number) {
  const channels = {
    'long-message': 'email',
    'short-message': messageLength > 50 ? 'email' : 'sms',
    'high-engagement': 'whatsapp',
    'time-sensitive': 'sms',
    'premium': 'rcs',
  };

  return channels[audienceType as keyof typeof channels] || 'email';
}

function sugmentSuggestions(goal: string) {
  const suggestions: Record<string, any> = {
    're-engagement': {
      name: 'Inactive High-Value Customers',
      criteria: {
        tier: ['silver', 'gold'],
        daysSinceLastPurchase: 60,
      },
    },
    'growth': {
      name: 'Active Customers Eligible for Upgrade',
      criteria: {
        tier: ['bronze'],
        minSpend: 100,
        active: true,
      },
    },
    'retention': {
      name: 'VIP Customers',
      criteria: {
        tier: ['gold'],
        minSpend: 1000,
      },
    },
    'churn-prevention': {
      name: 'Recently Inactive Gold Customers',
      criteria: {
        tier: ['gold'],
        daysSinceLastPurchase: 30,
      },
    },
    'launch': {
      name: 'All Active Customers',
      criteria: {
        active: true,
      },
    },
  };

  return suggestions[goal] || suggestions['launch'];
}
