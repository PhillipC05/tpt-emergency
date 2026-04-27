# TPT Emergency System - Cloud Deployment Guide

This application is fully cloud native and will deploy without code modifications on all major platforms.

---

## Deployment Options Overview

| Platform | Difficulty | Estimated Time | Notes |
|----------|------------|----------------|-------|
| **Fly.io** | 🟢 Very Easy | 2 minutes | Recommended |
| **Render** | 🟢 Very Easy | 3 minutes | |
| **Railway** | 🟢 Very Easy | 2 minutes | |
| **Cloud Run (GCP)** | 🟡 Easy | 5 minutes | |
| **ECS (AWS)** | 🟡 Easy | 10 minutes | |
| **Azure Container Apps** | 🟡 Easy | 7 minutes | |
| **Netlify / Vercel** | 🟢 Very Easy | 1 minute | Frontend only |

---

## 🔷 Fly.io Deployment (Recommended)

Fastest full stack deployment option.

```bash
# Install flyctl
iwr https://fly.io/install.ps1 | iex

# Login
fly auth login

# Deploy
fly launch
fly deploy
```

Application will be automatically deployed with:
- Auto TLS certificate
- Global edge network
- Automatic scaling
- Persistent volume for database

---

## 🔶 Render Deployment

1. Fork the repository
2. Create new Web Service on Render
3. Connect your repository
4. Use the following configuration:
   ```
   Build Command: npm install && npm run build
   Start Command: npm run server
   ```
5. Add environment variable:
   ```
   NODE_ENV=production
   ```
6. Click Deploy

---

## 🚂 Railway Deployment

1. Login to Railway
2. New Project → Deploy from GitHub repo
3. Select this repository
4. Railway will automatically detect Dockerfile
5. Add volume mount at `/app` for database persistence
6. Deploy

---

## ☁️ Google Cloud Run

```bash
# Build and push image
gcloud builds submit --tag gcr.io/[PROJECT_ID]/tpt-emergency

# Deploy to Cloud Run
gcloud run deploy tpt-emergency \
  --image gcr.io/[PROJECT_ID]/tpt-emergency \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000
```

---

## 📦 Static Frontend Only Deployment

For deployments without backend server:

```bash
npm run build
```

Upload contents of `dist/` directory to:
- Cloudflare Pages
- Netlify
- Vercel
- AWS S3 + CloudFront
- Azure Static Web Apps

Note: You will need to point the application at a separate running WebSocket server.

---

## Production Configuration

### Recommended Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Enable production optimizations |
| `PORT` | `3000` | Server listen port |
| `PUBLIC_URL` | `https://your-domain.com` | Public application URL |

---

## Scaling Considerations

### Horizontal Scaling
This application supports horizontal scaling out of the box:
- WebSocket connections will automatically balance
- No sticky sessions required
- Database should be moved to PostgreSQL / MySQL for multi-instance deployments

### Edge Deployment
The static frontend assets can be deployed globally on edge networks while running a single central backend instance.

---

## Database Upgrade

For production cloud deployments it is recommended to upgrade from SQLite to PostgreSQL:

```env
DATABASE_URL=postgresql://user:pass@host:5432/tpt-emergency
```

All database logic is already abstracted and supports multiple database backends.

---

## Post Deployment Checklist

✅ Verify WebSocket connections establish correctly  
✅ Test offline functionality  
✅ Confirm PWA installs correctly  
✅ Verify alarms and notifications work  
✅ Test map loading and vehicle tracking  

All features will work exactly the same in cloud deployment as they do locally.