# Haulkind Top 10 Failure Points to Monitor

**Version:** 1.0.0  
**Date:** January 17, 2026  
**Purpose:** Critical failure points that require active monitoring in production

---

## Executive Summary

Based on the architecture and QA testing, these are the top 10 failure points that are most likely to cause issues in production. Each has been ranked by **Impact** (user-facing severity) and **Likelihood** (probability of occurrence).

**Priority Levels:**
- 🔴 **Critical:** Immediate action required, affects core business
- 🟡 **High:** Significant impact, affects user experience
- 🟢 **Medium:** Moderate impact, workaround available

---

## Top 10 Failure Points

### 1. Payment Processing Failures 🔴

**Impact:** Critical (revenue loss, customer frustration)  
**Likelihood:** Medium (depends on Stripe/payment provider)

**Failure Scenarios:**
- Stripe API down or rate-limited
- Payment Intent creation fails
- Webhook delivery fails
- Customer card declined
- Network timeout during payment

**Symptoms:**
- Jobs stuck in `PENDING_PAYMENT` status
- Error logs: `StripeError`, `PaymentIntentFailed`
- Customer complaints about charged but no job created

**Monitoring:**
```bash
# Check payment failure rate
SELECT 
  COUNT(*) as total_payments,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
  (SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) / COUNT(*)) * 100 as failure_rate
FROM payments
WHERE createdAt > DATE_SUB(NOW(), INTERVAL 1 HOUR);
```

**Alert Threshold:** > 5% failure rate in last hour

**Mitigation:**
- Automatic fallback to ledger mode if Stripe fails
- Retry logic with exponential backoff
- Manual payment reconciliation process
- Customer support notification for failed payments

**Recovery Steps:**
1. Check Stripe dashboard for issues
2. Verify webhook endpoint is accessible
3. Manually retry failed payments from admin dashboard
4. Refund and recreate job if necessary

---

### 2. No Available Drivers (Dispatch Failures) 🔴

**Impact:** Critical (no service delivery, customer abandonment)  
**Likelihood:** High (especially during launch or peak hours)

**Failure Scenarios:**
- All drivers offline
- No drivers in service area
- All drivers busy with active jobs
- Drivers decline all offers
- Dispatch algorithm fails to find matches

**Symptoms:**
- Jobs stuck in `PENDING_DISPATCH` for > 15 minutes
- No offers created
- Error logs: `NoAvailableDrivers`, `DispatchTimeout`
- Customer sees "Matching you with a driver..." indefinitely

**Monitoring:**
```bash
# Check jobs pending dispatch
SELECT 
  COUNT(*) as pending_jobs,
  MIN(createdAt) as oldest_job,
  TIMESTAMPDIFF(MINUTE, MIN(createdAt), NOW()) as minutes_waiting
FROM jobs
WHERE status = 'PENDING_DISPATCH';
```

**Alert Threshold:** > 5 jobs pending for > 15 minutes

**Mitigation:**
- Admin alert when no drivers online in service area
- Automatic SMS to offline drivers in area
- Manual dispatch console for force-assign
- Refund policy for unmatched jobs > 30 minutes

**Recovery Steps:**
1. Check driver availability in admin live map
2. Contact offline drivers via SMS/phone
3. Force-assign job to specific driver
4. Offer incentive bonus for immediate acceptance
5. If no drivers available, refund customer and apologize

---

### 3. Database Connection Pool Exhaustion 🔴

**Impact:** Critical (entire platform down)  
**Likelihood:** Medium (under high load)

**Failure Scenarios:**
- Too many concurrent connections
- Long-running queries blocking connections
- Connection leaks (not properly closed)
- Database server overloaded
- Network issues between app and database

**Symptoms:**
- API returns 500 errors
- Error logs: `PoolExhausted`, `ConnectionTimeout`
- Slow response times across all endpoints
- Health check fails

