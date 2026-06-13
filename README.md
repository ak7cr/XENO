# Xeno CRM

An AI-native mini CRM for reaching shoppers — segment your customer base, send
personalised campaigns across Email, SMS, WhatsApp and RCS, and track delivery
performance through a fully simulated, callback-driven channel loop.

Built for the Xeno engineering take-home assignment.

## What it does

- **Ingest data** — customers and their orders are stored in SQLite, with
  customers auto-tiered (bronze/silver/gold) based on lifetime spend.
- **Segment shoppers** — build audiences from tier, spend, recency and
  activity criteria, with a live "N customers match" preview, or ask the
  **AI segment assistant** to draft a segment for a marketing goal
  (re-engagement, growth, retention, churn-prevention, launch).
- **Send personalised communications** — compose a message template (with
  `{name}` personalisation), optionally **generate message copy and a channel
  recommendation with AI**, and send to every customer in a segment.
- **Surface performance insights** — a dedicated Insights view shows
  sent/delivered/opened/clicked totals at the campaign level and rolled up by
  audience (segment), plus a live activity log of individual communications.

## Architecture

Two services, communicating only over HTTP — the callback-driven loop the
assignment calls out explicitly:

```
┌─────────────────────────┐        POST /api/send         ┌──────────────────────┐
│        Xeno CRM          │ ─────────────────────────────▶ │   Channel Service     │
│  (Next.js, app router)   │                                 │  (Express, stateless) │
│                          │                                 │                       │
│  • SQLite (customers,    │ ◀───────────────────────────── │  Simulates delivery,  │
│    orders, segments,     │   POST /api/communications/    │  open, read, click,   │
│    campaigns, comms)     │        callback (async)        │  failure with random  │
│  • AI suggest endpoint   │                                 │  delays per message    │
└─────────────────────────┘                                 └──────────────────────┘
```

1. Creating a campaign with `send_now: true` resolves the target segment to a
   list of customers, writes one `communications` row per recipient (status
   `sent`), and POSTs the batch to the channel service.
2. The channel service does **not** deliver anything — for each message it
   randomly schedules a sequence of outcomes (delivered → opened → read →
   clicked, or failed) with realistic delays and probabilities, then calls
   back into the CRM's `/api/communications/callback` endpoint.
3. The CRM updates each communication's status/timestamps idempotently.
   Campaign and audience-level stats (`/api/campaigns`, `/api/segments`,
   Insights page) are computed on read, so the dashboard reflects the latest
   state without polling the channel service.

## AI-native surface area

AI is wired into the product at the two points marketers actually get stuck:

- **"What audience should I target?"** — the Segments page has an AI
  assistant that takes a goal and proposes a segment name + criteria, which
  the marketer can review, tweak (with a live match-count preview) and save.
- **"What should I say, and where?"** — the Campaigns form can generate
  message copy tailored to the selected audience, and recommend a channel
  based on the drafted message.

The suggestion logic lives behind a single `POST /api/ai/suggest` endpoint
(`type: segment | message | channel`). It currently runs on deterministic,
rule-based heuristics so the demo works with zero API keys and zero latency —
the endpoint is the seam where a real LLM call (the `openai`/Anthropic SDKs)
would slot in without changing the UI.

## Tech stack

- **Frontend/Backend**: Next.js (App Router) + React + TypeScript + Tailwind CSS v4
- **Database**: SQLite via `better-sqlite3`
- **Channel service**: standalone Node.js/Express app
- **Dark mode**: class-based Tailwind dark variant, toggle persisted to `localStorage`

## Project structure

```
crm/
  app/
    page.tsx                 # Dashboard (stats, funnel, tier breakdown)
    customers/page.tsx        # Customer list + order history
    segments/page.tsx         # Segment builder + AI assistant
    campaigns/page.tsx        # Campaign composer + AI copy/channel suggestions
    insights/page.tsx         # Campaign & audience performance, activity log
    api/
      customers/               # GET/POST customers, GET by id
      orders/                   # GET/POST orders (updates spend + tier)
      segments/                 # CRUD + /preview (live match count)
      campaigns/                # CRUD + send-to-segment
      communications/           # list + /callback (receipt API)
      ai/suggest/               # segment / message / channel suggestions
      stats/                    # dashboard aggregates
      seed/                     # demo data generator
  components/                  # Sidebar/app shell, theme toggle, UI primitives, icons
  lib/
    db.ts                      # SQLite connection + schema
    segments.ts                # shared segment-criteria → SQL builder
    theme-provider.tsx          # dark mode context
    types.ts                    # shared TypeScript types

channel-service/
  server.js                    # stubbed channel: /api/send + delivery simulation
```

## Data model

```
customers   (id, email, phone, name, tier, total_spend, last_purchase_date, created_at)
orders      (id, customer_id, product_name, amount, date)
segments    (id, name, criteria JSON, customer_count, created_at)
campaigns   (id, segment_id, name, message_template, channel, status, created_at, sent_at)
communications (id, campaign_id, customer_id, message, channel, status,
                 sent_at, delivered_at, opened_at, read_at, clicked_at)
```

`segments.customer_count` is recomputed on every read from the live
`customers` table, so counts stay accurate as data changes — it's stored
purely as a cache of the value at creation time.

## Running locally

```bash
# Terminal 1 — CRM
cd crm
npm install
echo "CHANNEL_SERVICE_URL=http://localhost:3001" > .env.local
echo "NEXT_PUBLIC_APP_URL=http://localhost:3000" >> .env.local
npm run dev

# Terminal 2 — Channel service
cd channel-service
npm install
npm start
```

Open http://localhost:3000, then use the "Load demo data" button on the
dashboard to seed a sample shopper base.

## Scale assumptions & tradeoffs

- **SQLite** keeps the demo self-contained with zero external infra. At real
  scale this becomes Postgres (the query layer is a thin SQL builder in
  `lib/segments.ts`, deliberately kept swap-friendly), with the channel
  service backed by a queue (e.g. SQS/BullMQ) instead of `setTimeout`-based
  scheduling.
- **Synchronous segment resolution on send** is fine for hundreds–low
  thousands of recipients. At higher volume, campaign sends would be
  paginated/batched into the queue rather than resolved in one request.
- **Callbacks are idempotent updates keyed by `communication_id`** — safe to
  retry. A production version would add callback signature verification and
  a dead-letter path for repeated failures.
- **AI suggestions are rule-based** by design for this scope (no API keys,
  instant, deterministic for demo purposes), with the suggestion logic
  isolated behind one endpoint so it can be swapped for an LLM call.

See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment options and production
database notes.
