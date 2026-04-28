# 🚀 Deployment Methods

TPT Emergency System supports multiple deployment options for different use cases:

---

## 🟢 Method 1: Single Executable File (Recommended)

✅ Zero installation, zero dependencies, double click to run.

Build command:
```bash
npm install
npm run build:all
```

Output files will be created in `dist/bin/`:
- `tpt-emergency-win.exe` (Windows 64-bit)
- `tpt-emergency-macos` (MacOS Intel)
- `tpt-emergency-linux` (Linux 64-bit)

Just run the executable, system will automatically start and open browser.

---

## 🟢 Method 2: Standard Node.js Installation

Works on all operating systems with Node.js 18+ installed:

```bash
git clone https://github.com/PhillipC05/tpt-emergency.git
cd tpt-emergency
npm install --production
npm run build
npm start
```

System will be available at `http://localhost:3000`

---

## 🟢 Method 3: Static Single HTML File

Complete application as a single standalone HTML file that runs directly in any browser without any server:

```bash
npm run build:singlehtml
```

Output: `dist/tpt-emergency.html`

This file can be opened directly, emailed, shared on USB drives. All functionality works locally in browser.

---

## 🟢 Method 4: Linux Systemd Service

For permanent server installation:

```bash
# Install application
sudo mkdir -p /opt/tpt-emergency
sudo cp -r . /opt/tpt-emergency
cd /opt/tpt-emergency
npm install --production
npm run build

# Install service
sudo cp deploy/tpt-emergency.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now tpt-emergency
```

Check status:
```bash
sudo systemctl status tpt-emergency
journalctl -u tpt-emergency -f
```

---

## 🟢 Method 5: Raspberry Pi Deployment

Raspberry Pi OS (Bookworm 64-bit):

```bash
# Install dependencies
sudo apt update && sudo apt install -y nodejs npm git

# Install application
git clone https://github.com/PhillipC05/tpt-emergency.git
cd tpt-emergency
npm install
npm run build:exe

# Install as service
sudo cp deploy/tpt-emergency.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now tpt-emergency
```

✅ Optimized for Raspberry Pi 3B+, 4, 5. Runs on < 50MB RAM idle.

---

## 🟢 Method 6: Docker Container

```bash
# Build and run
docker build -t tpt-emergency .
docker run -d -p 3000:3000 -v ./data:/app/data --restart unless-stopped tpt-emergency
```

Or using docker-compose:
```bash
cd deploy
docker-compose up -d
```

---

## 🟢 Method 7: One Click Cloud Deployment

| Provider | Button |
|---|---|
| DigitalOcean | [Deploy to DigitalOcean](https://cloud.digitalocean.com/apps/new?repo=https://github.com/PhillipC05/tpt-emergency.git) |
| Render | [Deploy to Render](https://render.com/deploy?repo=https://github.com/PhillipC05/tpt-emergency.git) |
| Fly.io | [Deploy to Fly.io](https://fly.io/deploy) |
| Vercel | [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https://github.com/PhillipC05/tpt-emergency.git) |

---

## 📋 Deployment Configuration

All configuration is optional, system works with zero configuration.

Optional environment variables:
```
PORT=3000
NODE_ENV=production
DB_PATH=./emergency.db
MAX_UPLOAD_SIZE=100mb
```

---

## ✅ Post Deployment Checks

1.  Open `http://server-ip:3000`
2.  Verify offline indicator shows connected
3.  Test creating a test incident
4.  Verify database file is being created
5.  Check browser console for errors

---

## 🔒 Security Notes

- This system is designed for closed private networks
- Do not expose directly to public internet without reverse proxy
- Use HTTPS for production deployments
- All data stays on your server, no external connections required