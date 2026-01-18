# Haulkind Test Utilities

This directory contains utilities for testing and launching the Haulkind platform.

---

## Quick Start

### 1. Seed Test Data

Create test data (2 drivers, 1 customer, service areas, pricing):

```bash
# Seed data
node scripts/seed-test-data.mjs

# Clean and re-seed
node scripts/seed-test-data.mjs --clean
```

**Test Accounts Created:**

**Customer:**
- Email: `test-customer@haulkind.com`
- Password: `TestPass123!`

**Driver (Haul Away):**
- Email: `test-driver-haul@haulkind.com`
- Password: `TestPass123!`
- Services: Haul Away only
- Status: Approved (online)

**Driver (Labor Only):**
- Email: `test-driver-labor@haulkind.com`
- Password: `TestPass123!`
- Services: Labor Only
- Status: Approved (online)

### 2. Run Smoke Tests

Test all critical paths:

```bash
# Run all smoke tests
./scripts/smoke-test.sh

# Run with verbose output
./scripts/smoke-test.sh --verbose

# Test against different API
API_URL=https://api.haulkind.com ./scripts/smoke-test.sh
```

**Tests Included:**
1. Health Check
2. HAUL_AWAY Flow (end-to-end)
3. LABOR_ONLY Flow (with extension)
4. NO_COVERAGE Scenario

---

## Seed Test Data

### Usage

```bash
node scripts/seed-test-data.mjs [--clean]
```

### Options

- `--clean`: Delete existing test data before seeding

### What It Creates

**Service Areas (3):**
- Test Philadelphia PA
- Test New York NY
- Test Newark NJ

**Pricing:**
- Volume tiers: 1/8, 1/4, 1/2, 3/4, Full truck
- Add-ons: Stairs, Extra Labor, Heavy Items, Appliance Removal
- Labor rates: 1 helper ($80/hr), 2 helpers ($120/hr)
- Minimum hours: 2 hours

**Users:**
- 1 customer
- 2 drivers (one haul-away, one labor-only)

### Database Requirements

Set `DATABASE_URL` environment variable:

```bash
export DATABASE_URL="mysql://user:password@localhost:3306/haulkind"
```

Or use `.env` file.

### Example Output

```
🌱 Haulkind Test Data Seeder

📊 Database: haulkind@localhost:3306

🌱 Seeding test data...

1️⃣  Creating service areas...
   ✅ Created 3 service areas

2️⃣  Creating pricing configuration...
   ✅ Pricing configured

3️⃣  Creating test customer...
   ✅ Customer created: test-customer@haulkind.com

4️⃣  Creating test drivers...
   ✅ Created 2 drivers

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Test Data Seeded Successfully!

📋 Summary:
   • Service Areas: 3
   • Customers: 1
   • Drivers: 2

👤 Test Customer:
   Email: test-customer@haulkind.com
   Password: TestPass123!

🚗 Test Drivers:
   1. Test Driver - Haul Away
      Email: test-driver-haul@haulkind.com
      Password: TestPass123!
      Services: Haul Away
      Status: approved (online)

   2. Test Driver - Labor Only
      Email: test-driver-labor@haulkind.com
      Password: TestPass123!
      Services: Labor Only
      Status: approved (online)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧪 Ready for smoke testing!
   Run: npm run smoke-test
```

---

## Smoke Tests

### Usage

```bash
./scripts/smoke-test.sh [--verbose]
```

### Options

- `--verbose`: Show detailed API request/response logs

### Environment Variables

- `API_URL`: Backend API URL (default: `http://localhost:3000`)

### Tests

#### Test 1: Health Check

Verifies backend is running and healthy.

**Endpoint:** `GET /health`

**Expected:** `{"status":"ok"}`

#### Test 2: HAUL_AWAY Flow (End-to-End)

Tests complete haul-away job lifecycle:

1. Customer login
2. Get quote
3. Create job
4. Pay for job (ledger mode)
5. Driver login
6. Get offers
7. Accept offer
8. Update status: EN_ROUTE → ARRIVED → STARTED → COMPLETED
9. Verify job completed

**Expected:** All steps pass, job status = COMPLETED

#### Test 3: LABOR_ONLY Flow (with Extension)

Tests labor-only job with time extension:

1. Customer login
2. Get quote
3. Create job
4. Pay for job
5. Driver login
6. Start job
7. Request time extension (+1 hour)
8. Customer approves extension
9. Complete job

**Expected:** All steps pass, extension approved

#### Test 4: NO_COVERAGE Scenario

Tests handling of addresses outside service areas:

1. Customer login
2. Check service area (Los Angeles - not covered)
3. Verify "not available" response
4. Verify admin alert created

**Expected:** Service area check returns `available: false`

