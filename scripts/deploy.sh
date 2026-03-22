#!/bin/bash
set -e

echo "=== Deploying Poker Accounting to serv00 ==="

# Prerequisites check
if ! command -v pm2 &> /dev/null; then
  echo "Installing PM2..."
  npm install -g pm2
fi

# Create data directory for SQLite
mkdir -p backend/data
mkdir -p logs

# Build
echo "[1/3] Building..."
bash scripts/build.sh

# Verify build output
echo "Verifying build..."
if [ ! -f backend/dist/main.js ]; then
  echo "ERROR: backend/dist/main.js not found. Backend build failed."
  exit 1
fi
if [ ! -f backend/public/index.html ]; then
  echo "ERROR: backend/public/index.html not found. Frontend build or copy failed."
  exit 1
fi
echo "Build verification passed."

# Check .env
if [ ! -f backend/.env ]; then
  echo "ERROR: backend/.env not found. Copy from backend/.env.production.example and configure."
  exit 1
fi

# Start/Restart with PM2
echo "[2/3] Starting with PM2..."
pm2 delete poker-accounting 2>/dev/null || true
pm2 start ecosystem.config.js --env production

echo "[3/3] Saving PM2 process list..."
pm2 save

echo "=== Deployment complete ==="
echo "Check status: pm2 status"
echo "Check logs: pm2 logs poker-accounting"
