# Production Deployment Guide: Techomax Estate Platform

This guide walks you through deploying the **Techomax Estate** application (Next.js 16 Frontend + NestJS Backend + PostgreSQL) onto an Ubuntu Linux server (Ubuntu 22.04 / 24.04 LTS).

---

## Architecture Overview

```
                        ┌─────────────────────────────────┐
                        │   Internet (Users / Browsers)   │
                        └───────────────┬─────────────────┘
                                        │ HTTPS (Port 443)
                                        ▼
                        ┌─────────────────────────────────┐
                        │     Nginx Web Server + SSL      │
                        │     (Reverse Proxy & Security)  │
                        └───────┬─────────────────┬───────┘
                                │                 │
        Proxy Pass to :3000     │                 │ Proxy Pass to :5000
                                ▼                 ▼
               ┌───────────────────────┐   ┌───────────────────────┐
               │    Next.js Frontend   │   │     NestJS Backend    │
               │   (PM2 Process: web)  │   │   (PM2 Process: api)  │
               └───────────────────────┘   └───────────┬───────────┘
                                                       │
                                                       ▼
                                           ┌───────────────────────┐
                                           │  PostgreSQL Database  │
                                           │      (Port 5432)      │
                                           └───────────────────────┘
```

---

## 1. Server Requirements

| Resource | Minimum | Recommended |
|---|---|---|
| **CPU** | 2 vCPU | 4 vCPU |
| **RAM** | 4 GB | 8 GB (for Next.js & native canvas build) |
| **Disk** | 40 GB SSD | 80 GB SSD |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |

---

## 2. Initial Server Preparation

Log in to your Ubuntu server as `root` or a `sudo` user:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential system build tools & libraries
# (Required for node-canvas, opencv-js, and image/CAD processing)
sudo apt install -y curl wget git build-essential python3 pkg-config \
  libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
  libpixman-1-dev ufw
```

---

## 3. Install Node.js (v20 or v22 LTS) & PM2

```bash
# Download and setup NodeSource repository for Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify versions
node -v  # Should be v20.x or higher
npm -v   # Should be v10.x or higher

# Install PM2 process manager globally
sudo npm install -g pm2
```

---

## 4. Install & Configure PostgreSQL

```bash
# Install PostgreSQL and contrib package
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to postgres user and create database + credentials
sudo -u postgres psql
```

Inside the PostgreSQL terminal (`psql`), run:

```sql
-- 1. Create a secure password for your database user
CREATE USER estate_admin WITH PASSWORD 'YourStrongDbPassword123#';

-- 2. Create the production database
CREATE DATABASE realestate OWNER estate_admin;

-- 3. Grant full privileges
GRANT ALL PRIVILEGES ON DATABASE realestate TO estate_admin;

-- 4. In PostgreSQL 15+, grant schema permissions
\c realestate
GRANT ALL ON SCHEMA public TO estate_admin;

-- Exit psql
\q
```

---

## 5. Clone the Project Repository

```bash
# Create web directory
sudo mkdir -p /var/www/estate
sudo chown -R $USER:$USER /var/www/estate

# Clone your repository
git clone <YOUR_GIT_REPOSITORY_URL> /var/www/estate
cd /var/www/estate
```

---

## 6. Backend Setup & Build

### 6.1 Configure Environment Variables

Navigate to the `backend` folder and create `.env`:

```bash
cd /var/www/estate/backend
nano .env
```

Paste your production environment settings:

```env
# Database connection
DATABASE_URL="postgresql://estate_admin:YourStrongDbPassword123#@127.0.0.1:5432/realestate?schema=public"

# Application Settings
NODE_ENV=production
PORT=5000

# Authentication JWT Secret (Use a strong random string)
JWT_SECRET="generate_a_long_random_64_character_secret_key_here"

# Cross-Subdomain Cookie Domain (Allows sharing cookies between api. and view-property.)
COOKIE_DOMAIN=".delawalagroup.com"

# Path to ODA Converter if converting DWG to DXF on Linux (Optional)
# ODA_CONVERTER_PATH="/usr/bin/ODAFileConverter"
```

Save and exit (`Ctrl + O`, `Enter`, `Ctrl + X`).

### 6.2 Install Dependencies & Seed Database

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Apply database schema to PostgreSQL
npx prisma db push

# Seed initial roles, permissions, and admin account
npm run seed
npm run seed:admin

# Build the production NestJS bundle
npm run build
```

> **Default Admin Account:**
> - **Email:** `admin@example.com`
> - **Password:** `Admin@123` *(Remember to change this immediately after first login)*

---

## 7. Frontend Setup & Build

### 7.1 Configure Environment Variables

Navigate to the `frontend` folder and create `.env.production`:

```bash
cd /var/www/estate/frontend
nano .env.production
```

Paste your production frontend settings:

```env
# If using subdomains:
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# OR if using a single domain with /api prefix:
# NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY_HERE"
```

Save and exit (`Ctrl + O`, `Enter`, `Ctrl + X`).

### 7.2 Install Dependencies & Build Next.js

