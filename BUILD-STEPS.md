# Haulkind Build Steps

## Table of Contents

1. [Backend Build](#backend-build)
2. [Web App Build](#web-app-build)
3. [Driver Mobile App Build](#driver-mobile-app-build)
4. [Customer Mobile App Build](#customer-mobile-app-build)
5. [Admin Dashboard Build](#admin-dashboard-build)
6. [CI/CD Pipeline](#cicd-pipeline)

---

## Backend Build

### Local Development

```bash
cd /home/ubuntu/haulkind

# Install dependencies
pnpm install

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

**Server runs on:** http://localhost:3000

### Production Build

```bash
# Install production dependencies only
pnpm install --frozen-lockfile --prod

# Run migrations
pnpm db:push

# Build (if using TypeScript compilation)
pnpm build

# Start production server
pnpm start
```

### Docker Build

```bash
# Build image
docker build -t haulkind-backend:1.0.0 .

# Tag for registry
docker tag haulkind-backend:1.0.0 your-registry/haulkind-backend:1.0.0

# Push to registry
docker push your-registry/haulkind-backend:1.0.0

# Run container
docker run -d \
  --name haulkind-backend \
  --env-file .env \
  -p 3000:3000 \
  --restart unless-stopped \
  haulkind-backend:1.0.0
```

### Health Check

```bash
curl http://localhost:3000/health
# Expected: {"status":"ok"}
```

---

## Web App Build

### Local Development

```bash
cd /home/ubuntu/haulkind/apps/web

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

**Server runs on:** http://localhost:3001

### Production Build

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### Static Export (if needed)

```bash
# Build static HTML
pnpm build

# Output in: .next/out/
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

**Custom Domain:** haulkind.com

### Environment Variables (Vercel)

Add in Vercel dashboard:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SOCKET_URL`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

---

## Driver Mobile App Build

### Prerequisites

1. **Expo Account:**
   - Sign up at https://expo.dev
   - Create organization: "Haulkind"

2. **Apple Developer Account:**
   - Enroll at https://developer.apple.com
   - Cost: $99/year

3. **Google Play Console:**
   - Sign up at https://play.google.com/console
   - One-time fee: $25

### Setup

```bash
cd /home/ubuntu/haulkind/apps/driver

# Install dependencies
pnpm install

# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure
```

### Local Development

```bash
# Start Expo dev server
pnpm start

# Run on iOS simulator
pnpm ios

# Run on Android emulator
pnpm android

# Run on physical device
# Scan QR code with Expo Go app
```

### iOS Build (App Store)

**1. Configure eas.json:**

```json
{
  "build": {
    "production": {
      "ios": {
        "bundleIdentifier": "com.haulkind.driver",
        "buildType": "app-store",
        "distribution": "store"
      }
    },
    "preview": {
      "ios": {
        "bundleIdentifier": "com.haulkind.driver",
        "buildType": "simulator"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDE12345"
      }
    }
  }
}
```

**2. Build:**

```bash
# Build for App Store
eas build --platform ios --profile production

# Build for simulator (testing)
eas build --platform ios --profile preview
```

**3. Submit to App Store:**

```bash
eas submit --platform ios --profile production
```

**4. App Store Connect:**
- Go to https://appstoreconnect.apple.com
- Select "Haulkind Driver"
- Fill in app information:
  - Name: Haulkind Driver
  - Subtitle: Earn 60% on Every Job
  - Description: [App description]
  - Keywords: junk removal, driver, gig economy
  - Category: Business
  - Screenshots: [Upload screenshots]
- Submit for review

### Android Build (Google Play)

**1. Configure eas.json:**

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle",
        "gradleCommand": ":app:bundleRelease"
      }
    },
    "preview": {
      "android": {
        "buildType": "apk"
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

**2. Create Service Account:**
- Go to Google Play Console
- Setup → API access
- Create service account
- Download JSON key
- Save as `google-service-account.json`

**3. Build:**

```bash
# Build for Google Play (AAB)
eas build --platform android --profile production

# Build APK for testing
eas build --platform android --profile preview
```

**4. Submit to Google Play:**

```bash
eas submit --platform android --profile production
```

**5. Google Play Console:**
- Go to https://play.google.com/console
- Select "Haulkind Driver"
- Fill in app information:
  - Title: Haulkind Driver
  - Short description: Earn 60% on every junk removal job
  - Full description: [App description]
  - Screenshots: [Upload screenshots]
  - Category: Business
  - Content rating: Complete questionnaire
- Create release → Production
- Submit for review

### Over-the-Air (OTA) Updates

**1. Configure:**

```bash
eas update:configure
```

**2. Publish update:**

```bash
# Publish to production channel
eas update --branch production --message "Bug fixes and improvements"

# Publish to staging channel
eas update --branch staging --message "Testing new features"
```

**3. Rollback:**

```bash
# List updates
eas update:list --branch production

# Rollback to previous version
eas update:rollback --branch production
```

### App Store Metadata

**Name:** Haulkind Driver

**Subtitle:** Earn 60% on Every Job

**Description:**
```
Join Haulkind and start earning 60% on every junk removal and labor job you complete.

FEATURES:
• Flexible Schedule - Work when you want, where you want
• High Earnings - Keep 60% of every job, plus tips
• Instant Payouts - Get paid within 24 hours
• Real-Time Offers - Accept jobs that fit your schedule
• Navigation - Built-in GPS to customer locations
• Support - 24/7 customer support

HOW IT WORKS:
1. Go online when you're ready to work
2. Receive job offers in your area
3. Accept offers that fit your schedule
4. Complete the job and upload photos
5. Get paid 60% of the job price

REQUIREMENTS:
• Valid driver's license
• Reliable vehicle (truck or van preferred)
• Smartphone with GPS
• Ability to lift heavy items

Download now and start earning today!
```

**Keywords:** junk removal, driver, gig economy, earn money, flexible work, side hustle

**Category:** Business

**Age Rating:** 4+ (no objectionable content)

---

## Customer Mobile App Build

Same process as Driver App, but with different bundle identifier and app name.

### Configuration

**Bundle ID:** `com.haulkind.customer`

**App Name:** Haulkind

**Subtitle:** Fast Local Junk Removal

**Description:**
```
Get instant quotes for junk removal and labor help. Professional drivers ready to assist across PA, NY, and NJ.

FEATURES:
• Transparent Pricing - See costs upfront, no surprises
• Real-Time Tracking - Track your driver's location live
• Flexible Scheduling - Book for today or schedule ahead
• Two Services - Junk removal or labor-only help
• Secure Payment - Pay safely through the app
• Rated Drivers - All drivers are background-checked

HOW IT WORKS:
1. Enter your location and select service
2. Get an instant quote
3. Schedule pickup time
4. Track your driver in real-time
5. Job completed, rate your driver

SERVICES:
• Junk Removal (Haul Away) - We haul it away and dispose of it
• Labor Only - Help moving items or loading/unloading trucks

Download now and get your junk removed today!
```

---

## Admin Dashboard Build

### Local Development

```bash
cd /home/ubuntu/haulkind/apps/admin

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

**Server runs on:** http://localhost:3002

### Production Build

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### Vercel Deployment

```bash
# Deploy to production
vercel --prod
```

**Custom Domain:** admin.haulkind.com

### Environment Variables

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

---

## CI/CD Pipeline

### GitHub Actions

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
      - run: pnpm build
      - name: Deploy to production
        run: |
          # Deploy script here
          
  web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 22
          cache: 'pnpm'
      - run: cd apps/web && pnpm install
      - run: cd apps/web && pnpm build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          
  mobile:
    runs-on: ubuntu-latest
    if: contains(github.event.head_commit.message, '[mobile]')
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 22
      - name: Setup Expo
        uses: expo/expo-github-action@v7
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: cd apps/driver && pnpm install
      - run: cd apps/driver && eas build --platform all --non-interactive
```

### Automated Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run linting
pnpm lint

# Type check
pnpm tsc --noEmit
```

---

## Build Checklist

### Before Building

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Environment variables set
- [ ] Version number updated
- [ ] Changelog updated
- [ ] Git tagged with version

### Backend

- [ ] Dependencies installed
- [ ] Database migrations run
- [ ] Build successful
- [ ] Health check passing

### Web App

- [ ] Dependencies installed
- [ ] Build successful
- [ ] No console errors
- [ ] Mobile responsive
- [ ] All routes accessible

### Mobile Apps

- [ ] Bundle identifier correct
- [ ] Version number updated
- [ ] App icons added
- [ ] Splash screen configured
- [ ] Permissions configured
- [ ] Build successful
- [ ] Tested on physical device

### Admin Dashboard

- [ ] Dependencies installed
- [ ] Build successful
- [ ] Authentication working
- [ ] All pages accessible

---

## Troubleshooting

### "pnpm install failed"
- Delete `node_modules` and `pnpm-lock.yaml`
- Run `pnpm install` again
- Check Node.js version (requires 22+)

### "Build failed: TypeScript errors"
- Run `pnpm tsc --noEmit` to see errors
- Fix type errors
- Rebuild

### "EAS build failed"
- Check `eas.json` configuration
- Verify bundle identifier is unique
- Check Expo account has sufficient credits
- Review build logs: `eas build:list`

### "App rejected from App Store"
- Review rejection reason in App Store Connect
- Common issues:
  - Missing privacy policy
  - Incomplete app information
  - Crashes on launch
  - Missing required features
- Fix issues and resubmit

### "OTA update not working"
- Check update channel matches app build
- Verify app has updates enabled
- Check network connectivity
- Force close and reopen app

---

## Version Numbering

Use Semantic Versioning: `MAJOR.MINOR.PATCH`

- **MAJOR:** Breaking changes
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes

**Example:**
- `1.0.0` - Initial release
- `1.1.0` - Added labor-only service
- `1.1.1` - Fixed payment bug
- `2.0.0` - New pricing model (breaking change)

---

## Release Checklist

- [ ] Version number updated in:
  - `package.json`
  - `app.json` (mobile apps)
  - `CHANGELOG.md`
- [ ] Git tagged: `git tag v1.0.0`
- [ ] Changelog updated with changes
- [ ] All tests passing
- [ ] Deployed to staging and tested
- [ ] Approved by QA team
- [ ] Deployed to production
- [ ] Monitoring active
- [ ] Team notified
- [ ] Documentation updated

---

## Support

For build issues, contact:
- **DevOps:** devops@haulkind.com
- **Mobile Team:** mobile@haulkind.com
- **Frontend Team:** frontend@haulkind.com
