# Haulkind Platform - Development TODO

## Phase 1: Database & Schema ✅
- [x] Create comprehensive database schema (30+ tables)
- [x] Setup Users, Customers, Drivers tables
- [x] Create ServiceAreas with radius/polygon support
- [x] Setup Pricing tables (volumes, disposal caps, addons, distance rules, labor rates)
- [x] Create Jobs, JobAssignments, JobOffers tables
- [x] Setup Payments and Payouts tables
- [x] Create DriverLocations, JobPhotos tables
- [x] Add Conversations, Messages, Ratings tables
- [x] Setup AuditLogs, DriverStrikes, TimeExtensionRequests
- [x] Create seed data for service areas (PA, NY, NJ)
- [x] Seed default pricing data

## Phase 2: Authentication & Core Modules
- [ ] Implement JWT authentication
- [ ] Create role-based guards (admin, customer, driver)
- [ ] Build auth endpoints (signup, login, /me)
- [ ] Implement Service Areas CRUD
- [ ] Add service area lookup by coordinates
- [ ] Support radius and polygon GeoJSON

## Phase 3: Pricing & Jobs
- [ ] Build pricing engine for HAUL_AWAY (volume-based)
- [ ] Build pricing engine for LABOR_ONLY (hourly with 2hr minimum)
- [ ] Create admin CRUD for all pricing tables
- [ ] Implement POST /quotes endpoint
- [ ] Create jobs workflow (draft → quote → pay)
- [ ] Implement ledger payment provider (pluggable)
- [ ] Calculate 60/40 split (driver/platform)

## Phase 4: Media & Driver Onboarding
- [ ] Implement media upload abstraction
- [ ] Support local storage for dev
- [ ] Create interface for S3/R2
- [ ] Handle 4 photo types (customer_upload, before, after, receipt)
- [ ] Build driver onboarding endpoints
- [ ] Implement vehicle info and capabilities
- [ ] Create document upload system
- [ ] Add go-online/go-offline endpoints
- [ ] Build admin driver approval system

## Phase 5: Real-time Features
- [ ] Setup Socket.io gateway
- [ ] Implement driver presence tracking
- [ ] Create customer rooms (per job)
- [ ] Create driver rooms (per driver)
- [ ] Create admin global room
- [ ] Implement driver location streaming
- [ ] Setup Redis cache for current location
- [ ] Add PostgreSQL snapshots (every 60s)
- [ ] Implement adaptive throttling (3-5s on job, 10-20s idle)
- [ ] Build ETA calculation with Maps API
- [ ] Optimize ETA recomputation (every 30-60s)

## Phase 6: Dispatch & Ledger
- [ ] Build dispatch engine eligibility filter
- [ ] Implement driver ranking algorithm
- [ ] Create wave offer system (top 3 → top 10)
- [ ] Handle offer expiration (15s per wave)
- [ ] Implement first-accept-wins logic
- [ ] Handle no-coverage fallback
- [ ] Create job status transitions (assigned → en_route → arrived → started → completed)
- [ ] Implement AFTER photo requirement for completion
- [ ] Add time extension workflow for LABOR_ONLY
- [ ] Finalize payout creation on job completion
- [ ] Calculate disposal reimbursement for HAUL_AWAY

## Phase 7: Web App (Marketing + Checkout)
- [x] Design landing page layout
- [x] Implement service area lookup UI
- [x] Build volume calculator for HAUL_AWAY
- [x] Create labor hours selector for LABOR_ONLY
- [x] Display quote with line items
- [x] Show "Includes disposal up to $X" copy
- [ ] Implement checkout flow
- [ ] Add payment integration
- [ ] Create job tracking page

## Phase 8: Admin Dashboard
- [ ] Build live map with drivers and jobs
- [ ] Create driver approval interface
- [ ] Implement job queue with filters
- [ ] Build dispatch console
- [ ] Create pricing editor
- [ ] Add audit logs viewer
- [ ] Implement payout management

## Phase 9: Mobile Apps
- [ ] Customer App: Service selection
- [ ] Customer App: Quote request
- [ ] Customer App: Job tracking with live map
- [ ] Customer App: Chat with driver
- [ ] Driver App: Profile setup
- [ ] Driver App: Go online/offline
- [ ] Driver App: Receive job offers
- [ ] Driver App: Navigate to pickup
- [ ] Driver App: Update job status
- [ ] Driver App: Upload photos

## Phase 10: Testing & Deployment
- [ ] Write unit tests for pricing engine
- [ ] Test dispatch algorithm
- [ ] Test real-time location updates
- [ ] Test payment flows
- [ ] Setup CI/CD pipeline
- [ ] Deploy to production
