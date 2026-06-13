# XENO Mini CRM - Project Plan

## Product Vision
**Chat-assisted CRM** where marketers describe campaign goals and the AI helps them:
1. **Segment shoppers** intelligently (AI suggests segments based on behavior)
2. **Draft messages** (AI generates personalized message templates)
3. **Choose channels** (AI recommends optimal channels)
4. **Track performance** (Real-time dashboards of delivery, engagement, ROI)

## Demo Brand: Coffee Chain
- Scenario: DTC coffee brand with 500+ customers
- Orders with: product type, spend, purchase frequency, last purchase date
- Goal: Run targeted "new launch" or "loyalty" campaigns

## System Architecture

### Tech Stack
- **Frontend**: Next.js (React, Tailwind CSS)
- **Backend**: Next.js API Routes + SQLite (for simplicity)
- **AI**: OpenAI API (for segmentation, message drafting)
- **Channel Service**: Separate service (Node.js) that simulates delivery
- **Hosting**: Vercel (frontend) + Railway (channel service)

### Core Services

#### 1. CRM Service (Next.js)
- **Customer Data API**: Ingest and store customers + orders
- **Segmentation API**: AI-powered segment creation
- **Campaign API**: Create campaigns, send messages
- **Receipt API**: Accept delivery callbacks from channel service
- **Analytics API**: Track performance metrics

#### 2. Channel Service (Separate)
- **Send API**: Accepts campaign messages
- **Simulation Engine**: Simulates delivery outcomes (delivered, failed, opened, read, clicked)
- **Callback Service**: Calls CRM receipt API with results
- **Volume Handling**: Queues messages, retries failures

### Data Model

```
Customers:
  - id, email, phone, name, tier (bronze/silver/gold)
  - created_at, last_purchase_date

Orders:
  - id, customer_id, product_id, amount, date

Segments:
  - id, name, criteria (json), customer_count, created_by, created_at

Campaigns:
  - id, segment_id, message, channel, status, created_at

Communications:
  - id, campaign_id, customer_id, message, channel, status
  - sent_at, delivered_at, opened_at, clicked_at
```

### Key Features

**AI Integration Points:**
1. **Smart Segmentation**: "Show me high-value customers who haven't purchased in 30+ days"
2. **Message Generation**: "Generate a personalized re-engagement message for coffee lovers"
3. **Channel Selection**: "Which channel is best for this audience?"
4. **Performance Insights**: "What's driving conversions in this campaign?"

**Channel Service Simulation:**
- 80% delivered successfully
- 20% delivery failure
- 40% of delivered opened within 1 hour
- 10% clicked on call-to-action
- 5% converted to order

## Development Timeline
- **Day 1**: Project setup, data models, basic APIs
- **Day 2**: AI features, channel service, frontend UI
- **Day 3**: Testing, deployment, video

## Success Criteria
✅ Live hosted product
✅ AI-native workflow visible in UI and code
✅ Two-service architecture (CRM + Channel) with callbacks
✅ Clean, well-structured code
✅ ~5-6 min walkthrough video
