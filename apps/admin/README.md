# Haulkind Admin Dashboard

Next.js admin dashboard for managing drivers, jobs, pricing, and monitoring operations.

## Features

### ✅ Driver Management
- List all drivers with status (PENDING, ACTIVE, BLOCKED)
- Approve pending drivers
- Block/unblock drivers
- View document upload status (license, insurance, registration)
- View driver details (vehicle info, service capabilities)

### ✅ Live Map
- Real-time map showing active drivers and jobs
- Filter by service area (PA, NY, NJ)
- Show driver last seen timestamp
- Display job pickup locations
- Color-coded markers by status

### ✅ Job Queue
- List all jobs with filters:
  * Status (PENDING, ASSIGNED, EN_ROUTE, ARRIVED, STARTED, COMPLETED)
  * Job type (HAUL_AWAY, LABOR_ONLY)
  * Service area
  * Date range
- Job details modal with full information
- Real-time status updates

### ✅ Dispatch Console
- View unassigned jobs
- Show nearest eligible drivers for each job
- Display driver stats:
  * Distance from pickup
  * ETA to pickup
  * Completion rate
  * Average rating
  * Current status
- Force assign job to specific driver
- View offer waves history
- Monitor offer acceptance/decline

### ✅ Pricing Console
**Volume Pricing (Haul Away):**
- Edit base prices for each volume tier
- Configure disposal caps per tier
- Set distance rules (base miles, per-mile fee)

**Add-ons:**
- Manage add-on services and prices
- Enable/disable add-ons
- Set per-service-area pricing

**Labor Rates (Labor Only):**
- Edit hourly rates by helper count
- Configure minimum hours
- Set per-service-area rates

### ✅ Audit Logs
- View all system actions
- Filter by:
  * Entity type (Driver, Job, Payment, etc.)
  * Action (CREATE, UPDATE, DELETE, etc.)
  * User
  * Date range
- Export logs to CSV

## Setup

```bash
cd /home/ubuntu/haulkind/apps/admin
pnpm install
pnpm dev
```

Runs on http://localhost:3002

## Authentication

Admin users must have `role = 'admin'` in the users table.

Login at `/login` with admin credentials.

## API Endpoints

### Drivers
- `GET /admin/drivers` - List all drivers
- `GET /admin/drivers/:id` - Get driver details
- `POST /admin/drivers/:id/approve` - Approve driver
- `POST /admin/drivers/:id/block` - Block driver
- `POST /admin/drivers/:id/unblock` - Unblock driver

### Jobs
- `GET /admin/jobs` - List all jobs (with filters)
- `GET /admin/jobs/:id` - Get job details
- `GET /admin/jobs/:id/offer-waves` - Get offer history

### Dispatch
- `GET /admin/dispatch/unassigned` - Get unassigned jobs
- `GET /admin/dispatch/eligible-drivers?jobId=X` - Get eligible drivers for job
- `POST /admin/dispatch/force-assign` - Force assign job to driver

### Pricing
- `GET /admin/pricing/volumes` - Get volume pricing
- `PUT /admin/pricing/volumes/:id` - Update volume pricing
- `GET /admin/pricing/addons` - Get add-ons
- `PUT /admin/pricing/addons/:id` - Update add-on
- `GET /admin/pricing/labor-rates` - Get labor rates
- `PUT /admin/pricing/labor-rates/:id` - Update labor rate

### Audit Logs
- `GET /admin/audit-logs` - List audit logs (with filters)

### Map
- `GET /admin/map/drivers` - Get active drivers with locations
- `GET /admin/map/jobs` - Get active jobs with locations

## File Structure

```
apps/admin/
├── app/
│   ├── layout.tsx                    # Root layout with nav
│   ├── page.tsx                      # Dashboard home
│   ├── login/
│   │   └── page.tsx                  # Admin login
│   ├── drivers/
│   │   ├── page.tsx                  # Driver list
│   │   └── [id]/
│   │       └── page.tsx              # Driver details
│   ├── map/
│   │   └── page.tsx                  # Live map
│   ├── jobs/
│   │   ├── page.tsx                  # Job queue
│   │   └── [id]/
│   │       └── page.tsx              # Job details
│   ├── dispatch/
│   │   └── page.tsx                  # Dispatch console
│   ├── pricing/
│   │   ├── page.tsx                  # Pricing overview
│   │   ├── volumes/
│   │   │   └── page.tsx              # Volume pricing editor
│   │   ├── addons/
│   │   │   └── page.tsx              # Add-ons editor
│   │   └── labor/
│   │       └── page.tsx              # Labor rates editor
│   └── audit-logs/
│       └── page.tsx                  # Audit logs viewer
├── components/
│   ├── Nav.tsx                       # Navigation sidebar
│   ├── DriverTable.tsx               # Driver list table
│   ├── JobTable.tsx                  # Job list table
│   ├── LiveMap.tsx                   # Map component
│   ├── DispatchCard.tsx              # Dispatch job card
│   ├── DriverCard.tsx                # Eligible driver card
│   ├── PricingEditor.tsx             # Pricing form
│   └── AuditLogTable.tsx             # Audit log table
├── lib/
│   ├── api.ts                        # API client
│   └── auth.ts                       # Auth helpers
├── package.json
├── next.config.js
└── tsconfig.json
```

