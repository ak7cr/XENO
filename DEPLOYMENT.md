# Deployment Guide

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### 1. Start the CRM Service

```bash
cd crm

# Install dependencies (if not already done)
npm install

# Create .env.local with channel service URL
echo "CHANNEL_SERVICE_URL=http://localhost:3001" > .env.local
echo "NEXT_PUBLIC_APP_URL=http://localhost:3000" >> .env.local

# Start development server
npm run dev
```

The CRM will be available at `http://localhost:3000`

### 2. Start the Channel Service (in a new terminal)

```bash
cd channel-service

# Install dependencies
npm install

# Start the service
npm start
```

The Channel Service will be running on `http://localhost:3001`

### 3. Test the Application

1. Open http://localhost:3000 in your browser
2. Click "Create Demo Data" to populate sample customers and orders
3. Navigate to the Segments tab and create a new segment
4. Go to Campaigns and create a campaign targeting your segment
5. Watch the dashboard as the Channel Service sends callbacks in real-time

---

## Production Deployment

### Option 1: Vercel + Railway

**CRM Service (Vercel):**

1. Push your code to GitHub
2. Go to https://vercel.com and connect your GitHub repo
3. Select the `crm` folder as the root
4. Set environment variables:
   - `CHANNEL_SERVICE_URL`: URL of deployed channel service (e.g., https://channel-service.railway.app)
   - `NEXT_PUBLIC_APP_URL`: Your Vercel deployment URL

5. Deploy

**Channel Service (Railway):**

1. Go to https://railway.app
2. Create new project from GitHub
3. Select channel-service folder
4. Set `PORT` to 3000 (Railway default)
5. Deploy

---

### Option 2: Docker Deployment

Create a `Dockerfile` for CRM:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY crm/package*.json ./

RUN npm ci

COPY crm/ .

RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]
```

Create a `Dockerfile` for Channel Service:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY channel-service/package*.json ./

RUN npm ci

COPY channel-service/ .

EXPOSE 3001

CMD ["npm", "start"]
```

---

### Option 3: AWS EC2 + RDS

1. Create EC2 instance (t3.micro or larger)
2. Install Node.js and git
3. Clone repository
4. Set up RDS PostgreSQL instance (replace SQLite for production)
5. Deploy using PM2:

```bash
npm install -g pm2

pm2 start "npm start" --name crm
pm2 start "npm start" --name channel-service --cwd ./channel-service

pm2 save
pm2 startup
```

---

## Environment Configuration

### CRM Service (.env.local or .env.production)

```
CHANNEL_SERVICE_URL=https://channel-service-prod.railway.app
NEXT_PUBLIC_APP_URL=https://xeno-crm.vercel.app
NODE_ENV=production
```

### Channel Service (Environment Variables)

```
PORT=3000
NODE_ENV=production
```

---

## Monitoring & Logging

### Local Development
- Check browser console for client-side errors
- Terminal shows server-side logs

### Production
- **Vercel**: Built-in logging dashboard
- **Railway**: Real-time logs available in dashboard
- **AWS CloudWatch**: Set up monitoring for EC2 instances

---

## Database Persistence

### SQLite (Current - Development Only)
- File stored in `data/crm.db`
- Suitable for demo/development
- Limited to single instance

### PostgreSQL (Recommended - Production)
1. Create RDS instance
2. Update `lib/db.ts` to use `pg` library
3. Connection string: `postgresql://user:pass@host:5432/crm`

---

## Scaling Considerations

### Current Limitations
- SQLite only supports one writer at a time
- All data stored in memory during development
- No load balancing

### For Production Scale

1. **Database**: Migrate to PostgreSQL
2. **Session Storage**: Use Redis for managing concurrent requests
3. **Message Queue**: Add Bull/RabbitMQ for campaign execution
4. **CDN**: Use Cloudflare for static assets
5. **Monitoring**: Set up Datadog or New Relic

---

## Troubleshooting

### "Channel service connection refused"
- Ensure channel-service is running on port 3001
- Check CHANNEL_SERVICE_URL environment variable

### "Communications not updating"
- Verify callback URL is reachable from channel service
- Check browser console for network errors
- Look at channel service logs

### "Demo data creation fails"
- Clear `data/crm.db` and restart
- Check file permissions on data directory

---

## Support

For issues or questions, check:
- Project README.md for architecture overview
- API documentation in code comments
- Test the health endpoint: GET /health (Channel Service)

