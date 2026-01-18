# Haulkind Platform Deployment Guide

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Variables](#environment-variables)
3. [Backend Deployment](#backend-deployment)
4. [Web App Deployment](#web-app-deployment)
5. [Mobile Apps Build](#mobile-apps-build)
6. [Admin Dashboard Deployment](#admin-dashboard-deployment)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Rollback Procedure](#rollback-procedure)

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (`pnpm test`)
- [ ] No TypeScript errors (`pnpm tsc --noEmit`)
- [ ] No linting errors (`pnpm lint`)
- [ ] Code reviewed and approved
- [ ] Git tagged with version number

### Database
- [ ] Database migrations tested on staging
- [ ] Backup of production database created
- [ ] Migration rollback plan documented
- [ ] Database indexes verified

### Security
- [ ] All API keys rotated
- [ ] Environment variables secured
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] SSL certificates valid

### Infrastructure
- [ ] Server resources adequate (CPU, RAM, disk)
- [ ] CDN configured for static assets
- [ ] Load balancer configured
- [ ] Monitoring tools set up (Sentry, New Relic)
- [ ] Backup strategy in place

### Third-Party Services
- [ ] Stripe account verified (if using Stripe mode)
- [ ] S3 bucket configured with proper ACLs
- [ ] Google Maps API key valid
- [ ] Email service configured
- [ ] SMS service configured (if needed)

---

## Environment Variables

### Backend (.env)

```bash
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=mysql://user:password@host:3306/haulkind

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# OAuth (Manus)
OAUTH_SERVER_URL=https://api.manus.im
OWNER_OPEN_ID=your-owner-open-id
OWNER_NAME=Your Name

# Stripe (optional)
STRIPE_MODE=ledger  # or sandbox or prod
STRIPE_TEST_SECRET_KEY=sk_test_...  # if sandbox
STRIPE_LIVE_SECRET_KEY=sk_live_...  # if prod
STRIPE_WEBHOOK_SECRET=whsec_...

# S3 Storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=haulkind-storage

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-key

# Notifications
NOTIFICATION_API_URL=https://api.manus.im/notifications
NOTIFICATION_API_KEY=your-notification-key

# Socket.io
SOCKET_IO_CORS_ORIGIN=https://haulkind.com,https://admin.haulkind.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Email (optional)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
FROM_EMAIL=noreply@haulkind.com

# SMS (optional)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+15551234567
```

### Web App (.env)

```bash
NEXT_PUBLIC_API_URL=https://api.haulkind.com
NEXT_PUBLIC_SOCKET_URL=https://api.haulkind.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### Driver App (.env)

```bash
EXPO_PUBLIC_API_URL=https://api.haulkind.com
EXPO_PUBLIC_SOCKET_URL=https://api.haulkind.com
```

### Customer App (.env)

```bash
EXPO_PUBLIC_API_URL=https://api.haulkind.com
EXPO_PUBLIC_SOCKET_URL=https://api.haulkind.com
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # if using Stripe
```

### Admin Dashboard (.env)

```bash
NEXT_PUBLIC_API_URL=https://api.haulkind.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

---

## Backend Deployment

### Option 1: Docker (Recommended)

**1. Create Dockerfile:**

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY drizzle ./drizzle
COPY server ./server
COPY shared ./shared

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

# Build
RUN pnpm build

# Expose port
EXPOSE 3000

# Start server
CMD ["pnpm", "start"]
```

**2. Build and push:**

```bash
docker build -t haulkind-backend:latest .
docker tag haulkind-backend:latest your-registry/haulkind-backend:latest
docker push your-registry/haulkind-backend:latest
```

**3. Deploy:**

```bash
docker pull your-registry/haulkind-backend:latest
docker stop haulkind-backend || true
docker rm haulkind-backend || true
docker run -d \
  --name haulkind-backend \
  --env-file .env \
  -p 3000:3000 \
  --restart unless-stopped \
  your-registry/haulkind-backend:latest
```

### Option 2: PM2

**1. Install PM2:**

```bash
npm install -g pm2
```

**2. Create ecosystem.config.js:**

```javascript
module.exports = {
  apps: [{
    name: 'haulkind-backend',
    script: 'pnpm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }],
}
```

**3. Deploy:**

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Run migrations
pnpm db:push

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 3: Serverless (AWS Lambda + API Gateway)

**1. Install Serverless Framework:**

```bash
npm install -g serverless
```

**2. Create serverless.yml:**

```yaml
service: haulkind-backend

provider:
  name: aws
  runtime: nodejs22.x
  region: us-east-1
  environment:
    DATABASE_URL: ${env:DATABASE_URL}
    JWT_SECRET: ${env:JWT_SECRET}
    # ... other env vars

functions:
  api:
    handler: server/lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
```

**3. Deploy:**

```bash
serverless deploy --stage production
```

---

## Web App Deployment

### Option 1: Vercel (Recommended)

**1. Install Vercel CLI:**

```bash
npm install -g vercel
```

**2. Deploy:**

```bash
cd apps/web
vercel --prod
```

**3. Configure environment variables in Vercel dashboard**

### Option 2: Netlify

**1. Install Netlify CLI:**

```bash
npm install -g netlify-cli
```

**2. Deploy:**

```bash
cd apps/web
netlify deploy --prod
```

### Option 3: Self-Hosted (Nginx)

**1. Build:**

```bash
cd apps/web
pnpm build
```

**2. Configure Nginx:**

```nginx
server {
    listen 80;
    server_name haulkind.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**3. Start:**

```bash
pnpm start
```

---

## Mobile Apps Build

### Prerequisites

- Expo account (https://expo.dev)
- Apple Developer account (for iOS)
- Google Play Console account (for Android)

### Setup EAS (Expo Application Services)

**1. Install EAS CLI:**

```bash
npm install -g eas-cli
```

**2. Login to Expo:**

```bash
eas login
```

**3. Configure EAS:**

```bash
cd apps/driver  # or apps/customer
eas build:configure
```

### Build for iOS

**1. Create eas.json:**

```json
{
  "build": {
    "production": {
      "ios": {
        "bundleIdentifier": "com.haulkind.driver",
        "buildType": "app-store"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id"
      }
    }
  }
}
```

**2. Build:**

```bash
eas build --platform ios --profile production
```

**3. Submit to App Store:**

```bash
eas submit --platform ios --profile production
```

### Build for Android

**1. Update eas.json:**

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle",
        "gradleCommand": ":app:bundleRelease"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

**2. Build:**

```bash
eas build --platform android --profile production
```

**3. Submit to Google Play:**

```bash
eas submit --platform android --profile production
```

### Over-the-Air (OTA) Updates

**1. Configure:**

```bash
eas update:configure
```

**2. Publish update:**

```bash
eas update --branch production --message "Bug fixes and improvements"
```

---

## Admin Dashboard Deployment

Same as Web App deployment (Vercel/Netlify/Self-Hosted).

**Domain:** admin.haulkind.com

---

## Post-Deployment Verification

### Backend Health Check

```bash
curl https://api.haulkind.com/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Database Connection

```bash
curl https://api.haulkind.com/health/db
# Expected: {"status":"ok","connected":true}
```

### Web App

```bash
curl -I https://haulkind.com
# Expected: HTTP/2 200
```

### Critical Path Test

1. **Customer Flow:**
   - [ ] Visit https://haulkind.com
   - [ ] Click "Get a Quote"
   - [ ] Enter location (PA/NY/NJ)
   - [ ] Select volume tier
   - [ ] Add add-ons
   - [ ] Upload photos
   - [ ] See price summary
   - [ ] Complete payment (test mode)
   - [ ] See "Matching driver..." status

2. **Driver Flow:**
   - [ ] Open driver app
   - [ ] Login
   - [ ] Go online
   - [ ] Receive offer notification
   - [ ] Accept offer
   - [ ] Update status to EN_ROUTE
   - [ ] Upload BEFORE photos
   - [ ] Update status to STARTED
   - [ ] Upload AFTER photos
   - [ ] Mark as COMPLETED
   - [ ] See payout confirmation

3. **Admin Flow:**
   - [ ] Login to admin.haulkind.com
   - [ ] View active jobs
   - [ ] View active drivers on map
   - [ ] Force assign a job
   - [ ] Edit pricing
   - [ ] View audit logs

### Monitoring

- [ ] Sentry receiving error reports
- [ ] New Relic showing metrics
- [ ] Uptime monitor pinging endpoints
- [ ] Logs being collected (CloudWatch, Loggly, etc.)

---

## Rollback Procedure

### Backend Rollback

**Docker:**

```bash
docker stop haulkind-backend
docker rm haulkind-backend
docker run -d \
  --name haulkind-backend \
  --env-file .env \
  -p 3000:3000 \
  --restart unless-stopped \
  your-registry/haulkind-backend:previous-version
```

**PM2:**

```bash
pm2 stop haulkind-backend
git checkout previous-version-tag
pnpm install
pm2 restart haulkind-backend
```

### Database Rollback

```bash
# Restore from backup
mysql -u user -p haulkind < backup-YYYY-MM-DD.sql

# Or run down migration
pnpm drizzle-kit drop
```

### Web App Rollback

**Vercel:**

```bash
vercel rollback
```

**Netlify:**

```bash
netlify rollback
```

### Mobile Apps Rollback

**OTA Update:**

```bash
eas update --branch production --message "Rollback to stable version"
```

**App Store/Play Store:**
- Reject pending review
- Or submit previous version

---

## Deployment Checklist Summary

### Pre-Deploy
- [ ] Tests passing
- [ ] Code reviewed
- [ ] Database backup created
- [ ] Environment variables set
- [ ] Monitoring configured

### Deploy
- [ ] Backend deployed
- [ ] Database migrated
- [ ] Web app deployed
- [ ] Mobile apps built and submitted
- [ ] Admin dashboard deployed

### Post-Deploy
- [ ] Health checks passing
- [ ] Critical path tested
- [ ] Monitoring active
- [ ] Team notified
- [ ] Documentation updated

### Rollback Plan
- [ ] Previous version tagged
- [ ] Database backup available
- [ ] Rollback steps documented
- [ ] Team trained on rollback

---

## Support Contacts

- **Infrastructure:** devops@haulkind.com
- **Backend:** backend@haulkind.com
- **Frontend:** frontend@haulkind.com
- **Mobile:** mobile@haulkind.com
- **On-Call:** oncall@haulkind.com

---

## Deployment Schedule

**Recommended:**
- **Backend:** Deploy during low-traffic hours (2-4 AM EST)
- **Web:** Can deploy anytime (zero-downtime with Vercel/Netlify)
- **Mobile:** Submit for review 3-5 days before target release
- **Database:** Migrations during maintenance window

**Maintenance Window:**
- **Preferred:** Sunday 2-4 AM EST
- **Backup:** Wednesday 2-4 AM EST

---

## Monitoring Dashboards

- **Uptime:** https://status.haulkind.com
- **Errors:** https://sentry.io/haulkind
- **Performance:** https://newrelic.com/haulkind
- **Logs:** https://logs.haulkind.com
- **Analytics:** https://analytics.haulkind.com

---

## Emergency Contacts

- **CEO:** +1 (555) 000-0001
- **CTO:** +1 (555) 000-0002
- **DevOps Lead:** +1 (555) 000-0003
- **On-Call Engineer:** +1 (555) 000-0004

---

## Version History

| Version | Date | Changes | Deployed By |
|---------|------|---------|-------------|
| 1.0.0 | 2026-01-17 | Initial release | Manus AI |
| | | | |

---

## Notes

- Always test on staging before production
- Keep this document updated with each deployment
- Review and update emergency contacts quarterly
- Rotate API keys every 90 days
- Review monitoring alerts weekly