## Components

### DriverTable
```typescript
<DriverTable
  drivers={drivers}
  onApprove={(id) => approveDriver(id)}
  onBlock={(id) => blockDriver(id)}
  onUnblock={(id) => unblockDriver(id)}
/>
```

### LiveMap
```typescript
<LiveMap
  drivers={activeDrivers}
  jobs={activeJobs}
  serviceAreaFilter={selectedArea}
  onDriverClick={(driver) => showDriverDetails(driver)}
  onJobClick={(job) => showJobDetails(job)}
/>
```

### DispatchCard
```typescript
<DispatchCard
  job={job}
  eligibleDrivers={drivers}
  onForceAssign={(jobId, driverId) => forceAssign(jobId, driverId)}
  onViewWaves={(jobId) => showOfferWaves(jobId)}
/>
```

### PricingEditor
```typescript
<PricingEditor
  type="volume" | "addon" | "labor"
  data={pricingData}
  onSave={(data) => updatePricing(data)}
/>
```

## Real-time Updates

Dashboard uses Socket.io for real-time updates:

```typescript
// Connect to admin room
socket.emit('join_admin_room')

// Listen for updates
socket.on('driver_status_changed', (data) => {
  updateDriverStatus(data)
})

socket.on('job_status_changed', (data) => {
  updateJobStatus(data)
})

socket.on('driver_location_update', (data) => {
  updateDriverLocation(data)
})
```

## Filters

### Job Queue Filters
```typescript
{
  status?: 'PENDING' | 'ASSIGNED' | 'EN_ROUTE' | 'ARRIVED' | 'STARTED' | 'COMPLETED'
  jobType?: 'HAUL_AWAY' | 'LABOR_ONLY'
  serviceAreaId?: number
  startDate?: string
  endDate?: string
}
```

### Driver Filters
```typescript
{
  status?: 'PENDING' | 'ACTIVE' | 'BLOCKED'
  serviceAreaId?: number
  canHaulAway?: boolean
  canLaborOnly?: boolean
}
```

### Audit Log Filters
```typescript
{
  entityType?: string
  action?: string
  userId?: number
  startDate?: string
  endDate?: string
}
```

## Dispatch Algorithm Visibility

The dispatch console shows the same algorithm used by the backend:

1. **Eligibility Filter:**
   - Driver is ACTIVE and online
   - Driver can perform the service type
   - Driver is in the same service area
   - Driver has no active job

2. **Ranking:**
   - Distance from pickup (closer is better)
   - Completion rate (higher is better)
   - Average rating (higher is better)

3. **Display:**
   - Top 10 eligible drivers
   - ETA and distance for each
   - Driver stats (completion rate, rating, jobs completed)
   - Force assign button

## Pricing Console

### Volume Pricing
```typescript
{
  tier: '1_8_LOAD' | '1_4_LOAD' | '1_2_LOAD' | '3_4_LOAD' | '1_LOAD' | '2_LOADS'
  basePrice: number
  disposalCap: number
  serviceAreaId: number
}
```

### Add-ons
```typescript
{
  name: string
  price: number
  enabled: boolean
  serviceAreaId?: number
}
```

### Labor Rates
```typescript
{
  helperCount: 1 | 2
  hourlyRate: number
  minimumHours: number
  serviceAreaId: number
}
```

## Security

- Admin routes protected by middleware
- Role-based access control (RBAC)
- All mutations require admin role
- Audit logs track all admin actions

## Testing

```bash
# Start backend
cd /home/ubuntu/haulkind
pnpm dev

# Start admin dashboard
cd /home/ubuntu/haulkind/apps/admin
pnpm dev
```

Login with admin credentials and verify:
- [ ] Driver list loads
- [ ] Job queue loads
- [ ] Map displays drivers and jobs
- [ ] Dispatch console shows eligible drivers
- [ ] Pricing editor loads current values
- [ ] Audit logs display

## Status

✅ Structure complete
✅ API client defined
✅ All pages defined
⏳ UI components need implementation

## Next Steps

1. Implement DriverTable component
2. Implement LiveMap with Google Maps
3. Implement JobTable with filters
4. Implement DispatchCard with driver ranking
5. Implement PricingEditor forms
6. Implement AuditLogTable with filters
7. Add Socket.io real-time updates
8. Test all CRUD operations
