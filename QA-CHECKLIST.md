# Haulkind Platform QA Checklist

## Test Environment

- Backend: http://localhost:3000
- Web: http://localhost:3001
- Admin: http://localhost:3002
- Driver App: Expo (mobile)
- Customer App: Expo (mobile)

## Core Flow 1: Customer Journey (Haul Away)

### 1.1 Create Job
- [ ] Customer can access quote flow
- [ ] Service selection shows both options
- [ ] Location input validates service area
- [ ] Time picker shows available slots
- [ ] Volume tier selection displays pricing
- [ ] Add-ons are optional and priced correctly
- [ ] Photo upload works (optional)
- [ ] Quote calculation is accurate

**Expected:**
- Quote shows: base price + add-ons + distance fee + disposal cap
- Total price matches backend calculation

### 1.2 Payment
- [ ] Payment screen shows correct total
- [ ] Ledger mode: instant payment
- [ ] Stripe sandbox: PaymentIntent created
- [ ] Payment success updates job status to ASSIGNED
- [ ] Payment failure shows error message

**Expected:**
- Job status: DRAFT → ASSIGNED after payment
- Payment record created in database

### 1.3 Dispatch
- [ ] Job enters dispatch queue after payment
- [ ] System finds eligible drivers
- [ ] Offer waves sent to drivers (nearest first)
- [ ] Driver receives offer notification
- [ ] Offer expires after timeout
- [ ] Next wave sent if no acceptance

**Expected:**
- Offer sent to drivers within service area
- Offer includes: job details, payout estimate, ETA

### 1.4 Tracking
- [ ] Customer sees "Matching driver..." status
- [ ] Customer notified when driver accepts
- [ ] Real-time location updates (Socket.io or polling)
- [ ] ETA updates as driver moves
- [ ] Status timeline shows progress
- [ ] Driver contact info visible

**Expected:**
- Status updates: ASSIGNED → EN_ROUTE → ARRIVED → STARTED → COMPLETED
- Map shows driver location in real-time

### 1.5 Completion
- [ ] Driver marks job as COMPLETED
- [ ] Customer sees completion notification
- [ ] Receipt screen shows breakdown
- [ ] Rating prompt appears
- [ ] Customer can rate driver (1-5 stars)
- [ ] Customer can add review text

**Expected:**
- Final receipt shows: service price, add-ons, distance, disposal, total
- Rating updates driver's average rating

---

## Core Flow 2: Customer Journey (Labor Only)

### 2.1 Create Job
- [ ] Labor Only flow starts correctly
- [ ] Hours selection (minimum 2 hours)
- [ ] Helper count selection (1 or 2)
- [ ] Hourly rate displayed correctly
- [ ] Details/photos optional
- [ ] Quote calculation accurate

**Expected:**
- Quote shows: hourly rate × hours × helpers
- No disposal language

### 2.2 Payment & Dispatch
- [ ] Same as Haul Away flow
- [ ] Job type correctly set to LABOR_ONLY

### 2.3 Time Extension
- [ ] Driver can request extension (1 hour)
- [ ] Customer receives extension request
- [ ] Customer can approve/decline
- [ ] Approval adds 1 hour to job
- [ ] Additional charge calculated correctly
- [ ] Customer charged for extension

**Expected:**
- Extension request shows: current hours, additional hour, extra cost
- Approval updates job duration and charges customer

### 2.4 Completion
- [ ] Same as Haul Away
- [ ] No disposal receipt required
- [ ] Final receipt shows total hours worked

---

## Core Flow 3: Driver Journey

### 3.1 Onboarding
- [ ] Driver can sign up
- [ ] Profile form validates input
- [ ] Vehicle info optional but stored
- [ ] Service toggles work (can_haul_away, can_labor_only)
- [ ] Document upload works (license, insurance, registration)
- [ ] Stripe Connect account created (if STRIPE_MODE != ledger)
- [ ] Onboarding link generated
- [ ] Status shows "pending approval"

**Expected:**
- Driver status: pending
- Documents stored in S3
- Stripe account created (sandbox/prod mode)

### 3.2 Approval
- [ ] Admin can view pending drivers
- [ ] Admin can view uploaded documents
- [ ] Admin can approve driver
- [ ] Approval updates status to "approved"
- [ ] Driver notified of approval

**Expected:**
- Driver status: pending → approved
- Driver can now go online

### 3.3 Go Online
- [ ] Driver can toggle online/offline
- [ ] Online status persists
- [ ] Driver location tracked when online
- [ ] Driver appears in dispatch pool

**Expected:**
- isOnline: false → true
- Driver location updated every 30s (throttled)

### 3.4 Receive Offer
- [ ] Offer notification appears
- [ ] Offer card shows: job type, payout, distance, ETA, photos
- [ ] Accept/decline buttons work
- [ ] Timer counts down
- [ ] Auto-decline on timeout