### Example Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Haulkind Smoke Test Suite           
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ API URL: http://localhost:3000
ℹ Verbose: false

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST: Health Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Health Check: PASS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST: HAUL_AWAY Flow (End-to-End)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ Step 1: Customer login...
✓ HAUL_AWAY: Customer Login: PASS
ℹ Step 2: Get quote...
✓ HAUL_AWAY: Get Quote: PASS
ℹ Step 3: Create job...
✓ HAUL_AWAY: Create Job: PASS
ℹ Step 4: Pay for job...
✓ HAUL_AWAY: Payment: PASS
ℹ Step 5: Driver login...
✓ HAUL_AWAY: Driver Login: PASS
ℹ Step 6: Get offers...
✓ HAUL_AWAY: Get Offers: PASS
ℹ Step 7: Accept offer...
✓ HAUL_AWAY: Accept Offer: PASS
ℹ Step 8: Update job status to EN_ROUTE...
✓ HAUL_AWAY: Status EN_ROUTE: PASS
ℹ Step 9: Update job status to ARRIVED...
✓ HAUL_AWAY: Status ARRIVED: PASS
ℹ Step 10: Update job status to STARTED...
✓ HAUL_AWAY: Status STARTED: PASS
ℹ Step 11: Update job status to COMPLETED...
✓ HAUL_AWAY: Status COMPLETED: PASS
ℹ Step 12: Verify job completed...
✓ HAUL_AWAY: Verify Completion: PASS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST: LABOR_ONLY Flow (with Extension)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ Step 1: Customer login...
✓ LABOR_ONLY: Customer Login: PASS
ℹ Step 2: Get quote...
✓ LABOR_ONLY: Get Quote: PASS
ℹ Step 3: Create job...
✓ LABOR_ONLY: Create Job: PASS
ℹ Step 4: Pay for job...
✓ LABOR_ONLY: Payment: PASS
ℹ Step 5: Driver login...
✓ LABOR_ONLY: Driver Login: PASS
ℹ Step 6: Start job...
✓ LABOR_ONLY: Start Job: PASS
ℹ Step 7: Request time extension...
✓ LABOR_ONLY: Request Extension: PASS
ℹ Step 8: Customer approves extension...
✓ LABOR_ONLY: Approve Extension: PASS
ℹ Step 9: Complete job...
✓ LABOR_ONLY: Complete Job: PASS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST: NO_COVERAGE Scenario (Admin Alert)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ Step 1: Customer login...
✓ NO_COVERAGE: Customer Login: PASS
ℹ Step 2: Check service area (outside coverage)...
✓ NO_COVERAGE: Check Service Area: PASS
ℹ Step 3: Verify admin alert created...
✓ NO_COVERAGE: Admin Alert: PASS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                        SMOKE TEST RESULTS                          
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test Name                                          Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Health Check                                       PASS
HAUL_AWAY: Customer Login                         PASS
HAUL_AWAY: Get Quote                              PASS
HAUL_AWAY: Create Job                             PASS
HAUL_AWAY: Payment                                PASS
HAUL_AWAY: Driver Login                           PASS
HAUL_AWAY: Get Offers                             PASS
HAUL_AWAY: Accept Offer                           PASS
HAUL_AWAY: Status EN_ROUTE                        PASS
HAUL_AWAY: Status ARRIVED                         PASS
HAUL_AWAY: Status STARTED                         PASS
HAUL_AWAY: Status COMPLETED                       PASS
HAUL_AWAY: Verify Completion                      PASS
LABOR_ONLY: Customer Login                        PASS
LABOR_ONLY: Get Quote                             PASS
LABOR_ONLY: Create Job                            PASS
LABOR_ONLY: Payment                               PASS
LABOR_ONLY: Driver Login                          PASS
LABOR_ONLY: Start Job                             PASS
LABOR_ONLY: Request Extension                     PASS
LABOR_ONLY: Approve Extension                     PASS
LABOR_ONLY: Complete Job                          PASS
NO_COVERAGE: Customer Login                       PASS
NO_COVERAGE: Check Service Area                   PASS
NO_COVERAGE: Admin Alert                          PASS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Tests: 25
Passed: 25
Failed: 0

✓ ALL TESTS PASSED
```

### Exit Codes

- `0`: All tests passed
- `1`: One or more tests failed

### CI/CD Integration

Add to `.github/workflows/test.yml`:

```yaml
- name: Seed test data
  run: node scripts/seed-test-data.mjs --clean

- name: Run smoke tests
  run: ./scripts/smoke-test.sh
```

---

## Troubleshooting

### "Database connection failed"

**Solution:** Verify `DATABASE_URL` is set correctly:

```bash
echo $DATABASE_URL
# Should output: mysql://user:password@host:port/database
```

### "API call failed: Connection refused"

**Solution:** Ensure backend is running:

```bash
# Start backend
cd /home/ubuntu/haulkind
pnpm dev

# Verify health check
curl http://localhost:3000/health
```

### "No offers available"

**Solution:** This is expected if dispatch hasn't run yet. The smoke test will mark this as `SKIP` and continue.

To manually dispatch:
1. Login to admin dashboard
2. Go to Dispatch Console
3. Force-assign job to driver

### "Permission denied: ./scripts/smoke-test.sh"

**Solution:** Make script executable:

```bash
chmod +x scripts/smoke-test.sh
```

---

## Adding New Tests

### 1. Add test function to smoke-test.sh

```bash
test_my_new_feature() {
  log_test "My New Feature"
  
  # Test logic here
  local response
  response=$(api_call "GET" "/my-endpoint")
  
  if echo "$response" | grep -q '"success":true'; then
    record_result "My Feature: Test" "PASS"
    return 0
  else
    record_result "My Feature: Test" "FAIL"
    return 1
  fi
}
```

### 2. Call test in main()

```bash
main() {
  # ... existing tests ...
  test_my_new_feature || true
  
  print_results
}
```

### 3. Test it

```bash
./scripts/smoke-test.sh --verbose
```

---

## Related Documentation

- [LAUNCH-READINESS.md](../LAUNCH-READINESS.md) - Pre-launch checklist
- [FAILURE-POINTS.md](../FAILURE-POINTS.md) - Top 10 failure points to monitor
- [QA-REPORT.md](../QA-REPORT.md) - Comprehensive QA test results
- [DEPLOYMENT.md](../DEPLOYMENT.md) - Deployment guide

---

**Last Updated:** January 17, 2026  
**Owner:** Engineering Team
