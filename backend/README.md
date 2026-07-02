# Backend Deployment Guide

This repository deploys the backend as a separate Vercel project from the frontend.

## Required Backend Files

- `backend/server.js`
- `backend/api/[...slug].js`
- `backend/vercel.json`

## Recommended Vercel Settings (Backend Project)

- Root Directory: `backend`
- Framework Preset: `Other` or `Node.js`
- Install Command: `npm install`
- Build Command: (leave empty)
- Output Directory: (leave empty)
- `backend/vercel.json` contents:

```json
{
  "functions": {
    "api/[...slug].js": {
      "maxDuration": 30
    }
  }
}
```

## Required Vercel Environment Variables (Backend)

Set these in the Vercel project settings:

- `MONGODB_URI` = your MongoDB Atlas connection string
- `SESSION_SECRET` = a secure random value
- `JWT_SECRET` = a secure random value
- `FRONTEND_URL` = `https://job-portal-frontend-ten-chi.vercel.app`
- `NODE_ENV` = `production`

## Backend Deployment Notes

- The backend is served under Vercel API routes.
- The function file `backend/api/[...slug].js` handles all requests under `/api/*`.
- The backend `server.js` exports the Express app without starting a listener when required by Vercel.

## Frontend Connection

The frontend should call the backend through:

- `https://job-portal-nine-green.vercel.app/api`

Set this in frontend Vercel as:

- `VITE_API_URL` = `https://job-portal-nine-green.vercel.app/api`

## Quick Sanity Checks After Deploy

1. Open the backend project logs and confirm `✅ MongoDB Connected`.
2. Test the health check endpoint:
   - `https://job-portal-nine-green.vercel.app/` → should return `{ "status": "ok", "message": "Backend API running" }`
   - `https://job-portal-nine-green.vercel.app/api` → should return `{ "status": "ok", "message": "Backend API running" }`
3. Test an actual API endpoint (should return 401 if not authenticated):
   - `https://job-portal-nine-green.vercel.app/api/auth/me` → should return `{ "status": "ok" }` or `{ "error": "Unauthorized" }`
4. Confirm the frontend uses the correct `VITE_API_URL` and not a local `localhost:5000` URL.
