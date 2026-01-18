import Stripe from 'stripe'

// Stripe mode configuration
export type StripeMode = 'ledger' | 'sandbox' | 'prod'

export const STRIPE_MODE: StripeMode = (process.env.STRIPE_MODE as StripeMode) || 'ledger'

// Initialize Stripe client (only if not in ledger mode)
let stripeClient: Stripe | null = null

if (STRIPE_MODE !== 'ledger') {
  const apiKey = STRIPE_MODE === 'sandbox' 
    ? process.env.STRIPE_TEST_SECRET_KEY 
    : process.env.STRIPE_LIVE_SECRET_KEY

  if (!apiKey) {
    console.warn(`STRIPE_MODE is ${STRIPE_MODE} but no API key found. Falling back to ledger mode.`)
  } else {
    stripeClient = new Stripe(apiKey, {
      apiVersion: '2023-10-16',
    })
    console.log(`Stripe initialized in ${STRIPE_MODE} mode`)
  }
}

export const stripe = stripeClient

// Helper to check if Stripe is available
export function isStripeEnabled(): boolean {
  return STRIPE_MODE !== 'ledger' && stripe !== null
}

// Get Stripe mode for logging/debugging
export function getStripeMode(): StripeMode {
  return STRIPE_MODE
}

// Customer payment via Stripe PaymentIntent
export async function createPaymentIntent(
  amount: number, // in cents
  customerId: number,
  jobId: number,
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent | null> {
  if (!isStripeEnabled() || !stripe) {
    console.log('Stripe not enabled, using ledger mode')
    return null
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        customer_id: customerId.toString(),
        job_id: jobId.toString(),
        ...metadata,
      },
    })

    return paymentIntent
  } catch (error) {
    console.error('Failed to create PaymentIntent:', error)
    throw error
  }
}

// Confirm payment was successful
export async function getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent | null> {
  if (!isStripeEnabled() || !stripe) {
    return null
  }

  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId)
  } catch (error) {
    console.error('Failed to retrieve PaymentIntent:', error)
    throw error
  }
}

// Driver Connect Express account creation
export async function createConnectAccount(
  driverId: number,
  email: string,
  metadata?: Record<string, string>
): Promise<Stripe.Account | null> {
  if (!isStripeEnabled() || !stripe) {
    console.log('Stripe not enabled, skipping Connect account creation')
    return null
  }

  try {
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      capabilities: {
        transfers: { requested: true },
      },
      metadata: {
        driver_id: driverId.toString(),
        ...metadata,
      },
    })

    return account
  } catch (error) {
    console.error('Failed to create Connect account:', error)
    throw error
  }
}

// Generate onboarding link for driver
export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<Stripe.AccountLink | null> {
  if (!isStripeEnabled() || !stripe) {
    return null
  }

  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    })

    return accountLink
  } catch (error) {
    console.error('Failed to create account link:', error)
    throw error
  }
}

// Check Connect account onboarding status
export async function getConnectAccount(accountId: string): Promise<Stripe.Account | null> {
  if (!isStripeEnabled() || !stripe) {
    return null
  }

  try {
    return await stripe.accounts.retrieve(accountId)
  } catch (error) {
    console.error('Failed to retrieve Connect account:', error)
    throw error
  }
}

// Check if driver can receive payouts
export function isPayoutEligible(account: Stripe.Account): boolean {
  return (
    account.charges_enabled === true &&
    account.payouts_enabled === true &&
    account.details_submitted === true
  )
}

// Create transfer to driver Connect account
export async function createTransfer(
  amount: number, // in cents
  destinationAccountId: string,
  jobId: number,
  description: string,
  metadata?: Record<string, string>
): Promise<Stripe.Transfer | null> {
  if (!isStripeEnabled() || !stripe) {
    console.log('Stripe not enabled, skipping transfer')
    return null
  }

  try {
    const transfer = await stripe.transfers.create({
      amount,
      currency: 'usd',
      destination: destinationAccountId,
      description,
      metadata: {
        job_id: jobId.toString(),
        ...metadata,
      },
    })

    return transfer
  } catch (error) {
    console.error('Failed to create transfer:', error)
    throw error
  }
}

// Calculate driver payout
export function calculateDriverPayout(
  servicePrice: number, // in cents
  disposalReimbursement: number = 0 // in cents
): number {
  // Driver gets 60% of service price + full disposal reimbursement
  const driverShare = Math.round(servicePrice * 0.6)
  return driverShare + disposalReimbursement
}

// Mock payment for testing when Stripe keys not available
export async function mockPayment(
  amount: number,
  customerId: number,
  jobId: number
): Promise<{ success: boolean; paymentIntentId: string }> {
  console.log(`[MOCK] Payment of $${(amount / 100).toFixed(2)} for job ${jobId}`)
  return {
    success: true,
    paymentIntentId: `pi_mock_${Date.now()}_${jobId}`,
  }
}

// Mock Connect account creation
export async function mockConnectAccount(
  driverId: number,
  email: string
): Promise<{ accountId: string; onboardingUrl: string }> {
  console.log(`[MOCK] Created Connect account for driver ${driverId} (${email})`)
  return {
    accountId: `acct_mock_${Date.now()}_${driverId}`,
    onboardingUrl: `https://connect.stripe.com/mock/onboarding/${driverId}`,
  }
}

// Mock transfer
export async function mockTransfer(
  amount: number,
  destinationAccountId: string,
  jobId: number,
  description: string
): Promise<{ transferId: string }> {
  console.log(`[MOCK] Transfer of $${(amount / 100).toFixed(2)} to ${destinationAccountId} for job ${jobId}`)
  return {
    transferId: `tr_mock_${Date.now()}_${jobId}`,
  }
}
