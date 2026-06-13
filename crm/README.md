# Xeno CRM (app)

Next.js app for the Xeno CRM. See the [repository README](../README.md) for
architecture, AI features, data model and setup instructions.

## Local development

```bash
npm install
npm run dev
```

Requires the [channel service](../channel-service) running locally (default
`http://localhost:3001`) for campaign sends to receive delivery callbacks —
set `CHANNEL_SERVICE_URL` and `NEXT_PUBLIC_APP_URL` in `.env.local`.
