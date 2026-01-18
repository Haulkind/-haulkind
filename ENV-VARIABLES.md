# Haulkind Environment Variables Reference

## Quick Start

Copy the appropriate `.env.example` file for each component and fill in your values.

---

## Backend Environment Variables

**File:** `/home/ubuntu/haulkind/.env`

### Required Variables

```bash
# Server Configuration
NODE_ENV=production                    # development | production
PORT=3000                              # Server port
HOST=0.0.0.0                           # Bind address

# Database
DATABASE_URL=mysql://user:password@host:3306/haulkind
# Format: mysql://username:password@hostname:port/database

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
# Generate with: openssl rand -base64 32

# OAuth (Manus Platform)
OAUTH_SERVER_URL=https://api.manus.im
OWNER_OPEN_ID=your-owner-open-id
OWNER_NAME=Your Name
```

### Optional Variables

```bash
# Stripe Payment Processing
STRIPE_MODE=ledger                     # ledger | sandbox | prod
STRIPE_TEST_SECRET_KEY=sk_test_...     # Required if STRIPE_MODE=sandbox
STRIPE_LIVE_SECRET_KEY=sk_live_...     # Required if STRIPE_MODE=prod
STRIPE_WEBHOOK_SECRET=whsec_...        # Webhook signature verification

# AWS S3 Storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=haulkind-storage

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Notifications
NOTIFICATION_API_URL=https://api.manus.im/notifications
NOTIFICATION_API_KEY=your-notification-api-key

# Socket.io
SOCKET_IO_CORS_ORIGIN=https://haulkind.com,https://admin.haulkind.com
# Comma-separated list of allowed origins

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000            # 15 minutes in milliseconds
RATE_LIMIT_MAX_REQUESTS=100            # Max requests per window

# Email (SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
FROM_EMAIL=noreply@haulkind.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+15551234567

# Logging
LOG_LEVEL=info                         # debug | info | warn | error
LOG_FORMAT=json                        # json | pretty

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
NEW_RELIC_LICENSE_KEY=your-new-relic-key
```

---

## Web App Environment Variables

**File:** `/home/ubuntu/haulkind/apps/web/.env.local`

### Required Variables

```bash
NEXT_PUBLIC_API_URL=https://api.haulkind.com
# Backend API base URL

NEXT_PUBLIC_SOCKET_URL=https://api.haulkind.com
# Socket.io server URL (usually same as API)

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
# Google Maps JavaScript API key
```

### Optional Variables

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
# Required if using Stripe payment mode

NEXT_PUBLIC_ANALYTICS_ID=UA-XXXXXXXXX-X
# Google Analytics tracking ID

NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
# Error tracking

NEXT_PUBLIC_ENV=production
# Environment name for display
```

---

## Driver App Environment Variables

**File:** `/home/ubuntu/haulkind/apps/driver/.env`

### Required Variables

```bash
EXPO_PUBLIC_API_URL=https://api.haulkind.com
# Backend API base URL

EXPO_PUBLIC_SOCKET_URL=https://api.haulkind.com
# Socket.io server URL
```

### Optional Variables

```bash
EXPO_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
# Error tracking

EXPO_PUBLIC_ENV=production
# Environment name
```

---

## Customer App Environment Variables

**File:** `/home/ubuntu/haulkind/apps/customer/.env`

### Required Variables

```bash
EXPO_PUBLIC_API_URL=https://api.haulkind.com
# Backend API base URL

EXPO_PUBLIC_SOCKET_URL=https://api.haulkind.com
# Socket.io server URL
```

### Optional Variables

```bash
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
# Required if using Stripe payment mode

EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
# For map display

EXPO_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
# Error tracking

EXPO_PUBLIC_ENV=production
# Environment name
```

---

## Admin Dashboard Environment Variables

**File:** `/home/ubuntu/haulkind/apps/admin/.env.local`

### Required Variables

```bash
NEXT_PUBLIC_API_URL=https://api.haulkind.com
# Backend API base URL

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
# For live map display
```

### Optional Variables

```bash
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
# Error tracking

NEXT_PUBLIC_ENV=production
# Environment name
```

---

## Environment-Specific Values

### Development

```bash
# Backend
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://root:password@localhost:3306/haulkind_dev
JWT_SECRET=dev-secret-key-not-for-production
STRIPE_MODE=ledger
SOCKET_IO_CORS_ORIGIN=http://localhost:3001,http://localhost:3002

# Web
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000

# Mobile Apps
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000
```

### Staging

```bash
# Backend
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://user:password@staging-db.example.com:3306/haulkind_staging
JWT_SECRET=staging-secret-key-32-chars-min
STRIPE_MODE=sandbox
STRIPE_TEST_SECRET_KEY=sk_test_...
SOCKET_IO_CORS_ORIGIN=https://staging.haulkind.com,https://admin-staging.haulkind.com

# Web
NEXT_PUBLIC_API_URL=https://api-staging.haulkind.com
NEXT_PUBLIC_SOCKET_URL=https://api-staging.haulkind.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Mobile Apps
EXPO_PUBLIC_API_URL=https://api-staging.haulkind.com
EXPO_PUBLIC_SOCKET_URL=https://api-staging.haulkind.com
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Production

