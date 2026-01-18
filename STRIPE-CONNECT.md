# Stripe Connect Integration

## Overview

Haulkind uses Stripe Connect to handle payments and payouts with three modes:
- **ledger** (default) - Internal ledger, no Stripe
- **sandbox** - Stripe test mode for development
- **prod** - Stripe live mode for production

## Configuration

### Environment Variables

```bash
# Stripe Mode (ledger | sandbox | prod)
STRIPE_MODE=ledger

# Stripe API Keys (only needed if STRIPE_MODE != ledger)
STRIPE_TEST_SECRET_KEY=sk_test_...
STRIPE_LIVE_SECRET_KEY=sk_live_...
```

### Mode Selection

The system automatically falls back to ledger mode if:
- `STRIPE_MODE=ledger` (explicit)
- `STRIPE_MODE` is not set (default)
- API keys are missing for sandbox/prod mode

## Database Schema Changes

### Drivers Table

Added Stripe Connect fields:

```typescript
stripeAccountId: varchar(255)              // Stripe Connect account ID
stripeOnboardingComplete: boolean          // Onboarding finished
stripeChargesEnabled: boolean              // Can receive charges
stripePayoutsEnabled: boolean              // Can receive payouts
```

### Payments Table

Existing field used for Stripe:

```typescript
providerRef: varchar(255)                  // Stores payment_intent_id
```

### Payouts Table

Added Stripe transfer tracking:

```typescript
stripeTransferId: varchar(255)             // Stripe transfer ID
```

## Payment Flow

### 1. Customer Payment (Sandbox/Prod Mode)

```typescript
import { createPaymentIntent } from './server/stripe'

// Create PaymentIntent
const paymentIntent = await createPaymentIntent(
  totalPrice * 100,  // amount in cents
  customerId,
  jobId,
  { service_type: 'HAUL_AWAY' }
)

// Store in database
await db.insert(payments).values({
  id: generateId(),
  jobId,
  customerId,
  amount: totalPrice,
  currency: 'USD',
  provider: 'stripe',
  providerRef: paymentIntent.id,  // payment_intent_id
  status: 'pending',
})

// Return client_secret to frontend
return {
  clientSecret: paymentIntent.client_secret,
  paymentIntentId: paymentIntent.id,
}
```

### 2. Frontend Payment Confirmation

```typescript
// Customer app uses Stripe SDK
import { useStripe, useElements } from '@stripe/stripe-react-native'

const { confirmPayment } = useStripe()

const result = await confirmPayment(clientSecret, {
  paymentMethodType: 'Card',
})

if (result.error) {
  // Handle error
} else {
  // Payment succeeded
  // Backend webhook will update payment status
}
```

### 3. Payment Webhook (Sandbox/Prod Mode)

```typescript
// POST /webhooks/stripe
// Handles payment_intent.succeeded event

const event = stripe.webhooks.constructEvent(
  req.body,
  req.headers['stripe-signature'],
  webhookSecret
)

if (event.type === 'payment_intent.succeeded') {
  const paymentIntent = event.data.object
  
  // Update payment status
  await db.update(payments)
    .set({ status: 'succeeded' })
    .where(eq(payments.providerRef, paymentIntent.id))
  
  // Update job status
  await db.update(jobs)
    .set({ status: 'ASSIGNED' })
    .where(eq(jobs.id, paymentIntent.metadata.job_id))
}
```

### 4. Ledger Mode Fallback

```typescript
// In ledger mode, payment is instant
await db.insert(payments).values({
  id: generateId(),
  jobId,
  customerId,
  amount: totalPrice,
  currency: 'USD',
  provider: 'ledger',
  providerRef: null,
  status: 'succeeded',  // Instant success
})

await db.update(jobs)
  .set({ status: 'ASSIGNED' })
  .where(eq(jobs.id, jobId))
```

## Driver Onboarding Flow

### 1. Create Connect Account

```typescript
import { createConnectAccount, mockConnectAccount } from './server/stripe'

// Sandbox/Prod mode
const account = await createConnectAccount(
  driverId,
  driverEmail,
  { driver_name: driverName }
)

// Or ledger mode (mock)
const { accountId } = await mockConnectAccount(driverId, driverEmail)

// Store in database
await db.update(drivers)
  .set({
    stripeAccountId: account.id,
    stripeOnboardingComplete: false,
    stripeChargesEnabled: false,
    stripePayoutsEnabled: false,
  })
  .where(eq(drivers.id, driverId))
```

### 2. Generate Onboarding Link

```typescript
import { createAccountLink } from './server/stripe'

const accountLink = await createAccountLink(
  stripeAccountId,
  'https://driver.haulkind.com/onboarding/refresh',
  'https://driver.haulkind.com/onboarding/complete'
)

// Return URL to driver app
return {
  onboardingUrl: accountLink.url,
}
```