**Monitoring:**
```bash
# Check active connections
SHOW PROCESSLIST;

# Check connection pool stats
SELECT * FROM information_schema.PROCESSLIST 
WHERE DB = 'haulkind';
```

**Alert Threshold:** > 90% of max connections used

**Mitigation:**
- Connection pooling with max 100 connections
- Query timeout of 30 seconds
- Automatic connection recycling
- Read replicas for heavy read operations
- Horizontal scaling with load balancer

**Recovery Steps:**
1. Restart application servers to reset connections
2. Kill long-running queries: `KILL <process_id>`
3. Scale up database resources
4. Add read replicas if read-heavy
5. Optimize slow queries

---

### 4. Real-Time Tracking Socket Disconnections 🟡

**Impact:** High (poor user experience, no live updates)  
**Likelihood:** High (mobile networks unreliable)

**Failure Scenarios:**
- Mobile network drops
- Server restart disconnects all clients
- Socket.io server overloaded
- Client battery saver mode
- Firewall blocks WebSocket

**Symptoms:**
- Customer doesn't see driver location updates
- Driver doesn't receive new offers
- Error logs: `SocketDisconnect`, `ReconnectFailed`
- Stale data in UI

**Monitoring:**
```bash
# Check active socket connections
# (requires Socket.io admin UI or custom metrics)
socket.io.engine.clientsCount
```

**Alert Threshold:** > 20% disconnect rate in last 5 minutes

**Mitigation:**
- Automatic reconnection with exponential backoff
- Fallback to polling every 10 seconds
- Heartbeat/ping every 30 seconds
- Resume state on reconnect
- Graceful degradation to polling-only mode

**Recovery Steps:**
1. Check Socket.io server logs
2. Verify WebSocket port (usually 3000) is accessible
3. Restart Socket.io server if needed
4. Advise users to refresh app
5. Use polling fallback for critical updates

---

### 5. GPS Location Inaccuracy or Failure 🟡

