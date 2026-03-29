#!/bin/bash
set -e

echo "=== Building Poker Accounting App ==="

# Build frontend
echo "[1/2] Building frontend..."
cd frontend
npm ci
npm run build
cd ..

# Build backend
echo "[2/2] Building backend..."
cd backend
npm ci
npm run build
cd ..

echo "=== Build complete ==="
