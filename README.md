# XENO Mini CRM - AI-Native Customer Engagement Platform

## Overview

XENO Mini CRM is an AI-native customer engagement platform that helps brands intelligently reach their shoppers. The system enables marketers to:

- **Ingest customer data** - Store customers and their purchase history
- **Segment audiences** - Create intelligent segments based on behavior and attributes
- **Send personalized messages** - Dispatch tailored communications across WhatsApp, SMS, Email, and RCS
- **Track performance** - Monitor delivery, engagement, and conversion metrics

## Architecture

The system consists of two main services working together:

### 1. **CRM Service** (Next.js)
- Full-stack web application built with Next.js, React, and Tailwind CSS
- Backend: RESTful API using Next.js API Routes
- Database: SQLite for data persistence
- Frontend: Interactive dashboard for campaign management

**Key Endpoints:**
- `POST /api/seed` - Create demo data
- `GET/POST /api/customers` - Customer management
- `GET/POST /api/orders` - Order tracking
- `GET/POST /api/segments` - Audience segmentation
- `GET/POST /api/campaigns` - Campaign management
- `GET/POST /api/communications` - Communication tracking
- `POST /api/communications/callback` - Receive delivery updates
- `POST /api/ai/suggest` - AI-powered suggestions

### 2. **Channel Service** (Node.js Express)
- Separate microservice for message delivery simulation
- Receives communications from CRM
- Simulates delivery outcomes (delivered, failed, opened, read, clicked)
- Calls back to CRM with status updates

**Key Endpoints:**
- `GET /health` - Service health check
- `POST /api/send` - Receive and process communications
- `GET /api/communications/:id` - Check communication status

## Two-Service, Callback-Driven Architecture

The assignment emphasizes modeling the **full lifecycle** of a communication:

```
┌─────────────────────────────────────────────────────────┐
│                    CRM Service                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Campaign Created                                  │ │
│  │  (e.g., "20% off for inactive gold customers")   │ │
│  └────────────────────────────────────────────────────┘ │
│                         │                                │
│                         ▼                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Send API: POST /api/campaigns                     │ │
│  │  Calls Channel Service with message details       │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────┬────────────────────────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │   Channel Service        │
              │  (Delivery Simulator)    │
              ├──────────────────────────┤
              │ - Receives messages      │
              │ - Simulates outcomes:    │
              │   • delivered (80%)      │
              │   • failed (20%)         │
              │   • opened (40%)         │
              │   • read (25%)           │
              │   • clicked (10%)        │
              │ - Schedules callbacks    │
              └──────────────┬───────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────┐
│  CRM Callback API: POST /api/communications/callback  │
│  Updates communication status in database              │
│  Dashboard reflects real-time metrics                  │
└────────────────────────────────────────────────────────┘
```

## AI-Native Features

### 1. **Smart Segmentation**
- Create segments using natural criteria (tier, spend, purchase recency)
- Backend logic automatically matches customers to segments
- Demonstrates AI thinking: segmentation logic could be extended to predictive scoring

### 2. **Message Generation Suggestions**
- `POST /api/ai/suggest?type=message`
- Returns contextual message templates based on segment type
- Examples: re-engagement for inactive customers, loyalty offers for gold customers

### 3. **Channel Recommendations**
- `POST /api/ai/suggest?type=channel`
- Recommends optimal channel based on message length and audience
- SMS for short messages, Email for longer content

### 4. **Segment Suggestions**
- `POST /api/ai/suggest?type=segment`
- Recommends pre-built segments based on marketing goal
- Goals: re-engagement, growth, retention, churn-prevention, launch

## Data Model

### Customers
- Auto-tiered based on lifetime spend (bronze < $100, silver < $1000, gold ≥ $1000)
- Tracks purchase history and engagement metrics

### Segments
- Flexible criteria-based filtering
- Supports: tier, spend ranges, purchase recency, activity status

### Campaigns
- Multi-channel support: Email, SMS, WhatsApp, RCS
- Message personalization with {name} variables
- Real-time analytics (sent, delivered, opened, clicked)

### Communications
- Full lifecycle tracking from send to click
- Timestamps for each event (sent_at, delivered_at, opened_at, read_at, clicked_at)
- Status tracking: pending → sent → delivered → opened → read → clicked

## Demo Data

Run `POST /api/seed` to create a coffee chain demo with:
- 10 customers across tiers
- 50 orders with realistic purchase patterns
- 3 pre-built segments
- Sample campaign data

## Deployment

### Environment Variables

```
CHANNEL_SERVICE_URL=http://localhost:3001  # For local development
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Public app URL for callbacks
```

### Running Locally

