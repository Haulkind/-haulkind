# Haulkind Backend API

Minimal standalone backend API with health check, JWT authentication, and admin endpoints.

## Features

- ✅ Health check (`GET /health`)
- ✅ JWT Authentication (`POST /auth/login`, `GET /auth/me`)
- ✅ Admin endpoint (`GET /admin/ping`)
- ✅ CORS configured for Vercel domains
- ✅ Environment variables support

## Environment Variables

```
PORT=3001
JWT_SECRET=your-secret-key-change-in-production
CORS_ORIGIN=https://haulkind-web.vercel.app,https://haulkind-admin.vercel.app
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## API Endpoints

### Health Check
```
GET /health
Response: { "ok": true }
```

### Login
```
POST /auth/login
Body: { "email": "admin@haulkind.com", "password": "admin123" }
Response: { "token": "...", "user": { ... } }
```

### Get Current User
```
GET /auth/me
Headers: { "Authorization": "Bearer <token>" }
Response: { "id": "1", "email": "...", "name": "...", "role": "admin" }
```

### Admin Ping
```
GET /admin/ping
Headers: { "Authorization": "Bearer <token>" }
Response: { "admin": true, "message": "Admin access granted" }
```

## Deployment

### Render

1. Create new Web Service
2. Connect GitHub repository
3. Set root directory: `server-standalone`
4. Build command: `npm install && npm run build`
5. Start command: `npm start`
6. Add environment variables

### Railway

1. Create new project
2. Connect GitHub repository
3. Set root directory: `server-standalone`
4. Add environment variables
5. Deploy

## Default Credentials

- Email: `admin@haulkind.com`
- Password: `admin123`

**⚠️ Change these in production!**
