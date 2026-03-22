#!/bin/bash
set -e

echo "=== Building Poker Accounting App ==="

# Build frontend
echo "[1/2] Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Build backend
echo "[2/2] Building backend..."
cd backend
npm install
npm run build
cd ..

# Copy frontend dist to backend serve path (matches ServeStatic rootPath)
echo "Copying frontend dist..."
rm -rf backend/public
cp -r frontend/dist backend/public

echo "=== Build complete ==="