### 3. Check Onboarding Status

```typescript
import { getConnectAccount, isPayoutEligible } from './server/stripe'

const account = await getConnectAccount(stripeAccountId)

const eligible = isPayoutEligible(account)
// Returns true if:
// - charges_enabled: true
// - payouts_enabled: true
// - details_submitted: true

// Update database
await db.update(drivers)
  .set({
    stripeOnboardingComplete: account.details_submitted,
    stripeChargesEnabled: account.charges_enabled,
    stripePayoutsEnabled: account.payouts_enabled,
  })
  .where(eq(drivers.id, driverId))
```

### 4. Onboarding Webhook

```typescript
// POST /webhooks/stripe
// Handles account.updated event

if (event.type === 'account.updated') {
  const account = event.data.object
  
  // Find driver by stripeAccountId
  const driver = await db.query.drivers.findFirst({
    where: eq(drivers.stripeAccountId, account.id),
  })
  
  if (driver) {
    await db.update(drivers)
      .set({
        stripeOnboardingComplete: account.details_submitted,
        stripeChargesEnabled: account.charges_enabled,
        stripePayoutsEnabled: account.payouts_enabled,
      })
      .where(eq(drivers.id, driver.id))
  }
}
```

## Payout Flow

### 1. Payout Eligibility

Payouts are created when:
- Job status is `COMPLETED`
- Driver has uploaded AFTER photos
- For HAUL_AWAY: receipt uploaded (if disposal above cap)

```typescript
// Check eligibility
const job = await getJob(jobId)
const photos = await getJobPhotos(jobId)

const hasAfterPhotos = photos.some(p => p.photoType === 'after')
const hasReceipt = photos.some(p => p.photoType === 'receipt')

const eligible = 
  job.status === 'COMPLETED' &&
  hasAfterPhotos &&
  (job.serviceType === 'LABOR_ONLY' || hasReceipt)
```

### 2. Calculate Payout

```typescript
import { calculateDriverPayout } from './server/stripe'

// Driver gets 60% of service price
const servicePrice = 15000  // $150.00 in cents
const driverShare = Math.round(servicePrice * 0.6)  // $90.00

// Plus disposal reimbursement (if above cap)
const disposalCap = 5000  // $50.00
const actualDisposal = 7500  // $75.00
const reimbursement = Math.max(0, actualDisposal - disposalCap)  // $25.00

const totalPayout = calculateDriverPayout(servicePrice, reimbursement)
// Returns: $115.00 (90 + 25)
```

### 3. Create Transfer (Sandbox/Prod Mode)

```typescript
import { createTransfer, mockTransfer } from './server/stripe'

const driver = await getDriver(driverId)

if (!driver.stripePayoutsEnabled) {
  throw new Error('Driver not eligible for payouts')
}

// Sandbox/Prod mode
const transfer = await createTransfer(
  totalPayout * 100,  // in cents
  driver.stripeAccountId,
  jobId,
  `Payout for job ${jobId}`,
  { driver_id: driverId.toString() }
)

// Or ledger mode (mock)
const { transferId } = await mockTransfer(
  totalPayout * 100,
  driver.stripeAccountId,
  jobId,
  `Payout for job ${jobId}`
)

// Store in database
await db.insert(payouts).values({
  id: generateId(),
  jobId,
  driverId,
  driverPayout: driverShare / 100,
  disposalReimbursement: reimbursement / 100,
  totalAmount: totalPayout,
  stripeTransferId: transfer.id,
  status: 'completed',
  completedAt: new Date(),
})
```

### 4. Ledger Mode Payout

```typescript
// In ledger mode, payout is instant
await db.insert(payouts).values({
  id: generateId(),
  jobId,
  driverId,
  driverPayout: driverShare / 100,
  disposalReimbursement: reimbursement / 100,
  totalAmount: totalPayout,
  stripeTransferId: null,
  status: 'completed',
  completedAt: new Date(),
})
```

## API Endpoints

### Customer Endpoints

```typescript
// Create payment intent
POST /jobs/:id/payment-intent
Response: {
  clientSecret: string
  paymentIntentId: string
  amount: number
}

// Confirm payment (webhook handles this)
POST /webhooks/stripe
```

### Driver Endpoints

```typescript
// Create Connect account
POST /driver/connect/create
Response: {
  accountId: string
  onboardingUrl: string
}

// Get onboarding link
GET /driver/connect/onboarding-link
Response: {
  url: string
}

// Check onboarding status
GET /driver/connect/status
Response: {
  onboardingComplete: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
}

// Refresh onboarding (if incomplete)
POST /driver/connect/refresh
Response: {
  url: string
}
```

### Admin Endpoints