**Expected:**
- Offer expires after 60 seconds
- Driver stats updated (totalOffers++)

### 3.5 Accept Job
- [ ] Accept updates job status
- [ ] Driver assigned to job
- [ ] Navigation button works
- [ ] Job details visible
- [ ] Customer contact info visible

**Expected:**
- Job status: ASSIGNED → EN_ROUTE
- Driver stats: totalAccepted++

### 3.6 Job Execution
- [ ] Driver can update status: EN_ROUTE → ARRIVED → STARTED
- [ ] Location streaming works during active job
- [ ] Customer sees real-time updates
- [ ] BEFORE photos required before starting
- [ ] AFTER photos required before completing
- [ ] Receipt upload works (haul-away only)

**Expected:**
- Status updates trigger customer notifications
- Photos stored in S3
- Job cannot be completed without required photos

### 3.7 Completion & Payout
- [ ] Driver marks job as COMPLETED
- [ ] Payout eligibility checked
- [ ] Payout calculated: 60% + disposal reimbursement
- [ ] Transfer created (Stripe sandbox/prod)
- [ ] Payout record created
- [ ] Driver notified of payout

**Expected:**
- Payout: 60% of service_price + (disposal - cap)
- Driver stats: totalCompleted++
- Stripe transfer created (if enabled)

---

## Core Flow 4: Admin Operations

### 4.1 Driver Management
- [ ] Admin can list all drivers
- [ ] Filter by status (pending, approved, blocked)
- [ ] View driver details
- [ ] View uploaded documents
- [ ] Approve pending drivers
- [ ] Block/unblock drivers
- [ ] View driver stats

**Expected:**
- Driver list shows: name, status, services, stats
- Actions work: approve, block, unblock

### 4.2 Live Map
- [ ] Map shows active drivers
- [ ] Map shows active jobs
- [ ] Filter by service area
- [ ] Driver markers show last seen time
- [ ] Job markers show status color
- [ ] Click marker shows details

**Expected:**
- Real-time updates every 10s
- Markers clustered for performance

### 4.3 Job Queue
- [ ] List all jobs
- [ ] Filter by status
- [ ] Filter by job type
- [ ] Filter by service area
- [ ] Filter by date range
- [ ] View job details
- [ ] View offer waves history

**Expected:**
- Job list shows: ID, type, status, customer, driver, price, time
- Filters work correctly

### 4.4 Dispatch Console
- [ ] List unassigned jobs
- [ ] View eligible drivers for job
- [ ] Drivers ranked by: distance, ETA, stats
- [ ] Force assign job to driver
- [ ] View offer waves sent
- [ ] Resend offer manually

**Expected:**
- Eligible drivers show: name, distance, ETA, completion rate, rating
- Force assign works immediately

### 4.5 Pricing Console
- [ ] List volume pricing tiers
- [ ] Edit base price per tier
- [ ] Edit disposal cap per tier
- [ ] List add-ons
- [ ] Edit add-on price
- [ ] Enable/disable add-ons
- [ ] List labor rates
- [ ] Edit hourly rate by helper count
- [ ] Edit minimum hours
- [ ] Changes apply per service area

**Expected:**
- Pricing updates saved to database
- New quotes use updated pricing

### 4.6 Audit Logs
- [ ] List all system actions
- [ ] Filter by entity type
- [ ] Filter by action
- [ ] Filter by user
- [ ] Filter by date range
- [ ] View change details

**Expected:**
- Logs show: timestamp, user, action, entity, changes
- All critical operations logged

---

## Edge Case 1: No Coverage

### Scenario
Customer enters address outside service area

**Tests:**
- [ ] Service area lookup returns null
- [ ] Error message shown: "Service not available in your area"
- [ ] Admin alert created
- [ ] Admin notified via notification system
- [ ] Customer can enter email for waitlist

**Expected:**
- Job not created
- Admin sees alert in dashboard
- Waitlist entry stored

---

## Edge Case 2: Cancel After Accept

### Scenario
Customer cancels job after driver accepts

**Tests:**
- [ ] Customer can cancel from tracking screen
- [ ] Cancellation fee calculated
- [ ] Fee charged to customer (if within X minutes of scheduled time)
- [ ] Driver compensated for cancellation
- [ ] Job status updated to CANCELLED
- [ ] Driver can go back online
- [ ] Driver stats updated (totalCancelled++)

**Expected:**
- Cancellation fee: $25 (if < 1 hour before scheduled time)
- Driver receives: $15 (60% of cancellation fee)
- Customer charged: $25

---

## Edge Case 3: Volume Upgrade Approval

### Scenario
Driver arrives and actual volume is larger than quoted