```bash
# Backend
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://user:password@prod-db.example.com:3306/haulkind
JWT_SECRET=production-secret-key-32-chars-minimum-length
STRIPE_MODE=prod
STRIPE_LIVE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SOCKET_IO_CORS_ORIGIN=https://haulkind.com,https://admin.haulkind.com

# Web
NEXT_PUBLIC_API_URL=https://api.haulkind.com
NEXT_PUBLIC_SOCKET_URL=https://api.haulkind.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Mobile Apps
EXPO_PUBLIC_API_URL=https://api.haulkind.com
EXPO_PUBLIC_SOCKET_URL=https://api.haulkind.com
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## How to Get API Keys

### Stripe

1. Sign up at https://stripe.com
2. Go to Developers → API Keys
3. Copy "Publishable key" and "Secret key"
4. For webhooks: Developers → Webhooks → Add endpoint
5. Copy "Signing secret"

**Test Mode:**
- Publishable: `pk_test_...`
- Secret: `sk_test_...`

**Live Mode:**
- Publishable: `pk_live_...`
- Secret: `sk_live_...`

### Google Maps

1. Go to https://console.cloud.google.com
2. Create a new project
3. Enable APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Directions API
4. Create credentials → API Key
5. Restrict key to your domains

### AWS S3

1. Sign in to AWS Console
2. Go to IAM → Users → Add user
3. Attach policy: `AmazonS3FullAccess`
4. Create access key
5. Copy Access Key ID and Secret Access Key
6. Create S3 bucket in desired region

### Twilio (SMS)

1. Sign up at https://twilio.com
2. Get a phone number
3. Go to Console → Account → API Keys
4. Copy Account SID and Auth Token

### SendGrid (Email)

1. Sign up at https://sendgrid.com
2. Go to Settings → API Keys
3. Create API Key with "Mail Send" permission
4. Copy API key (starts with `SG.`)

### Sentry (Error Tracking)

1. Sign up at https://sentry.io
2. Create a new project
3. Copy DSN from Settings → Client Keys

### New Relic (Monitoring)

1. Sign up at https://newrelic.com
2. Go to Account Settings → API Keys
3. Create a license key

---

## Security Best Practices

### DO:
- ✅ Use different keys for dev/staging/prod
- ✅ Rotate keys every 90 days
- ✅ Use environment variables, never hardcode
- ✅ Add `.env` to `.gitignore`
- ✅ Use secret management tools (AWS Secrets Manager, Vault)
- ✅ Restrict API keys to specific domains/IPs
- ✅ Enable 2FA on all service accounts

### DON'T:
- ❌ Commit `.env` files to git
- ❌ Share keys in Slack/email
- ❌ Use production keys in development
- ❌ Give keys more permissions than needed
- ❌ Reuse keys across projects

---

## Validation

Use this script to validate environment variables:

```bash
#!/bin/bash
# validate-env.sh

required_vars=(
  "NODE_ENV"
  "PORT"
  "DATABASE_URL"
  "JWT_SECRET"
)

missing=()

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing+=("$var")
  fi
done

if [ ${#missing[@]} -gt 0 ]; then
  echo "❌ Missing required environment variables:"
  printf '  - %s\n' "${missing[@]}"
  exit 1
else
  echo "✅ All required environment variables are set"
fi
```

Run before deployment:

```bash
chmod +x validate-env.sh
./validate-env.sh
```

---

## Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` format
- Verify database server is running
- Check firewall rules
- Test connection: `mysql -h host -u user -p database`

### "JWT token invalid"
- Ensure `JWT_SECRET` is at least 32 characters
- Check token hasn't expired
- Verify secret matches between services

### "Stripe webhook signature mismatch"
- Check `STRIPE_WEBHOOK_SECRET` matches webhook endpoint
- Verify webhook URL is correct
- Check request is coming from Stripe IPs

### "S3 upload failed"
- Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- Check bucket exists and region matches
- Verify IAM permissions include `s3:PutObject`

### "CORS error"
- Add frontend URL to `SOCKET_IO_CORS_ORIGIN`
- Check protocol (http vs https)
- Verify no trailing slashes

---

## Example .env Files

### Backend (.env)

```bash
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DATABASE_URL=mysql://haulkind:SecurePass123@db.example.com:3306/haulkind
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
STRIPE_MODE=prod
STRIPE_LIVE_SECRET_KEY=sk_live_51234567890abcdefghijklmnopqrstuvwxyz
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnopqrstuvwxyz
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=haulkind-production
GOOGLE_MAPS_API_KEY=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SOCKET_IO_CORS_ORIGIN=https://haulkind.com,https://admin.haulkind.com
```

### Web (.env.local)

```bash
NEXT_PUBLIC_API_URL=https://api.haulkind.com
NEXT_PUBLIC_SOCKET_URL=https://api.haulkind.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51234567890abcdefghijklmnopqrstuvwxyz
```

### Mobile Apps (.env)

```bash
EXPO_PUBLIC_API_URL=https://api.haulkind.com
EXPO_PUBLIC_SOCKET_URL=https://api.haulkind.com
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51234567890abcdefghijklmnopqrstuvwxyz
```

---

## Checklist

Before deployment, verify:

- [ ] All required variables set
- [ ] No placeholder values (e.g., "your-key-here")
- [ ] Keys match environment (test vs live)
- [ ] Secrets are at least 32 characters
- [ ] URLs use correct protocol (http vs https)
- [ ] CORS origins include all frontend domains
- [ ] Database connection tested
- [ ] API keys validated with test requests
- [ ] `.env` files not committed to git
- [ ] Team has access to secret management system