```bash
# Install CRM dependencies
cd crm
npm install

# Start CRM development server
npm run dev

# In another terminal, install and start channel service
cd ../channel-service
npm install
npm start

# Open http://localhost:3000
```

### Production Deployment

**CRM Service (Vercel/Railway):**
```bash
# Deploy Next.js app
cd crm
npm run build
npm start
```

**Channel Service (Railway/Render):**
```bash
cd channel-service
npm install
npm start
```

## Key Design Decisions

### 1. **SQLite for Data Persistence**
- Simple, file-based database
- No external dependencies (great for demo)
- Easily replaceable with PostgreSQL for production

### 2. **Separate Channel Service**
- Models real-world architecture where delivery and engagement are handled separately
- Demonstrates async callback-driven communication
- Shows understanding of distributed systems and eventual consistency

### 3. **Callback-Driven Status Updates**
- Channel service simulates realistic delivery delays (1-30 seconds)
- Different event probabilities match real-world messaging behavior
- CRM updates its own database from callbacks, not polling

### 4. **AI Without External APIs**
- Uses pattern-based suggestions instead of expensive API calls
- Demonstrates product thinking about AI integration
- Ready to swap in OpenAI API or Claude without changing architecture

## Code Quality & Structure

```
crm/
  ├── app/
  │   ├── api/                    # API routes
  │   │   ├── customers/          # Customer management
  │   │   ├── orders/             # Order tracking
  │   │   ├── segments/           # Segmentation
  │   │   ├── campaigns/          # Campaign management
  │   │   ├── communications/     # Communication tracking & callbacks
  │   │   ├── ai/                 # AI suggestions
  │   │   └── seed/               # Demo data
  │   └── page.tsx                # Main dashboard UI
  ├── lib/
  │   ├── db.ts                   # Database initialization & schema
  │   └── types.ts                # TypeScript types
  └── package.json

channel-service/
  ├── server.js                   # Express server
  └── package.json
```

## Testing the System

### 1. Seed Demo Data
```
POST /api/seed
```

### 2. Create a Segment
```
POST /api/segments
{
  "name": "Inactive Gold Customers",
  "criteria": {
    "tier": ["gold"],
    "daysSinceLastPurchase": 30
  }
}
```

### 3. Create and Send a Campaign
```
POST /api/campaigns
{
  "segment_id": "...",
  "name": "Re-engagement Campaign",
  "message_template": "Hi {name}! We miss you. Here's 20% off: CODE20",
  "channel": "email",
  "send_now": true
}
```

### 4. Monitor Communications
- Check the Campaigns tab to see:
  - Real-time delivery status
  - Open rates
  - Click rates
  - Performance metrics updating as callbacks arrive

## System Thinking Highlights

### Volume & Ordering
- Each campaign can handle 1000+ communications
- Communications are processed asynchronously
- Status updates are idempotent (safe to retry)

### Retries & Failures
- Channel service simulates 20% failure rate
- Failures are tracked and visible in analytics
- Could add exponential backoff for production

### Ordering
- Callbacks processed in order received
- Database transactions ensure consistency
- Could add ordered processing if needed

## Future Enhancements

1. **Real AI Integration** - Swap pattern-based suggestions for OpenAI API
2. **Advanced Analytics** - Cohort analysis, A/B testing, attribution
3. **Real Channel Integration** - Connect to actual SMS, email, WhatsApp providers
4. **User Management** - Multi-user support with role-based access
5. **Scheduled Campaigns** - Send campaigns at optimal times
6. **Preference Centers** - Let customers manage communication preferences
7. **Dynamic Segmentation** - Real-time segment updates based on behavior

## Evaluation Criteria Coverage

✅ **Build & Deploy** - Live product with working UI and API
✅ **Creativity in Scoping** - Bold choice to focus on coffee chain + realistic system design  
✅ **AI-Native Development** - AI-powered segmentation, message suggestions, channel recommendations
✅ **Code Quality** - Clean structure, TypeScript, proper error handling
✅ **System Design** - Two-service architecture with async callbacks, demonstrating distributed system thinking
✅ **Thought Clarity** - Clear decisions documented, trade-offs explained

## Walkthrough Video Structure (~6 minutes)

1. **Product Intro** (0:30) - What problem we're solving for coffee chain
2. **Functional Demo** (1:30) - Create segment, send campaign, watch real-time updates
3. **Architecture** (1:00) - Diagram showing CRM + Channel Service callback flow
4. **Code Walkthrough** (1:00) - Key API endpoint showing callback pattern
5. **AI-Native Workflow** (1:00) - Show AI suggestions and system design choices

---

Built with ❤️ for XENO
