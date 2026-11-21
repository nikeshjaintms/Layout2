#!/usr/bin/env bash
set -e

echo "🚀 Starting Techomax Estate Deployment..."

# 1. Pull latest code
echo "📥 Pulling latest git changes..."
git pull origin main

# 2. Update Backend
echo "⚙️ Updating Backend..."
cd backend
npm install
npx prisma generate
npx prisma db push
npm run build
cd ..

# 3. Update Frontend
echo "🎨 Updating Frontend..."
cd frontend
npm install
npm run build
cd ..

# 4. Reload PM2 processes with zero downtime
echo "🔄 Reloading PM2 processes..."
pm2 reload ecosystem.config.js

echo "✅ Deployment completed successfully!"