**Impact:** High (wrong ETA, customer can't find driver)  
**Likelihood:** Medium (urban canyons, tunnels, indoor)

**Failure Scenarios:**
- GPS signal lost (tunnels, underground parking)
- Location permissions denied
- Battery saver mode disables GPS
- Inaccurate coordinates (off by blocks)
- Driver phone GPS hardware failure

**Symptoms:**
- Driver location jumps erratically on map
- ETA calculation wildly incorrect
- Customer complaints: "Driver not where map shows"
- Error logs: `LocationUnavailable`, `PermissionDenied`

**Monitoring:**
```bash
# Check stale driver locations
SELECT 
  d.id, d.name, 
  dl.updatedAt,
  TIMESTAMPDIFF(MINUTE, dl.updatedAt, NOW()) as minutes_stale
FROM drivers d
JOIN driverLocations dl ON d.id = dl.driverId
WHERE d.isOnline = 1
  AND TIMESTAMPDIFF(MINUTE, dl.updatedAt, NOW()) > 5;
```

**Alert Threshold:** > 5 minutes since last location update for online driver

**Mitigation:**
- Request location every 30 seconds while on job
- Fallback to last known location + estimated movement
- Warn customer if location is stale
- Driver app prompts to enable location services
- Manual location entry as last resort

**Recovery Steps:**
1. Contact driver to verify location
2. Ask driver to restart app
3. Check phone location settings
4. Use Google Maps API to geocode address
5. Manual ETA calculation if needed

---

### 6. Photo Upload Failures 🟡

**Impact:** High (can't complete job, payout delayed)  
**Likelihood:** Medium (large files, slow networks)

**Failure Scenarios:**
- Image file too large (> 10MB)
- S3 upload timeout
- Network interruption during upload
- S3 bucket permissions wrong
- Out of S3 storage quota

**Symptoms:**
- Driver can't mark job as complete
- Error logs: `S3UploadFailed`, `FileTooLarge`
- Jobs stuck in `STARTED` status
- Driver complaints about "upload failed"

**Monitoring:**
```bash
# Check jobs missing required photos
SELECT 
  j.id, j.status, j.jobType,
  COUNT(jp.id) as photo_count
FROM jobs j
LEFT JOIN jobPhotos jp ON j.id = jp.jobId
WHERE j.status IN ('STARTED', 'COMPLETED')
  AND j.jobType = 'HAUL_AWAY'
GROUP BY j.id
HAVING photo_count < 2;  -- Need before + after
```

**Alert Threshold:** > 10 jobs missing photos for > 30 minutes

**Mitigation:**
- Client-side image compression before upload
- Retry upload 3 times with exponential backoff
- Allow job completion with pending photos
- Manual photo upload from admin dashboard
- Temporary local storage with background sync

**Recovery Steps:**
1. Check S3 bucket permissions and quota
2. Verify AWS credentials are valid
3. Ask driver to retry upload
4. Compress image and retry
5. Allow manual upload via email as fallback

---

### 7. Pricing Calculation Errors 🟡

**Impact:** High (revenue loss or customer overcharge)  
**Likelihood:** Low (but high impact when it occurs)

**Failure Scenarios:**
- Volume tier not found for service area
- Add-on price missing
- Distance calculation incorrect
- Disposal cap not applied
- Labor rate misconfigured

**Symptoms:**
- Quote returns $0 or unreasonably high price
- Customer charged different amount than quoted
- Error logs: `PricingError`, `TierNotFound`
- Customer complaints about pricing discrepancy

**Monitoring:**
```bash
# Check for unusual pricing
SELECT 
  j.id, j.jobType, j.totalPrice,
  AVG(j2.totalPrice) as avg_price
FROM jobs j
JOIN jobs j2 ON j.jobType = j2.jobType
WHERE j.createdAt > DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY j.id
HAVING j.totalPrice > avg_price * 2 OR j.totalPrice < avg_price * 0.5;
```

**Alert Threshold:** > 5 jobs with pricing > 2x or < 0.5x average

**Mitigation:**
- Validate pricing configuration on startup
- Log all pricing calculations
- Admin review of pricing changes
- Price floor and ceiling checks
- Manual price override in admin dashboard

**Recovery Steps:**
1. Review pricing configuration in database
2. Check service area has all required pricing tiers
3. Verify add-on prices are set
4. Manually adjust job price if needed
5. Refund difference if customer overcharged

---

### 8. Driver Payout Calculation Errors 🟡

**Impact:** High (driver dissatisfaction, legal issues)  
**Likelihood:** Low (but critical for driver retention)

**Failure Scenarios:**
- 60/40 split calculated incorrectly
- Disposal reimbursement not added
- Tip not included
- Payout created twice (duplicate)
- Stripe transfer fails

**Symptoms:**
- Driver receives wrong amount
- Error logs: `PayoutCalculationError`, `TransferFailed`
- Driver complaints about payment
- Negative payout amounts

**Monitoring:**
```bash
# Check payout calculations
SELECT 
  p.id, p.driverId, p.jobId,
  j.totalPrice as job_price,
  p.amount as payout_amount,
  (p.amount / j.totalPrice) * 100 as payout_percentage
FROM payouts p
JOIN jobs j ON p.jobId = j.id
WHERE p.createdAt > DATE_SUB(NOW(), INTERVAL 1 DAY)
  AND ((p.amount / j.totalPrice) < 0.55 OR (p.amount / j.totalPrice) > 0.65);
```

**Alert Threshold:** Payout percentage < 55% or > 65%

**Mitigation:**
- Automated payout calculation with audit trail
- Manual review before processing payouts
- Driver can dispute payout within 7 days
- Automatic correction for calculation errors
- Transparent breakdown in driver app

**Recovery Steps:**
1. Review payout calculation logic
2. Check job price and payout amount
3. Verify disposal reimbursement was added
4. Create adjustment payout if needed
5. Notify driver of correction

---

### 9. Service Area Boundary Issues 🟢

**Impact:** Medium (wrong pricing, dispatch failures)  
**Likelihood:** Medium (edge cases near boundaries)

**Failure Scenarios:**
- Address geocoding returns wrong coordinates
- Point-in-polygon check fails
- Address on boundary of two service areas
- Zip code spans multiple service areas
- Google Maps API returns incorrect location

**Symptoms:**
- Customer sees "not in service area" but should be covered
- Job assigned to wrong service area pricing
- Error logs: `GeocodeError`, `ServiceAreaNotFound`
- Customer complaints about coverage

**Monitoring:**
```bash
# Check jobs near service area boundaries
SELECT 
  j.id, j.address, j.serviceAreaId,
  sa.name as service_area
FROM jobs j
JOIN serviceAreas sa ON j.serviceAreaId = sa.id
WHERE j.createdAt > DATE_SUB(NOW(), INTERVAL 1 DAY);
```

**Alert Threshold:** > 10 "not in service area" errors per hour

**Mitigation:**
- Buffer zone around service area polygons
- Manual address verification for edge cases
- Allow admin to override service area
- Multiple geocoding providers as fallback
- Customer can submit address for review

**Recovery Steps:**
1. Manually geocode address in Google Maps
2. Check if coordinates are near boundary
3. Override service area assignment if needed
4. Update service area polygon if incorrect
5. Notify customer of resolution

---

### 10. Mobile App Crashes 🟢

**Impact:** Medium (user frustration, bad reviews)  
**Likelihood:** Medium (device fragmentation, OS updates)

**Failure Scenarios:**
- Out of memory on low-end devices
- Unhandled JavaScript exception
- Native module crash (location, camera)
- OS version incompatibility
- Background process killed by OS

**Symptoms:**
- App force closes
- Error logs in Sentry: `UnhandledException`, `MemoryWarning`
- App Store reviews: "app keeps crashing"
- High crash rate in analytics

**Monitoring:**
```bash
# Check Sentry dashboard
# Crash rate > 1% in last 24 hours
```

**Alert Threshold:** > 1% crash rate

**Mitigation:**
- Global error boundary in React Native
- Automatic error reporting to Sentry
- Graceful degradation for failed features
- Memory optimization (image compression, cache limits)
- OTA updates for quick fixes

**Recovery Steps:**
1. Check Sentry for crash reports
2. Identify affected devices/OS versions
3. Deploy hotfix via OTA update
4. If critical, submit emergency app update
5. Notify affected users via push notification

---

## Monitoring Dashboard Recommendations

### Key Metrics to Display

**Real-Time (< 1 minute refresh):**
- Active jobs by status
- Online drivers by service area
- Payment success rate (last hour)
- API error rate (last 5 minutes)
- Socket.io connections

**Hourly:**
- Jobs created vs completed
- Average time to dispatch
- Average job duration
- Driver earnings
- Customer satisfaction (ratings)

**Daily:**
- Revenue (total, by service area, by job type)
- Driver payouts
- New customers vs returning
- App downloads
- Support tickets

### Alert Channels

**Critical Alerts (immediate):**
- PagerDuty → On-call engineer
- SMS → CTO + Head of Operations
- Slack → #incidents channel

**High Priority Alerts (< 15 minutes):**
- Slack → #alerts channel
- Email → engineering@haulkind.com

**Medium Priority Alerts (< 1 hour):**
- Email → ops@haulkind.com
- Slack → #monitoring channel

---

## Incident Response Playbook

### Severity Levels

**P0 (Critical):**
- Platform completely down
- Payment processing broken
- Data breach or security incident
- Response time: < 5 minutes

**P1 (High):**
- Core feature broken (dispatch, tracking)
- Multiple customers affected
- Revenue impact
- Response time: < 15 minutes

**P2 (Medium):**
- Non-critical feature broken
- Single customer affected
- Workaround available
- Response time: < 1 hour

**P3 (Low):**
- Minor bug or UI issue
- No customer impact
- Can wait for next release
- Response time: < 1 day

### Incident Response Steps

1. **Detect:** Alert triggered or customer report
2. **Acknowledge:** On-call engineer acknowledges in PagerDuty
3. **Assess:** Determine severity and impact
4. **Communicate:** Post in #incidents channel, notify stakeholders
5. **Mitigate:** Apply immediate fix or workaround
6. **Resolve:** Deploy permanent fix
7. **Verify:** Confirm issue is resolved
8. **Postmortem:** Document root cause and prevention

---

## Rollback Procedures

### Backend API Rollback

```bash
# 1. Identify last known good version
git log --oneline -10

# 2. Rollback to previous version
git checkout <commit-hash>

# 3. Rebuild and restart
pnpm build
pm2 restart haulkind-backend

# 4. Verify health check
curl https://api.haulkind.com/health
```

### Web App Rollback (Vercel)

```bash
# 1. List recent deployments
vercel list

# 2. Rollback to previous deployment
vercel rollback <deployment-url>

# 3. Verify
curl https://haulkind.com
```

### Mobile App Rollback (OTA)

```bash
# 1. List recent updates
eas update:list --branch production

# 2. Rollback to previous update
eas update:rollback --branch production

# 3. Verify in app
# Force close and reopen app
```

### Database Rollback

```bash
# 1. Stop application servers
pm2 stop all

# 2. Restore from backup
mysql -u root -p haulkind < backup-2026-01-17.sql

# 3. Restart application
pm2 start all

# 4. Verify data integrity
# Run smoke tests
```

---

## Runbook: Common Issues

### Issue: "Payment failed but customer was charged"

**Steps:**
1. Check Stripe dashboard for charge status
2. If charge succeeded, mark payment as completed in database
3. If charge failed, verify no charge in Stripe
4. If duplicate charge, refund one
5. Notify customer of resolution

### Issue: "Driver not receiving offers"

**Steps:**
1. Verify driver is online: `SELECT isOnline FROM drivers WHERE id = ?`
2. Check driver location is recent: `SELECT updatedAt FROM driverLocations WHERE driverId = ?`
3. Verify driver capabilities match job type
4. Check Socket.io connection in admin dashboard
5. Ask driver to go offline and back online

### Issue: "Customer can't see driver location"

**Steps:**
1. Check job status: `SELECT status FROM jobs WHERE id = ?`
2. Verify driver location is being updated
3. Check Socket.io connection for customer
4. Ask customer to refresh app
5. Fallback to SMS with ETA

### Issue: "Job stuck in PENDING_DISPATCH"

**Steps:**
1. Check available drivers: `SELECT COUNT(*) FROM drivers WHERE isOnline = 1 AND serviceAreaId = ?`
2. If no drivers, send SMS to offline drivers
3. If drivers available, manually dispatch from admin
4. If > 30 minutes, refund customer
5. Investigate dispatch algorithm

### Issue: "Database slow queries"

**Steps:**
1. Check slow query log: `SHOW FULL PROCESSLIST;`
2. Kill long-running queries: `KILL <process_id>;`
3. Add missing indexes
4. Optimize query
5. Scale up database if needed

---

## Contact Information

**On-Call Engineer:** (rotate weekly)  
**Phone:** +1-555-ONCALL  
**Email:** oncall@haulkind.com

**CTO:**  
**Phone:** +1-555-CTO  
**Email:** cto@haulkind.com

**Head of Operations:**  
**Phone:** +1-555-OPS  
**Email:** ops@haulkind.com

**Customer Support:**  
**Phone:** 1-800-HAULKIND  
**Email:** support@haulkind.com

**Emergency Escalation:**  
**CEO:** +1-555-CEO

---

**Last Updated:** January 17, 2026  
**Next Review:** Monthly  
**Owner:** Head of Engineering
