import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { SegmentCriteria } from '@/lib/segments';

const MODEL = 'gemini-2.5-flash';
const VALID_CHANNELS = ['email', 'sms', 'whatsapp', 'rcs'];
const VALID_TIERS = ['bronze', 'silver', 'gold'];

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  return apiKey ? new GoogleGenAI({ apiKey }) : null;
}

// AI endpoint for generating segment, message and channel suggestions.
// Uses Gemini when GEMINI_API_KEY is configured, falling back to
// deterministic rule-based heuristics otherwise (so the demo works with
// zero API keys and zero latency).
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

    const ai = getClient();

    if (type === 'message') {
      const { segment_name, brand_name, product } = context;
      const generated = ai ? await generateMessagesWithGemini(ai, segment_name, brand_name, product) : null;
      return NextResponse.json({ suggestions: generated ?? generateMessageSuggestions(segment_name) });
    }

    if (type === 'channel') {
      const { audience_type, message_length } = context;
      const recommended = ai ? await recommendChannelWithGemini(ai, audience_type, message_length) : null;
      return NextResponse.json({ recommendation: recommended ?? recommendChannel(audience_type, message_length) });
    }

    if (type === 'segment') {
      const { goal } = context;
      const suggested = ai ? await suggestSegmentWithGemini(ai, goal) : null;
      return NextResponse.json({ suggestions: suggested ?? sugmentSuggestions(goal) });
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
  } catch (error) {
    console.error('Error in AI endpoint:', error);
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 });
  }
}

async function generateMessagesWithGemini(
  ai: GoogleGenAI,
  segmentName: string,
  brandName: string,
  product: string
): Promise<string[] | null> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Write 3 short, distinct marketing messages (each under 200 characters) for "${brandName}", ` +
        `an online shop, to send to a customer segment described as "${segmentName}". The messages should ` +
        `encourage the customer to buy "${product}". Each message MUST include the literal placeholder ` +
        `"{name}" exactly once, where the customer's first name will be inserted. Friendly tone, at most one emoji.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    });

    const parsed = JSON.parse(response.text ?? 'null');
    if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(s => typeof s === 'string')) {
      return parsed;
    }
    return null;
  } catch (error) {
    console.error('Gemini message generation failed, falling back to rule-based suggestions:', error);
    return null;
  }
}

async function recommendChannelWithGemini(
  ai: GoogleGenAI,
  audienceType: string,
  messageLength: number
): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `A marketer is sending a campaign message that is ${messageLength} characters long to an ` +
        `audience described as "${audienceType}". Pick the single best delivery channel for this message.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: { channel: { type: Type.STRING, enum: VALID_CHANNELS } },
          required: ['channel'],
        },
      },
    });

    const parsed = JSON.parse(response.text ?? 'null') as { channel?: string } | null;
    return parsed?.channel && VALID_CHANNELS.includes(parsed.channel) ? parsed.channel : null;
  } catch (error) {
    console.error('Gemini channel recommendation failed, falling back to rule-based suggestion:', error);
    return null;
  }
}

async function suggestSegmentWithGemini(
  ai: GoogleGenAI,
  goal: string
): Promise<{ name: string; criteria: SegmentCriteria } | null> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `You are helping a marketer at an e-commerce shop build a customer segment for this goal: ` +
        `"${goal}". Suggest a short, descriptive segment name (3-5 words) and matching criteria. ` +
        `Available criteria fields: tier (subset of bronze/silver/gold), minSpend (lifetime spend in dollars), ` +
        `maxSpend, daysSinceLastPurchase (customer has not purchased in at least this many days), ` +
        `neverPurchased (boolean), active (boolean, purchased within the last 30 days). ` +
        `Only include fields that are relevant to the goal.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            criteria: {
              type: Type.OBJECT,
              properties: {
                tier: { type: Type.ARRAY, items: { type: Type.STRING, enum: VALID_TIERS } },
                minSpend: { type: Type.NUMBER },
                maxSpend: { type: Type.NUMBER },
                daysSinceLastPurchase: { type: Type.NUMBER },
                neverPurchased: { type: Type.BOOLEAN },
                active: { type: Type.BOOLEAN },
              },
            },
          },
          required: ['name', 'criteria'],
        },
      },
    });

    const parsed = JSON.parse(response.text ?? 'null') as { name: string; criteria: SegmentCriteria } | null;
    return parsed?.name && parsed.criteria ? parsed : null;
  } catch (error) {
    console.error('Gemini segment suggestion failed, falling back to rule-based suggestion:', error);
    return null;
  }
}

function generateMessageSuggestions(segment: string) {
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
  const suggestions: Record<string, { name: string; criteria: SegmentCriteria }> = {
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
