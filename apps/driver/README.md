# Haulkind Driver App

Expo mobile app for Haulkind drivers.

## Features

- **Authentication**: Login/signup with email and password
- **Onboarding**: Complete profile with vehicle info and service preferences
- **Online/Offline**: Toggle availability to receive job offers
- **Real-time Offers**: Receive job offers via Socket.io with countdown timer
- **Job Management**: Accept jobs and update status through the workflow
- **Photo Upload**: Take before/after photos and upload disposal receipts
- **Location Streaming**: GPS tracking during active jobs (throttled to 30s intervals)
- **Navigation**: Open Google Maps for directions to job location

## Setup

1. Install dependencies:
```bash
cd /home/ubuntu/haulkind/apps/driver
pnpm install
```

2. Set environment variables:
Create a `.env` file:
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

3. Start the app:
```bash
pnpm start
```

## Running the App

### Web (for testing)
```bash
pnpm web
```

### iOS Simulator
```bash
pnpm ios
```

### Android Emulator
```bash
pnpm android
```

### Physical Device
1. Install Expo Go app on your device
2. Scan the QR code from `pnpm start`

## Status Flow

Jobs follow this status progression:

1. **ACCEPTED** - Driver accepted the offer
2. **EN_ROUTE** - Driver is on the way
3. **ARRIVED** - Driver arrived at location
4. **STARTED** - Job in progress
5. **COMPLETED** - Job finished

## Photo Requirements

- **Before Photos**: Required before marking job as STARTED
- **After Photos**: Required before marking job as COMPLETED
- **Disposal Receipt**: Required for HAUL_AWAY jobs before COMPLETED

## Location Tracking

Location is streamed to the backend every 30 seconds when the job status is:
- EN_ROUTE
- ARRIVED
- STARTED

## Backend Integration

The app connects to the backend API (Commands 1-14) for:
- Authentication (`/driver/auth/login`, `/driver/auth/signup`)
- Onboarding (`/driver/onboarding`)
- Status updates (`/driver/status/online`, `/driver/status/offline`)
- Offers (`/driver/offers/:id/accept`, `/driver/offers/:id/decline`)
- Job management (`/driver/jobs/:id/status`, `/driver/jobs/active`)
- Location streaming (`/driver/jobs/:id/location`)

## Socket.io Events

The app listens for real-time events:
- `offer` - New job offer received
- `offer_expired` - Offer expired (timer ran out)

## Testing

To test the app:

1. Start the backend:
```bash
cd /home/ubuntu/haulkind
pnpm dev
```

2. Start the driver app:
```bash
cd /home/ubuntu/haulkind/apps/driver
pnpm web
```

3. Create a driver account via signup
4. Complete onboarding
5. Go online
6. Create a test job from the customer web app (Command 16)
7. Accept the offer when it appears
8. Follow the status flow and upload photos

## Known Limitations (Demo Mode)

- Photos are not actually uploaded to S3 (returns local URIs)
- Location streaming may not work in web mode (use device)
- Socket.io connection requires backend to be running
