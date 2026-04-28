# TPT Emergency System - Setup Guide

## Prerequisites

| Tool | Minimum Version |
|------|-----------------|
| Node.js | 20.x |
| npm | 9.x |
| Git | Latest |

---

## Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/PhillipC05/tpt-emergency.git
cd tpt-emergency
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

Application will be available at: `http://localhost:5173`

---

## Production Build

```bash
npm run build
```

Build output will be generated in the `dist/` directory.

### Verify Build
```bash
npm run preview
```

Preview production build at: `http://localhost:4173`

---

## Server Setup

### Run Backend Server
```bash
npm run server
```

Server runs on port `3000` by default.

### Environment Variables
Create `.env` file in project root:
```env
PORT=3000
NODE_ENV=development
DB_PATH=./emergency.db
```

---

## Docker Deployment

```bash
# Build image
docker build -t tpt-emergency .

# Run container
docker run -p 3000:3000 -p 5173:5173 tpt-emergency
```

Or using docker compose:
```bash
cd deploy
docker-compose up -d
```

---

## Troubleshooting

### Windows EBUSY Lock Error
If you receive `EBUSY: resource busy or locked` during build:
1. Close any running instances of `tpt-emergency-win.exe`
2. Delete locked dist folder manually
3. Re-run build command

### Port Already In Use
```bash
# Find process using port 5173
netstat -ano | findstr :5173

# Kill process
taskkill /F /PID <PID>