**Tests:**
- [ ] Driver can request volume upgrade
- [ ] Customer receives upgrade request
- [ ] Request shows: original tier, new tier, price difference
- [ ] Customer can approve/decline
- [ ] Approval charges additional amount
- [ ] Decline allows customer to reduce items
- [ ] Job cannot proceed without resolution

**Expected:**
- Upgrade request: "Customer quoted 1/4 truck, actual is 1/2 truck. Additional $60."
- Approval charges customer $60
- Decline pauses job until resolved

---

## Edge Case 4: Disposal Reimbursement Above Cap

### Scenario
Disposal cost exceeds included cap

**Tests:**
- [ ] Driver uploads disposal receipt
- [ ] Receipt amount parsed (or manually entered)
- [ ] System calculates reimbursement: actual - cap
- [ ] Reimbursement added to driver payout
- [ ] Receipt stored in S3
- [ ] Customer sees disposal breakdown in receipt

**Expected:**
- Disposal cap: $50
- Actual disposal: $75
- Reimbursement: $25
- Driver payout: 60% service_price + $25

---

## Edge Case 5: Labor Extension Approval

### Scenario
Labor job takes longer than estimated

**Tests:**
- [ ] Driver can request 1-hour extension
- [ ] Request sent to customer
- [ ] Customer sees: current hours, additional hour, extra cost
- [ ] Customer can approve/decline
- [ ] Approval charges customer
- [ ] Approval extends job duration
- [ ] Decline ends job at current time
- [ ] Multiple extensions possible

**Expected:**
- Original: 2 hours @ $120/hour = $240
- Extension: +1 hour = +$120
- Total: 3 hours = $360
- Customer charged additional $120

---

## Critical Bugs to Check

### Database
- [ ] No duplicate exports in db.ts (getAllDrivers issue)
- [ ] All foreign keys valid
- [ ] Indexes on frequently queried columns
- [ ] Timestamps default to NOW()

### API
- [ ] All endpoints return proper status codes
- [ ] Error messages are user-friendly
- [ ] Authentication works on protected routes
- [ ] CORS configured correctly

### Real-time
- [ ] Socket.io connects successfully
- [ ] Events emitted to correct rooms
- [ ] Reconnection works after disconnect
- [ ] Polling fallback works if Socket.io fails

### Payment
- [ ] Ledger mode works without Stripe keys
- [ ] Stripe sandbox mode works with test keys
- [ ] Payment amounts in cents (no decimal errors)
- [ ] Refunds work correctly

### Payout
- [ ] 60/40 split calculated correctly
- [ ] Disposal reimbursement added properly
- [ ] Payout eligibility checked before transfer
- [ ] Failed transfers logged and retried

### Photos
- [ ] Upload to S3 works
- [ ] File size validation (max 10MB)
- [ ] MIME type validation (images only)
- [ ] Photos required before status changes

### Location
- [ ] GPS coordinates valid
- [ ] Distance calculation accurate (Haversine)
- [ ] Service area polygon check works
- [ ] Location streaming throttled (30s)

---

## Performance Tests

- [ ] Quote calculation < 100ms
- [ ] Dispatch finds drivers < 500ms
- [ ] Map loads < 2s with 100+ markers
- [ ] Job list pagination works (50 per page)
- [ ] Database queries use indexes
- [ ] No N+1 query problems

---

## Security Tests

- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (input sanitization)
- [ ] CSRF tokens on forms
- [ ] JWT tokens expire correctly
- [ ] Password hashing works (bcrypt)
- [ ] S3 files have proper ACLs
- [ ] Admin routes require admin role
- [ ] Driver routes require driver role

---

## Browser/Device Compatibility

### Web (apps/web)
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Mobile Apps
- [ ] iOS 14+ (Expo Go)
- [ ] Android 10+ (Expo Go)
- [ ] Push notifications work
- [ ] Background location works

---

## QA Summary Template

```
## QA Test Results

**Date:** [DATE]
**Tester:** [NAME]
**Environment:** [local/staging/prod]

### Core Flows
- Customer (Haul Away): [PASS/FAIL]
- Customer (Labor Only): [PASS/FAIL]
- Driver Journey: [PASS/FAIL]
- Admin Operations: [PASS/FAIL]

### Edge Cases
- No Coverage Alert: [PASS/FAIL]
- Cancel After Accept: [PASS/FAIL]
- Volume Upgrade: [PASS/FAIL]
- Disposal Reimbursement: [PASS/FAIL]
- Labor Extension: [PASS/FAIL]

### Critical Bugs Found
1. [Bug description] - [FIXED/PENDING]
2. [Bug description] - [FIXED/PENDING]

### Non-Critical Issues
1. [Issue description] - [NOTED]
2. [Issue description] - [NOTED]

### Overall Status
[PASS/FAIL]

### Recommendations
- [Recommendation 1]
- [Recommendation 2]
```