```typescript
// Manually trigger payout
POST /admin/payouts/create
Body: {
  jobId: string
}
Response: {
  payoutId: string
  amount: number
  transferId: string
}

// List payouts
GET /admin/payouts
Response: {
  payouts: Array<{
    id: string
    jobId: string
    driverId: number
    totalAmount: number
    status: string
    stripeTransferId: string
    createdAt: string
  }>
}
```

## Testing

### Sandbox Mode Testing

```bash
# Set environment
export STRIPE_MODE=sandbox
export STRIPE_TEST_SECRET_KEY=sk_test_...

# Start backend
pnpm dev
```

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Insufficient funds: `4000 0000 0000 9995`

**Test Connect Accounts:**
- Use Stripe Dashboard to create test Express accounts
- Or use API to create accounts programmatically

### Ledger Mode Testing

```bash
# Default mode (no Stripe keys needed)
export STRIPE_MODE=ledger

# Start backend
pnpm dev
```

All payments and payouts are instant and mocked.

### Webhook Testing

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger account.updated
```

## Error Handling

### Payment Failures

```typescript
try {
  const paymentIntent = await createPaymentIntent(...)
} catch (error) {
  if (error.type === 'StripeCardError') {
    // Card declined
    return { error: 'Payment declined' }
  } else if (error.type === 'StripeInvalidRequestError') {
    // Invalid parameters
    return { error: 'Invalid payment request' }
  } else {
    // Other errors
    return { error: 'Payment failed' }
  }
}
```

### Transfer Failures

```typescript
try {
  const transfer = await createTransfer(...)
} catch (error) {
  // Mark payout as failed
  await db.update(payouts)
    .set({ status: 'failed' })
    .where(eq(payouts.id, payoutId))
  
  // Notify admin
  await notifyOwner({
    title: 'Payout Failed',
    content: `Transfer to driver ${driverId} failed: ${error.message}`,
  })
}
```

### Onboarding Failures

```typescript
// If onboarding link expired
const accountLink = await createAccountLink(...)
// New link generated, send to driver

// If account restricted
const account = await getConnectAccount(...)
if (account.requirements.disabled_reason) {
  // Account restricted, notify driver
  // Reasons: rejected, listed, under_review, etc.
}
```

## Security

### Webhook Verification

```typescript
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

try {
  const event = stripe.webhooks.constructEvent(
    req.body,
    req.headers['stripe-signature'],
    webhookSecret
  )
  // Process event
} catch (error) {
  // Invalid signature
  return res.status(400).send('Webhook signature verification failed')
}
```

### API Key Protection

- Never expose secret keys in frontend code
- Use environment variables for all keys
- Rotate keys regularly
- Use restricted keys when possible

### Connect Account Security

- Verify driver identity before creating account
- Check onboarding status before payouts
- Monitor for suspicious activity
- Use Stripe Radar for fraud detection

## Monitoring

### Key Metrics

- Payment success rate
- Average payment time
- Payout success rate
- Onboarding completion rate
- Failed transfers count

### Stripe Dashboard

- View all transactions
- Monitor Connect accounts
- Check webhook delivery
- Review disputes and chargebacks

### Audit Logs

All Stripe operations are logged in audit_logs table:

```typescript
await db.insert(auditLogs).values({
  entityType: 'payment',
  entityId: paymentId,
  action: 'stripe_payment_succeeded',
  userId: customerId,
  changes: {
    payment_intent_id: paymentIntent.id,
    amount: paymentIntent.amount,
  },
})
```

## Migration from Ledger to Stripe

### Phase 1: Sandbox Testing

1. Set `STRIPE_MODE=sandbox`
2. Test payment flow end-to-end
3. Test driver onboarding
4. Test payout flow
5. Verify webhook handling

### Phase 2: Gradual Rollout

1. Set `STRIPE_MODE=prod` for new users
2. Keep existing users on ledger
3. Monitor success rates
4. Migrate users gradually

### Phase 3: Full Migration

1. All new payments via Stripe
2. Migrate existing balances
3. Disable ledger mode
4. Archive ledger data

## Troubleshooting

### Payment not completing

- Check Stripe Dashboard for payment status
- Verify webhook is receiving events
- Check payment_intent_id in database
- Review error logs

### Driver not receiving payout

- Verify onboarding is complete
- Check `stripePayoutsEnabled` flag
- Verify transfer was created
- Check Stripe Dashboard for transfer status

### Onboarding link not working

- Links expire after 5 minutes
- Generate new link via API
- Check account status in Stripe Dashboard
- Verify email is correct

## Support

### Stripe Support

- Dashboard: https://dashboard.stripe.com
- Docs: https://stripe.com/docs
- Support: https://support.stripe.com

### Internal Support

- Check audit logs for operation history
- Review Stripe Dashboard for transaction details
- Contact Stripe support for account issues
- Use Stripe CLI for debugging webhooks