```bash
# Install dependencies
npm install

# Build production Next.js application
npm run build
```

---

## 8. PM2 Process Manager Configuration

To ensure zero downtime, automatic restarts upon crash, and background process management, create an `ecosystem.config.js` file in the project root:

```bash
cd /var/www/estate
nano ecosystem.config.js
```

Paste the following PM2 configuration:

```javascript
module.exports = {
  apps: [
    {
      name: 'estate-backend',
      cwd: '/var/www/estate/backend',
      script: 'dist/main.js',
      instances: 'max',       // Utilize all available CPU cores
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
    {
      name: 'estate-frontend',
      cwd: '/var/www/estate/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1.5G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
```

### Start Services with PM2

```bash
# Start both applications
pm2 start ecosystem.config.js

# Verify running processes
pm2 status

# Save the process list so they automatically reboot on server restart
pm2 save

# Setup PM2 startup script on system boot
pm2 startup
# (Run the generated sudo command that PM2 prints in the terminal)
```

---

## 9. Nginx Reverse Proxy Setup

Install Nginx:

```bash
sudo apt install -y nginx
```

### Option A: Subdomain Setup (Recommended)
- **Frontend:** `https://yourdomain.com` (and `www.yourdomain.com`)
- **Backend API:** `https://api.yourdomain.com`

Create Nginx site configuration:

```bash
sudo nano /etc/nginx/sites-available/estate.conf
```

Paste the following configuration:

```nginx
# 1. FRONTEND: yourdomain.com
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 100M;

    # Gzip compression for high performance
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# 2. BACKEND API: api.yourdomain.com
server {
    listen 80;
    server_name api.yourdomain.com;

    client_max_body_size 100M;

    # Static architecture uploads
    location /architecture/ {
        alias /var/www/estate/backend/uploads/architecture/;
        access_log off;
        expires 30d;
    }

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Ensure cookies pass seamlessly
        proxy_cookie_path / "/; Secure; SameSite=Lax";
    }
}
```

Enable the configuration and reload Nginx:

```bash
# Link to sites-enabled
sudo ln -s /etc/nginx/sites-available/estate.conf /etc/nginx/sites-enabled/

# Test syntax
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 10. Enable SSL Certificates (HTTPS with Certbot)

Install Certbot and get free SSL certificates from Let's Encrypt:

```bash
# Install Certbot and its Nginx plugin
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificates and let Certbot configure Nginx automatically
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Verify auto-renewal timer
sudo systemctl status certbot.timer
```

---

## 11. Firewall Configuration (UFW)

Protect your server by only allowing necessary ports:

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable
sudo ufw status
```

---

## 12. Zero-Downtime Deployment Script (`deploy.sh`)

Create a quick deploy script in `/var/www/estate/deploy.sh` for future updates:

```bash
nano /var/www/estate/deploy.sh
```

Paste:

```bash
#!/usr/bin/env bash
set -e

echo "🚀 Starting Techomax Estate Deployment..."

cd /var/www/estate

# 1. Pull latest code
echo "📥 Pulling latest git changes..."
git pull origin main

# 2. Update Backend
echo "⚙️ Updating Backend..."
cd /var/www/estate/backend
npm install --omit=dev
npx prisma generate
npx prisma db push
npm run build

# 3. Update Frontend
echo "🎨 Updating Frontend..."
cd /var/www/estate/frontend
npm install
npm run build

# 4. Reload PM2 processes with zero downtime
echo "🔄 Reloading PM2 processes..."
cd /var/www/estate
pm2 reload ecosystem.config.js

echo "✅ Deployment completed successfully!"
```

Make the script executable:

```bash
chmod +x /var/www/estate/deploy.sh
```

To deploy future updates, simply run:
```bash
/var/www/estate/deploy.sh
```

---

## 13. Automated Database Backup (Daily Cron Job)

Create a backup script:

```bash
mkdir -p ~/backups
nano ~/backup-db.sh
```

Paste:

```bash
#!/bin/bash
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)
PGPASSWORD="YourStrongDbPassword123#" pg_dump -U estate_admin -h 127.0.0.1 realestate > "$BACKUP_DIR/realestate_$DATE.sql"

# Keep only the last 7 days of backups
find $BACKUP_DIR -type f -name "*.sql" -mtime +7 -delete
```

Make it executable and add to crontab:

```bash
chmod +x ~/backup-db.sh
crontab -e
```

Add this line to run daily at 2:00 AM:
```cron
0 2 * * * /bin/bash ~/backup-db.sh
```

---

## 14. Useful Maintenance Commands

| Task | Command |
|---|---|
| Check app status | `pm2 status` |
| View backend logs | `pm2 logs estate-backend` |
| View frontend logs | `pm2 logs estate-frontend` |
| Restart backend | `pm2 restart estate-backend` |
| Restart frontend | `pm2 restart estate-frontend` |
| Check Nginx status | `sudo systemctl status nginx` |
| Check Nginx access/error logs | `sudo tail -f /var/log/nginx/error.log` |
| Restart PostgreSQL | `sudo systemctl restart postgresql` |
